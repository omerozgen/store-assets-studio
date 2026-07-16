/**
 * device-frames — foto-gerçekçi, vektörel (SVG) cihaz çerçeveleri.
 *
 * Neden SVG: "render wide → deviceScaleFactor ile ekran görüntüsü" akışında
 * vektör her çözünürlükte keskin kalır; PNG mockup'ların aksine bulanıklaşmaz
 * ve telifsizdir (jenerik ama modern telefon silüeti).
 *
 * Gerçekçilik katmanları (alttan üste):
 *   1) Satine titanyum ray — ışık fasetli metalik gradient + parlak kenar highlight
 *   2) İnce siyah bezel
 *   3) Ekran görüntüsü (ekran alanına clip, cover)
 *   4) Ekran iç gölgesi (vignette) — camın çukurluk hissi
 *   5) Cam yansıması (diagonal glare streak) — "gerçek mockup" işareti
 *   6) Dynamic Island + lens yansıması
 *   7) Yan tuşlar (highlight'lı)
 */

/** SVG viewBox — gövde 0..1000 genişlikte; tuşların taşması için kenarlarda pay var. */
export const PHONE_VIEWBOX = { minX: -12, minY: -10, width: 1024, height: 2060 } as const;
/** Çerçevenin en/boy oranı (yükseklik / genişlik). set.ts cihaz boyutunu buna göre kurar. */
export const PHONE_ASPECT = PHONE_VIEWBOX.height / PHONE_VIEWBOX.width; // ≈ 2.012

export type PhoneFrameOptions = {
  /** Aynı sayfada birden çok cihaz olduğunda id çakışmasını önler. */
  id: string;
  /** Ekran içeriği (URL veya data URI). */
  screenshotSrc: string;
  /** Gövde tonu. */
  finish?: "titanium" | "black" | "silver";
  /**
   * Yatay ekran içeriği: cihaz 90° yan yatırılınca (bkz. phoneMockupHtml landscape)
   * ekran görüntüsü DÜZGÜN görünsün diye, çerçeve içindeki görüntü ters-döndürülür.
   * Kullanıcı yatay (geniş) ekran görüntüsü verir.
   */
  landscape?: boolean;
};

/** Her ton için satine ray gradient durakları (ışık/gölge fasetleri). */
const RAILS: Record<string, string[]> = {
  // 7 durak: kenar parlak → orta koyu bant → kenar parlak (fırçalı metal hissi)
  titanium: ["#7d7d82", "#3a3a3e", "#54545a", "#2a2a2e", "#4a4a50", "#1c1c20", "#43434a"],
  black: ["#4a4a4e", "#161618", "#2c2c30", "#0c0c0e", "#242428", "#050506", "#2a2a2e"],
  silver: ["#ffffff", "#c2c2c8", "#e6e6ea", "#a8a8b0", "#d8d8de", "#8e8e96", "#e0e0e6"],
};

// Foto-gerçekçi çerçeve compositing (frame PNG + screen quad → matrix3d).
export * from "./composite.ts";

/** Cihaz yan kenarının (rail) metalik tonları: [ışık, koyu]. */
const EDGE_COLORS: Record<string, [string, string]> = {
  titanium: ["#43434a", "#141416"],
  black: ["#26262a", "#050506"],
  silver: ["#cfcfd5", "#74747c"],
};

/** Attribute bağlamı için kaçış (src/href). core-renderer'a bağımlılık kurmamak için yerel. */
function escAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function lerpHex(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const p = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return "#" + p.map((v) => v.toString(16).padStart(2, "0")).join("");
}

export type PhoneMockupOptions = {
  id: string;
  screenshotSrc: string;
  finish?: "titanium" | "black" | "silver";
  /** Saran kutunun px boyutu — translateZ (kalınlık) ve köşe yarıçapı için gerekir. */
  widthPx: number;
  heightPx: number;
  /** Y ekseni dönüşü (sağ/sol yana yatma). */
  tiltYDeg?: number;
  /** X ekseni dönüşü (öne/arkaya yatma). */
  tiltXDeg?: number;
  /** Z ekseni dönüşü (düzlemde döndürme). */
  rotateDeg?: number;
  /** Gövde kalınlığı, genişliğin yüzdesi (derinlik miktarı). */
  thicknessPct?: number;
  /** Yatay yön: cihaz 90° yan yatar, ekran görüntüsü düzgün (yatay) kalır. */
  landscape?: boolean;
};

