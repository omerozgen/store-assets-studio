/**
 * Panorama motoru — bir ekran görüntüsü SETİNİ tek bir geniş HTML tuvaline çevirir.
 *
 * Kilit fikir: N panelli set, genişliği N×W olan TEK bir tuval olarak kurulur.
 * Arka plan, dekor, başlıklar ve (açılı olabilen) cihazlar hep bu tuvale mutlak
 * konumlanır. Export sırasında tuval N parçaya (clip) dilimlenir; parça i = [i*W, (i+1)*W].
 * Sınıra denk gelen bir cihaz/şekil iki panele bölünür → "birbirini tamamlıyor" efekti
 * fiziksel dilimlemeden bedavaya gelir. Her şey tek koordinat uzayında yazıldığı için
 * süreklilik garanti; editör de aynı tuvali önizler → WYSIWYG.
 *
 * İzomorfik: saf string üretir, node ve tarayıcıda aynı çalışır.
 */
import { escapeHtml, backgroundCss, type Background } from "./util.ts";
import { phoneMockupHtml, tabletMockupHtml, PHONE_ASPECT } from "@sas/device-frames";

/**
 * Dekor şekilleri — geniş tuvale yayılır, panel seam'lerini geçebilir (süreklilik).
 * Konum/boyut oranlı: xFrac tüm panorama genişliğine, yFrac & boyutlar panel
 * yüksekliğine göredir.
 */
export type Decor =
  | { type: "blob"; xFrac: number; yFrac: number; sizeFrac: number; color: string; blurFrac?: number; opacity?: number }
  | { type: "circle"; xFrac: number; yFrac: number; sizeFrac: number; color: string; opacity?: number }
  | { type: "ring"; xFrac: number; yFrac: number; sizeFrac: number; color: string; thicknessFrac?: number; opacity?: number }
  | { type: "stripe"; xFrac: number; yFrac: number; wFrac: number; hFrac: number; color: string; angleDeg?: number; opacity?: number }
  | { type: "dots"; xFrac: number; yFrac: number; wFrac: number; hFrac: number; color: string; gapFrac?: number; opacity?: number };

/** Geriye dönük uyum. */
export type DecorBlob = Extract<Decor, { type: "blob" }>;

export type Theme = {
  id: string;
  name: string;
  /** Panorama boyunca akan arka plan (geniş tuvale uygulanır). */
  background: Background;
  /** Opsiyonel dekor şekilleri — tuval geneline yayılır, seam'leri geçebilir. */
  decor?: Decor[];
  font: {
    family: string;
    /** Başlık boyutu, panel yüksekliğinin yüzdesi. */
    captionSizePct: number;
    weight: number;
    color: string;
  };
  caption: { position: "top" | "bottom" };
  device: {
    pose: "flat" | "angled";
    /** Açılı duruşta Y ekseni eğimi (derece). */
    tiltDeg?: number;
    /** Açılı duruşta X ekseni eğimi (öne/arkaya yatma). */
    tiltXDeg?: number;
    /** Düzlemde sağa/sola yatıklık (Z ekseni, "lean"). + = sağa, - = sola. */
    leanDeg?: number;
    /** Gövde kalınlığı (derinlik), genişliğin yüzdesi. */
    thicknessPct?: number;
    /**
     * centered = her panelde ortalı; cascade = köşegen akış (hafif kayma);
     * straddle = cihazlar panel SINIRINA (seam) oturur → mağazada telefon
     * yan yana görseller arasında ikiye bölünmüş görünür (hero düzen).
     */
    arrangement: "centered" | "cascade" | "straddle";
    /** Cihaz genişliği, panel genişliğinin yüzdesi. */
    widthPct: number;
    /** Gerçekçi çerçeve gövde tonu. */
    finish?: "titanium" | "black" | "silver";
    /** Cihaz yönü: dikey (varsayılan) veya yatay (90° yan). */
    orientation?: "portrait" | "landscape";
  };
};

export type Panel = {
  /** URL veya data URI. */
  screenshotSrc: string;
  caption?: string;
  /** Başlık serbest konumu (panel oranı 0..1). Verilmezse tema varsayılanı (üst/alt, ortalı). */
  captionXFrac?: number; // metin bloğunun yatay MERKEZİ
  captionYFrac?: number; // metin bloğunun ÜST kenarı
  /** Cihaz serbest konumu (panel oranı 0..1, MERKEZ). Verilmezse yerleşim (arrangement) belirler. */
  deviceXFrac?: number;
  deviceYFrac?: number;
};

export type ScreenshotSet = {
  themeId: string;
  themeOverrides?: DeepPartial<Theme>;
  panels: Panel[];
};

export type Rect = { x: number; y: number; width: number; height: number };

