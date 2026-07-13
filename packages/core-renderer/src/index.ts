/**
 * core-renderer — İZOMORFİK render motoru. Kalbin burası.
 *
 * Bir Scene JSON'unu tam bir HTML belgesine çevirir. Aynı fonksiyon:
 *   - tarayıcıda (editör canlı önizleme) çalışır,
 *   - node/Playwright'ta (final PNG export) çalışır.
 * Böylece "önizlemede gördüğün = export edilen" (WYSIWYG) garanti olur.
 *
 * Ölçüm birimi: sahne, mantıksal (CSS) viewport boyutuna (width×height, px)
 * göre kurulur. Boyut-bağımsızlık için ölçüler viewport'a oranlı (vw/vh) verilir;
 * böylece aynı sahne farklı hedeflerde (telefon/tablet/feature-graphic) ölçeklenir.
 */

export type Background =
  | { type: "solid"; color: string }
  | { type: "gradient"; colors: string[]; angle?: number };

export type Caption = {
  text: string;
  color?: string;
  /** viewport genişliğinin yüzdesi olarak font boyutu (ör. 6 = %6). */
  sizePct?: number;
  weight?: number;
  fontFamily?: string;
  /** "top" | "bottom" — metnin ekran görüntüsüne göre konumu. */
  position?: "top" | "bottom";
};

export type Screenshot = {
  /** URL veya data URI (ör. data:image/png;base64,... ya da SVG data URI). */
  src: string;
  /** Basit CSS telefon çerçevesi. false ise çerçevesiz (feature graphic/icon). */
  frame?: boolean;
  frameColor?: string;
  /** Köşe yuvarlaklığı, viewport genişliğinin yüzdesi. */
  cornerPct?: number;
};

export type Scene = {
  background: Background;
  caption?: Caption;
  screenshot?: Screenshot;
  /** İç kenar boşluğu, viewport genişliğinin yüzdesi. */
  paddingPct?: number;
};

export type Viewport = { width: number; height: number };

// Panorama motoru (çok panelli set → geniş tuval + dilimler).
export * from "./set.ts";
// Tekil varlıklar: feature graphic + icon.
export * from "./assets.ts";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function backgroundCss(bg: Background): string {
  if (bg.type === "solid") return bg.color;
  const angle = bg.angle ?? 135;
  return `linear-gradient(${angle}deg, ${bg.colors.join(", ")})`;
}

/**
 * Sahneyi tam bir HTML belgesine çevirir. Salt fonksiyon, yan etkisiz.
 * viewport: mantıksal CSS boyutu (store-specs logicalViewport'tan gelir).
 */
export function renderScene(scene: Scene, viewport: Viewport): string {
  const pad = scene.paddingPct ?? 8;
  const bg = backgroundCss(scene.background);

  const caption = scene.caption;
  const capSize = caption?.sizePct ?? 6;
  const capColor = caption?.color ?? "#ffffff";
  const capWeight = caption?.weight ?? 700;
  const capFamily =
    caption?.fontFamily ??
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  const capPos = caption?.position ?? "top";

  const shot = scene.screenshot;
  const frame = shot?.frame ?? true;
  const frameColor = shot?.frameColor ?? "#111111";
  const cornerPct = shot?.cornerPct ?? 8;

  const captionHtml = caption
    ? `<div class="caption">${escapeHtml(caption.text)}</div>`
    : "";

  const shotHtml = shot
    ? `<div class="shot ${frame ? "framed" : ""}"><img src="${shot.src}" alt="" /></div>`
    : "";

  // capPos'a göre sıralama: flex column, caption üstte veya altta.
  const stackOrder =
    capPos === "top" ? `${captionHtml}${shotHtml}` : `${shotHtml}${captionHtml}`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; }
  body {
    width: ${viewport.width}px;
    height: ${viewport.height}px;
    background: ${bg};
    font-family: ${capFamily};
    overflow: hidden;
  }
  .stage {
    width: 100%;
    height: 100%;
    padding: ${pad}vw;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: ${pad / 2}vw;
  }
  .caption {
    color: ${capColor};
    font-size: ${capSize}vw;
    font-weight: ${capWeight};
    line-height: 1.15;
    text-align: center;
    text-wrap: balance;
    flex: 0 0 auto;
    max-width: 92%;
  }
  .shot {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
  }
  .shot img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    border-radius: ${cornerPct}vw;
    display: block;
  }
  .shot.framed img {
    border: 1.2vw solid ${frameColor};
    box-shadow: 0 2vw 6vw rgba(0,0,0,0.35);
  }
</style>
</head>
<body>
  <div class="stage">
    ${stackOrder}
  </div>
</body>
</html>`;
}

/** Kolay demo/placeholder: renkli, metinli bir SVG'yi data URI olarak üretir. */
export function placeholderScreenshot(
  w: number,
  h: number,
  label: string,
  color = "#4f46e5",
): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect width="${w}" height="${h}" fill="${color}"/>
    <rect x="0" y="0" width="${w}" height="${Math.round(h * 0.12)}" fill="rgba(255,255,255,0.15)"/>
    <text x="50%" y="50%" fill="#ffffff" font-family="sans-serif" font-size="${Math.round(w * 0.08)}" font-weight="700" text-anchor="middle" dominant-baseline="middle">${escapeHtml(label)}</text>
  </svg>`;
  // encodeURIComponent → hem node hem tarayıcıda çalışır (Buffer'a bağımlı değil).
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