/**
 * Gerçek 3B DERİNLİKLİ telefon mockup'ı. Ön yüz (SVG çerçeve) + yuvarlak köşeleri
 * takip eden katmanlı "extrusion" (yan gövde kalınlığı) preserve-3d ile birleştirilir;
 * cihaz döndürülünce kenardaki metalik kalınlık görünür → hacim/derinlik hissi.
 *
 * Dönen blok: preserve-3d bir <div>. ÜST kapsayıcıya `perspective` CSS'i uygulanmalı
 * (set.ts yapar); bu blok üzerinde `filter` KULLANMA (3B'yi düzleştirir).
 */
export function phoneMockupHtml(opts: PhoneMockupOptions): string {
  const { id, screenshotSrc, widthPx, heightPx } = opts;
  const finish = opts.finish ?? "titanium";
  const tiltY = opts.tiltYDeg ?? 0;
  const tiltX = opts.tiltXDeg ?? 0;
  // Yatay: cihazı 90° çevir; ekran görüntüsü çerçeve içinde ters-döndürülür (upright kalır).
  const lean = opts.rotateDeg ?? 0;
  const land = opts.landscape ? 90 : 0;
  const thickness = (widthPx * (opts.thicknessPct ?? 8)) / 100;

  const [edgeLight, edgeDark] = EDGE_COLORS[finish];

  // Extrusion geometrisi (PHONE_VIEWBOX marjlarına göre gövdeyle hizalı).
  const insetL = widthPx * (12 / PHONE_VIEWBOX.width);
  const insetT = heightPx * (10 / PHONE_VIEWBOX.height);
  const bodyW = widthPx - insetL * 2;
  const bodyH = heightPx - insetT * 2;
  const radius = widthPx * (190 / PHONE_VIEWBOX.width);

  const N = Math.min(22, Math.max(10, Math.round(thickness / 2)));
  let layers = "";
  for (let k = 0; k < N; k++) {
    const z = -((k + 1) / N) * thickness;
    // Nearest-to-front (k=0) parlak, derinleştikçe koyu → yuvarlak metal kenar hissi.
    const col = lerpHex(edgeLight, edgeDark, Math.pow(k / (N - 1), 0.7));
    layers += `<div style="position:absolute;left:${insetL}px;top:${insetT}px;width:${bodyW}px;height:${bodyH}px;
      border-radius:${radius}px;background:${col};transform:translateZ(${z.toFixed(2)}px);"></div>`;
  }

  const front = phoneFrameSvg({ id, screenshotSrc, finish, landscape: opts.landscape });

  // Açı (tilt/lean) CSS değişkenlerinden okunur → editör, belgeyi yeniden kurmadan
  // .canvas üzerindeki --tilt/--lean/--tiltx/--land'i canlı güncelleyerek 60fps döndürür.
  // Fallback = baked değer: set.ts .canvas'a değişkenleri basar, standalone demo'da da doğru kalır.
  return `<div style="position:absolute;inset:0;transform-style:preserve-3d;
      transform:rotateZ(calc(var(--lean, ${lean}deg) + var(--land, ${land}deg))) rotateX(var(--tiltx, ${tiltX}deg)) rotateY(var(--tilt, ${tiltY}deg));">
    ${layers}
    <div style="position:absolute;inset:0;transform:translateZ(0.6px);">${front}</div>
  </div>`;
}

export type TabletMockupOptions = {
  id: string;
  screenshotSrc: string;
  finish?: "titanium" | "black" | "silver";
  widthPx: number;
  heightPx: number;
  tiltYDeg?: number;
  tiltXDeg?: number;
  rotateDeg?: number;
  thicknessPct?: number;
};

/**
 * TABLET (iPad benzeri) 3B derinlikli mockup. Yön-bağımsız: widthPx×heightPx kutuyu
 * doldurur (dikey veya yatay). İnce uniform bezel + ön kamera + metalik kenar + derinlik.
 * phoneMockupHtml ile aynı kullanım: preserve-3d blok, perspective üst kapsayıcıda.
 */