export type RenderSetResult = {
  /** Tam HTML belgesi (geniş tuval). */
  wideHtml: string;
  /** Mantıksal viewport (Playwright'a verilir). */
  viewport: { width: number; height: number };
  /** Panel başına dilim dikdörtgeni (mantıksal koordinat). */
  clips: Rect[];
  /** Panel başına kullanılan cihaz merkezi (panel oranı 0..1). Editör tutamağı için. */
  deviceCenters: { x: number; y: number }[];
};

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

/** Tema üzerine sığ+derin override uygular (galeriden seç → özelleştir). */
export function mergeTheme(base: Theme, overrides?: DeepPartial<Theme>): Theme {
  if (!overrides) return base;
  return {
    ...base,
    ...overrides,
    background: (overrides.background as Background) ?? base.background,
    decor: (overrides.decor as DecorBlob[]) ?? base.decor,
    font: { ...base.font, ...overrides.font },
    caption: { ...base.caption, ...overrides.caption },
    device: { ...base.device, ...overrides.device },
  };
}

/**
 * Bir seti geniş panorama tuvaline + dilim dikdörtgenlerine çevirir.
 * @param panel  Mantıksal (CSS) panel boyutu — store-specs.logicalViewport'tan gelir.
 */
export function renderSet(
  theme: Theme,
  panels: Panel[],
  panel: { width: number; height: number },
  deviceKind: "phone" | "tablet" = "phone",
): RenderSetResult {
  const N = Math.max(1, panels.length);
  const W = panel.width;
  const H = panel.height;
  const canvasW = N * W;

  const clips: Rect[] = [];
  for (let i = 0; i < N; i++) clips.push({ x: i * W, y: 0, width: W, height: H });

  const bg = backgroundCss(theme.background);
  const dev = theme.device;
  const isTablet = deviceKind === "tablet";
  const landscape = !isTablet && dev.orientation === "landscape";
  // Cihaz boyutu. Tablet: panel (hedef) oranına uyar, daha geniş durur.
  // Telefon yatay: 90° döndüğü için uzun kenar panel genişliğine göre ölçeklenir.
  let deviceW: number;
  let deviceH: number;
  if (isTablet) {
    deviceW = W * Math.min(0.9, (dev.widthPct / 100) * 1.3);
    deviceH = deviceW * (H / W); // panel/hedef oranı (iPad ~1.33, yatay tablet <1)
  } else if (landscape) {
    const longPx = (dev.widthPct / 100) * W * 1.55;
    deviceW = longPx / PHONE_ASPECT;
    deviceH = deviceW * PHONE_ASPECT;
  } else {
    deviceW = (dev.widthPct / 100) * W;
    deviceH = deviceW * PHONE_ASPECT;
  }

  // Dekor katmanı (blob / circle / ring / stripe / dots) — tuval geneline yayılır.
  const decorHtml = (theme.decor ?? [])
    .map((d) => {
      const base = (w: number, h: number, x: number, y: number, extra: string) =>
        `<div style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;opacity:${
          d.opacity ?? 0.5
        };${extra}"></div>`;
      if (d.type === "blob") {
        const s = d.sizeFrac * H;
        return base(s, s, d.xFrac * canvasW - s / 2, d.yFrac * H - s / 2,
          `background:${d.color};border-radius:50%;filter:blur(${(d.blurFrac ?? 0.08) * H}px);`);
      }
      if (d.type === "circle") {
        const s = d.sizeFrac * H;
        return base(s, s, d.xFrac * canvasW - s / 2, d.yFrac * H - s / 2,
          `background:${d.color};border-radius:50%;`);
      }
      if (d.type === "ring") {
        const s = d.sizeFrac * H;
        const t = (d.thicknessFrac ?? 0.012) * H;
        return base(s, s, d.xFrac * canvasW - s / 2, d.yFrac * H - s / 2,
          `border:${t}px solid ${d.color};border-radius:50%;`);
      }
      if (d.type === "stripe") {
        const w = d.wFrac * canvasW;
        const h = d.hFrac * H;
        return base(w, h, d.xFrac * canvasW - w / 2, d.yFrac * H - h / 2,
          `background:${d.color};border-radius:${h / 2}px;transform:rotate(${d.angleDeg ?? 0}deg);`);
      }
      // dots — nokta deseni yaması
      const w = d.wFrac * canvasW;
      const h = d.hFrac * H;
      const gap = (d.gapFrac ?? 0.05) * H;
      const dot = Math.max(2, gap * 0.22);
      return base(w, h, d.xFrac * canvasW - w / 2, d.yFrac * H - h / 2,
        `background-image:radial-gradient(${d.color} ${dot}px, transparent ${dot}px);background-size:${gap}px ${gap}px;`);
    })
    .join("\n");

  // Panel içerikleri (başlık + cihaz), geniş tuvale mutlak konumlanır.
  const deviceCenters: { x: number; y: number }[] = [];
  const items = panels
    .map((p, i) => {
      const panelCenterX = i * W + W / 2;

      // Yerleşim: cascade = köşegen kayma; straddle = seam üstü (bölünmüş hero).
      const cascade = dev.arrangement === "cascade";
      const straddle = dev.arrangement === "straddle";
      const spread = (i - (N - 1) / 2); // merkeze göre -.. 0 .. +
      const xDrift = cascade ? spread * W * 0.06 : 0;
      const yDrift = cascade ? spread * H * 0.035 : 0;

      const tiltY = dev.pose === "angled" ? (dev.tiltDeg ?? 16) : 0;
      const tiltX = dev.pose === "angled" ? (dev.tiltXDeg ?? 3) : 0;

      // Cihaz konumu. Manuel override (deviceXFrac/YFrac) varsa yerleşimi geçersiz kılar.
      // straddle: cihaz merkezi panelin SAĞ sınırına (seam) oturur → telefon bölünür.
      const capPos = theme.caption.position;
      const hasDevPos = p.deviceXFrac != null && p.deviceYFrac != null;
      const deviceCenterX = hasDevPos
        ? i * W + p.deviceXFrac! * W
        : straddle
          ? (i + 1) * W
          : panelCenterX + xDrift;
      const deviceCenterY = hasDevPos
        ? p.deviceYFrac! * H
        : (isTablet ? (capPos === "top" ? H * 0.58 : H * 0.46) : straddle ? H * 0.55 : capPos === "top" ? H * 0.6 : H * 0.44) +
          yDrift;
      deviceCenters.push({ x: (deviceCenterX - i * W) / W, y: deviceCenterY / H });
      const deviceLeft = deviceCenterX - deviceW / 2;
      const deviceTop = deviceCenterY - deviceH / 2;

      const capSize = (theme.font.captionSizePct / 100) * H;
      // Serbest konum verilmişse onu kullan; yoksa tema varsayılanı (üst/alt, ortalı).
      const hasPos = p.captionXFrac != null && p.captionYFrac != null;
      const capTop = hasPos ? p.captionYFrac! * H : capPos === "top" ? H * 0.05 : H * 0.82;
      const capLeft = hasPos ? i * W + p.captionXFrac! * W : i * W + W * 0.07;
      const capTransform = hasPos ? "translateX(-50%)" : "none";

      const captionHtml = p.caption
        ? `<div style="position:absolute;left:${capLeft}px;top:${capTop}px;width:${W * 0.86}px;transform:${capTransform};
            color:${theme.font.color};font-size:${capSize}px;font-weight:${theme.font.weight};
            font-family:${theme.font.family};line-height:1.12;text-align:center;text-wrap:balance;
            z-index:3;text-shadow:0 ${H * 0.004}px ${H * 0.02}px rgba(0,0,0,0.25);">${escapeHtml(p.caption)}</div>`
        : "";

      // 3B derinlikli mockup (telefon veya tablet). Perspektif üst kapsayıcıda;
      // gölge preserve-3d'yi düzleştirmemek için AYRI kardeş eleman.
      const common = {
        id: `p${i}`,
        screenshotSrc: p.screenshotSrc,
        finish: dev.finish ?? "titanium",
        widthPx: deviceW,
        heightPx: deviceH,
        tiltYDeg: tiltY,
        tiltXDeg: tiltX,
        rotateDeg: dev.leanDeg ?? 0,
      };
      const mockup = isTablet
        ? tabletMockupHtml({ ...common, thicknessPct: dev.thicknessPct ?? 6 })
        : phoneMockupHtml({ ...common, thicknessPct: dev.thicknessPct ?? 8, landscape });
      const deviceHtml = `<div style="position:absolute;left:${deviceLeft}px;top:${deviceTop}px;
          width:${deviceW}px;height:${deviceH}px;perspective:${deviceW * 4}px;z-index:2;">
          <div style="position:absolute;left:4%;top:74%;width:92%;height:22%;
            background:radial-gradient(50% 50% at 50% 50%, rgba(0,0,0,0.55), rgba(0,0,0,0));
            filter:blur(${H * 0.012}px);z-index:0;"></div>
          ${mockup}
        </div>`;

      return captionHtml + deviceHtml;
    })
    .join("\n");

  const wideHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  .canvas {
    position: relative;
    width: ${canvasW}px;
    height: ${H}px;
    background: ${bg};
    overflow: hidden;
    font-family: ${theme.font.family};
  }
</style>
</head>
<body>
  <div class="canvas">
    ${decorHtml}
    ${items}
  </div>
</body>
</html>`;

  return { wideHtml, viewport: { width: canvasW, height: H }, clips, deviceCenters };
}
