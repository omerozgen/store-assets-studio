/**
 * Foto-gerçekçi çerçeve compositing motoru (asset-agnostik).
 *
 * Bir çerçeve = arka plan görseli (foto/render) + "screen quad" (ekranın 4 köşesi,
 * çerçeve görselinin piksel uzayında). Ekran görüntüsü, kaynak dikdörtgeninden bu
 * dörtgene bir **homografi** (projektif dönüşüm) ile eşlenir ve CSS `matrix3d` olarak
 * uygulanır → perspektif-doğru oturur. Frame görseli (yansıma/gölge/çentik) üstte veya
 * altta katman olabilir.
 *
 * İzomorfik: saf string/matematik; node ve tarayıcıda aynı çalışır.
 */

export type Point = [number, number];

export type DeviceFrame = {
  id: string;
  name: string;
  platform: "ios" | "android";
  pose: "flat" | "angled";
  /** Çerçeve görseli (URL veya data URI). Ekran alanı ideal olarak şeffaf. */
  frameSrc: string;
  /** Frame görselinin piksel boyutu = compositing tuval boyutu. */
  canvas: { width: number; height: number };
  /** Ekranın 4 köşesi (frame piksel uzayı): sol-üst, sağ-üst, sağ-alt, sol-alt. */
  screen: { tl: Point; tr: Point; br: Point; bl: Point };
  /** Frame görseli ekran görüntüsünün Üstünde mi (şeffaf ekran) yoksa ALTında mı? */
  frameOnTop?: boolean;
  license: { source: string; type: string; note?: string };
};

// --- 3x3 matris yardımcıları (row-major, 9 elemanlı diziler) ---
function adj(m: number[]): number[] {
  return [
    m[4] * m[8] - m[5] * m[7], m[2] * m[7] - m[1] * m[8], m[1] * m[5] - m[2] * m[4],
    m[5] * m[6] - m[3] * m[8], m[0] * m[8] - m[2] * m[6], m[2] * m[3] - m[0] * m[5],
    m[3] * m[7] - m[4] * m[6], m[1] * m[6] - m[0] * m[7], m[0] * m[4] - m[1] * m[3],
  ];
}
function multmm(a: number[], b: number[]): number[] {
  const r = new Array(9);
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++) {
      let s = 0;
      for (let k = 0; k < 3; k++) s += a[3 * i + k] * b[3 * k + j];
      r[3 * i + j] = s;
    }
  return r;
}
function multmv(m: number[], v: number[]): number[] {
  return [
    m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
    m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
    m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
  ];
}
function basisToPoints(p: Point[]): number[] {
  const m = [p[0][0], p[1][0], p[2][0], p[0][1], p[1][1], p[2][1], 1, 1, 1];
  const v = multmv(adj(m), [p[3][0], p[3][1], 1]);
  return multmm(m, [v[0], 0, 0, 0, v[1], 0, 0, 0, v[2]]);
}

/** src (4 nokta) → dst (4 nokta) projektif dönüşüm (3x3, row-major). */
export function homography(src: Point[], dst: Point[]): number[] {
  return multmm(basisToPoints(dst), adj(basisToPoints(src)));
}

/** 3x3 homografiyi CSS matrix3d(...) string'ine çevirir (column-major, i ile normalize). */
export function toMatrix3d(h: number[]): string {
  const i = h[8] || 1;
  const t = h.map((x) => x / i);
  // matrix3d column-major: col1, col2, col3, col4
  const m = [
    t[0], t[3], 0, t[6],
    t[1], t[4], 0, t[7],
    0, 0, 1, 0,
    t[2], t[5], 0, t[8],
  ];
  return `matrix3d(${m.map((n) => n.toFixed(8)).join(",")})`;
}

/**
 * Bir çerçeve + ekran görüntüsünü tek bir konumlandırılmış HTML bloğuna çevirir.
 * Dönen HTML, canvas boyutunda bir `<div>`'dir; dışarıdan CSS ile ölçeklenebilir.
 * @param screenSize Ekran görüntüsünün doğal piksel boyutu (homografi kaynağı).
 */
export function compositeFrame(
  frame: DeviceFrame,
  screenshotSrc: string,
  screenSize: { width: number; height: number },
): string {
  const { width: sw, height: sh } = screenSize;
  const src: Point[] = [
    [0, 0],
    [sw, 0],
    [sw, sh],
    [0, sh],
  ];
  const dst: Point[] = [frame.screen.tl, frame.screen.tr, frame.screen.br, frame.screen.bl];
  const matrix = toMatrix3d(homography(src, dst));
  const frameOnTop = frame.frameOnTop ?? true;

  const shotZ = frameOnTop ? 1 : 2;
  const frameZ = frameOnTop ? 2 : 1;

  return `<div style="position:relative;width:${frame.canvas.width}px;height:${frame.canvas.height}px;">
    <img src="${screenshotSrc}" width="${sw}" height="${sh}" alt="" style="
      position:absolute;left:0;top:0;transform-origin:0 0;transform:${matrix};z-index:${shotZ};display:block;" />
    <img src="${frame.frameSrc}" width="${frame.canvas.width}" height="${frame.canvas.height}" alt="" style="
      position:absolute;left:0;top:0;z-index:${frameZ};display:block;" />
  </div>`;
}