export function tabletMockupHtml(opts: TabletMockupOptions): string {
  const { screenshotSrc, widthPx: W, heightPx: H } = opts;
  const finish = opts.finish ?? "titanium";
  const rot = opts.rotateDeg ?? 0;
  const tiltY = opts.tiltYDeg ?? 0;
  const tiltX = opts.tiltXDeg ?? 0;
  const rail = RAILS[finish];
  const [edgeLight, edgeDark] = EDGE_COLORS[finish];

  const min = Math.min(W, H);
  const radius = min * 0.055;
  const railW = min * 0.012; // metalik kenar
  const bezel = min * 0.03; // siyah bezel
  const inset = railW + bezel;
  const screenR = Math.max(2, radius - inset);
  const thickness = (min * (opts.thicknessPct ?? 6)) / 100;

  // Derinlik extrusion katmanları.
  const N = Math.min(20, Math.max(8, Math.round(thickness / 2)));
  let layers = "";
  for (let k = 0; k < N; k++) {
    const z = -((k + 1) / N) * thickness;
    const col = lerpHex(edgeLight, edgeDark, Math.pow(k / (N - 1), 0.7));
    layers += `<div style="position:absolute;inset:0;border-radius:${radius}px;background:${col};transform:translateZ(${z.toFixed(2)}px);"></div>`;
  }

  const bodyGrad = `linear-gradient(135deg, ${rail[0]}, ${rail[3]}, ${rail[2]}, ${rail[5]}, ${rail[6]})`;
  const front = `<div style="position:absolute;inset:0;transform:translateZ(0.6px);border-radius:${radius}px;
      background:${bodyGrad};box-shadow:inset 0 0 0 1px rgba(255,255,255,0.15);">
    <div style="position:absolute;inset:${railW}px;border-radius:${radius - railW}px;background:#050506;"></div>
    <div style="position:absolute;inset:${inset}px;border-radius:${screenR}px;overflow:hidden;background:#000;">
      <img src="${escAttr(screenshotSrc)}" style="width:100%;height:100%;object-fit:cover;display:block;"/>
      <div style="position:absolute;inset:0;background:linear-gradient(120deg, rgba(255,255,255,0.14), rgba(255,255,255,0) 45%);"></div>
    </div>
    <!-- ön kamera (üst-orta) -->
    <div style="position:absolute;top:${bezel * 0.35}px;left:50%;transform:translateX(-50%);
      width:${min * 0.012}px;height:${min * 0.012}px;border-radius:50%;background:#0b0b14;box-shadow:0 0 0 1px rgba(255,255,255,0.1);"></div>
  </div>`;

  // Açı CSS değişkenlerinden (fallback = baked); telefonla aynı canlı-güncelleme yolu.
  return `<div style="position:absolute;inset:0;transform-style:preserve-3d;
      transform:rotateZ(calc(var(--lean, ${rot}deg) + var(--land, 0deg))) rotateX(var(--tiltx, ${tiltX}deg)) rotateY(var(--tilt, ${tiltY}deg));">
    ${layers}
    ${front}
  </div>`;
}

export function phoneFrameSvg(opts: PhoneFrameOptions): string {
  const { id, screenshotSrc } = opts;
  const rail = RAILS[opts.finish ?? "titanium"];
  const vb = `${PHONE_VIEWBOX.minX} ${PHONE_VIEWBOX.minY} ${PHONE_VIEWBOX.width} ${PHONE_VIEWBOX.height}`;

  // Geometri (viewBox koordinatları). İnce, uniform bezel + rafine köşeler.
  const bodyR = 190;
  const sx = 20,
    sy = 20,
    sw = 960,
    sh = 2000,
    sr = 172; // ekran köşe yarıçapı (gövdeden biraz küçük)

  // Ekran içeriğini bozmayan, zarif top-left sheen (kısa üçgen, düşük opaklık).
  const sheen = `M ${sx},${sy} L ${sx + sw * 0.52},${sy} L ${sx},${sy + sh * 0.24} Z`;

  // Ekran görüntüsü. Yatay modda: geniş (yatay) görüntüyü, ekran merkezinde
  // en/boy'u takas edilmiş bir kutuya koyup -90° döndürüyoruz; cihaz sonra +90°
  // döndürülünce (phoneMockupHtml) içerik DÜZGÜN ve yatay görünür.
  const cx = sx + sw / 2,
    cy = sy + sh / 2;
  const safeSrc = escAttr(screenshotSrc);
  const imageEl = opts.landscape
    ? `<image href="${safeSrc}" x="${cx - sh / 2}" y="${cy - sw / 2}" width="${sh}" height="${sw}"
           preserveAspectRatio="xMidYMid slice" transform="rotate(-90 ${cx} ${cy})"/>`
    : `<image href="${safeSrc}" x="${sx}" y="${sy}" width="${sw}" height="${sh}"
           preserveAspectRatio="xMidYMid slice"/>`;

  return `<svg viewBox="${vb}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="rail-${id}" x1="0.04" y1="0" x2="0.96" y2="1">
      <stop offset="0" stop-color="${rail[0]}"/>
      <stop offset="0.13" stop-color="${rail[1]}"/>
      <stop offset="0.32" stop-color="${rail[2]}"/>
      <stop offset="0.5" stop-color="${rail[3]}"/>
      <stop offset="0.68" stop-color="${rail[4]}"/>
      <stop offset="0.87" stop-color="${rail[5]}"/>
      <stop offset="1" stop-color="${rail[6]}"/>
    </linearGradient>
    <!-- Kenar specular: sol-üst parlak, sağ-alt tekrar parlak (cilalı metal) -->
    <linearGradient id="edge-${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="rgba(255,255,255,0.7)"/>
      <stop offset="0.18" stop-color="rgba(255,255,255,0.05)"/>
      <stop offset="0.55" stop-color="rgba(0,0,0,0.12)"/>
      <stop offset="0.85" stop-color="rgba(255,255,255,0.10)"/>
      <stop offset="1" stop-color="rgba(255,255,255,0.45)"/>
    </linearGradient>
    <linearGradient id="topgloss-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="rgba(255,255,255,0.12)"/>
      <stop offset="1" stop-color="rgba(255,255,255,0)"/>
    </linearGradient>
    <linearGradient id="sheen-${id}" x1="0" y1="0" x2="0.5" y2="1">
      <stop offset="0" stop-color="rgba(255,255,255,0.10)"/>
      <stop offset="1" stop-color="rgba(255,255,255,0)"/>
    </linearGradient>
    <radialGradient id="vignette-${id}" cx="0.5" cy="0.44" r="0.72">
      <stop offset="0.72" stop-color="rgba(0,0,0,0)"/>
      <stop offset="1" stop-color="rgba(0,0,0,0.16)"/>
    </radialGradient>
    <radialGradient id="lens-${id}" cx="0.35" cy="0.32" r="0.75">
      <stop offset="0" stop-color="#33334a"/>
      <stop offset="0.5" stop-color="#101018"/>
      <stop offset="1" stop-color="#000000"/>
    </radialGradient>
    <clipPath id="screen-${id}">
      <rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" rx="${sr}" ry="${sr}"/>
    </clipPath>
  </defs>

  <!-- Yan tuşlar (gövdenin altında, kenardan hafif taşar) -->
  <g stroke="rgba(0,0,0,0.35)" stroke-width="1">
    <rect x="-10" y="432" width="12" height="70" rx="6" fill="url(#rail-${id})"/>
    <rect x="-10" y="566" width="12" height="148" rx="6" fill="url(#rail-${id})"/>
    <rect x="-10" y="746" width="12" height="148" rx="6" fill="url(#rail-${id})"/>
    <rect x="998" y="650" width="12" height="242" rx="6" fill="url(#rail-${id})"/>
  </g>

  <!-- Titanyum ray (dış gövde) -->
  <rect x="0" y="0" width="1000" height="2040" rx="${bodyR}" ry="${bodyR}" fill="url(#rail-${id})"/>
  <!-- Dış kenar specular highlight -->
  <rect x="1.25" y="1.25" width="997.5" height="2037.5" rx="${bodyR - 1.25}" ry="${bodyR - 1.25}"
        fill="none" stroke="url(#edge-${id})" stroke-width="2.5"/>
  <!-- Ray ile bezel arası koyu seam (derinlik) -->
  <rect x="11" y="11" width="978" height="2018" rx="${bodyR - 11}" ry="${bodyR - 11}"
        fill="none" stroke="rgba(0,0,0,0.5)" stroke-width="1.5"/>
  <!-- İç siyah bezel -->
  <rect x="13" y="13" width="974" height="2014" rx="${bodyR - 13}" ry="${bodyR - 13}" fill="#060607"/>

  <!-- Ekran katmanı -->
  <g clip-path="url(#screen-${id})">
    <rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" fill="#0a0a0a"/>
    ${imageEl}
    <!-- Çok hafif üst parlaklık (içeriği bozmaz) -->
    <rect x="${sx}" y="${sy}" width="${sw}" height="${sh * 0.16}" fill="url(#topgloss-${id})"/>
    <!-- Zarif köşe sheen -->
    <path d="${sheen}" fill="url(#sheen-${id})"/>
    <!-- Çok hafif vignette -->
    <rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" fill="url(#vignette-${id})"/>
  </g>
  <!-- Ekran çevresi hairline highlight (cam kenarı) -->
  <rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" rx="${sr}" ry="${sr}"
        fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1.5"/>

  <!-- Dynamic Island -->
  <rect x="350" y="78" width="300" height="88" rx="44" ry="44" fill="#000000"/>
  <circle cx="598" cy="122" r="15" fill="url(#lens-${id})"/>
  <circle cx="594" cy="117" r="4" fill="rgba(120,140,255,0.55)"/>
</svg>`;
}
