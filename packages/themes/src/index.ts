/**
 * Tema galerisi — hazır, profesyonel preset'ler + seçim/override yardımcıları.
 * "Havalı görünüm"ün kaynağı. Her tema akan bir arka plan, dekor, font ve
 * cihaz duruşu (düz/açılı) tanımlar. Kullanıcı galeriden seçer, sonra özelleştirir.
 */
import { mergeTheme, type Theme } from "@sas/core-renderer";

// Not: tek tırnak — çift tırnak inline style attribute'larını kırar.
const SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export const THEMES: readonly Theme[] = [
  {
    id: "midnight-cascade",
    name: "Midnight Cascade",
    background: { type: "gradient", colors: ["#0f172a", "#1e1b4b", "#4f46e5"], angle: 120 },
    decor: [
      { type: "blob", xFrac: 0.12, yFrac: 0.2, sizeFrac: 0.9, color: "#6366f1", opacity: 0.35, blurFrac: 0.12 },
      { type: "blob", xFrac: 0.5, yFrac: 0.75, sizeFrac: 1.1, color: "#8b5cf6", opacity: 0.28, blurFrac: 0.14 },
      { type: "blob", xFrac: 0.88, yFrac: 0.25, sizeFrac: 0.85, color: "#ec4899", opacity: 0.3, blurFrac: 0.12 },
    ],
    font: { family: SANS, captionSizePct: 4.4, weight: 800, color: "#ffffff" },
    caption: { position: "top" },
    device: { pose: "angled", tiltDeg: -16, arrangement: "cascade", widthPct: 62, finish: "black" },
  },
  {
    id: "clean-light",
    name: "Clean Light",
    background: { type: "gradient", colors: ["#f8fafc", "#e2e8f0"], angle: 135 },
    decor: [
      { type: "blob", xFrac: 0.3, yFrac: 0.85, sizeFrac: 0.8, color: "#93c5fd", opacity: 0.4, blurFrac: 0.13 },
      { type: "blob", xFrac: 0.75, yFrac: 0.15, sizeFrac: 0.7, color: "#c4b5fd", opacity: 0.4, blurFrac: 0.13 },
    ],
    font: { family: SANS, captionSizePct: 4.4, weight: 800, color: "#0f172a" },
    caption: { position: "top" },
    device: { pose: "flat", arrangement: "centered", widthPct: 66, finish: "silver" },
  },
  {
    id: "sunset-flow",
    name: "Sunset Flow",
    background: { type: "gradient", colors: ["#f97316", "#db2777", "#7c3aed"], angle: 100 },
    decor: [
      { type: "blob", xFrac: 0.2, yFrac: 0.3, sizeFrac: 1.0, color: "#fb923c", opacity: 0.35, blurFrac: 0.15 },
      { type: "blob", xFrac: 0.65, yFrac: 0.7, sizeFrac: 1.1, color: "#f472b6", opacity: 0.3, blurFrac: 0.15 },
    ],
    font: { family: SANS, captionSizePct: 4.6, weight: 800, color: "#ffffff" },
    caption: { position: "bottom" },
    device: { pose: "angled", tiltDeg: 14, arrangement: "cascade", widthPct: 60, finish: "black" },
  },
  {
    id: "mono-pro",
    name: "Mono Pro",
    background: { type: "gradient", colors: ["#111827", "#374151"], angle: 160 },
    font: { family: SANS, captionSizePct: 4.2, weight: 700, color: "#f9fafb" },
    caption: { position: "top" },
    device: { pose: "flat", arrangement: "centered", widthPct: 68, finish: "titanium" },
  },
  {
    id: "ocean-tilt",
    name: "Ocean Tilt",
    background: { type: "gradient", colors: ["#0ea5e9", "#2563eb", "#1e3a8a"], angle: 115 },
    decor: [
      { type: "blob", xFrac: 0.4, yFrac: 0.2, sizeFrac: 0.95, color: "#38bdf8", opacity: 0.35, blurFrac: 0.13 },
      { type: "blob", xFrac: 0.85, yFrac: 0.8, sizeFrac: 1.0, color: "#60a5fa", opacity: 0.3, blurFrac: 0.14 },
    ],
    font: { family: SANS, captionSizePct: 4.4, weight: 800, color: "#f0f9ff" },
    caption: { position: "top" },
    device: { pose: "angled", tiltDeg: -12, arrangement: "cascade", widthPct: 62, finish: "titanium" },
  },
  {
    id: "bold-split",
    name: "Bold Split",
    // "Bölünmüş" hero: telefonlar panel sınırına oturur, halkalar seam'leri geçer.
    background: { type: "gradient", colors: ["#4f46e5", "#db2777"], angle: 120 },
    decor: [
      { type: "ring", xFrac: 0.34, yFrac: 0.32, sizeFrac: 1.4, color: "rgba(255,255,255,0.22)", thicknessFrac: 0.018 },
      { type: "ring", xFrac: 0.68, yFrac: 0.7, sizeFrac: 1.7, color: "rgba(255,255,255,0.16)", thicknessFrac: 0.02 },
      { type: "circle", xFrac: 0.5, yFrac: 0.16, sizeFrac: 0.28, color: "rgba(255,255,255,0.14)" },
    ],
    font: { family: SANS, captionSizePct: 4.6, weight: 800, color: "#ffffff" },
    caption: { position: "top" },
    device: { pose: "angled", tiltDeg: -10, tiltXDeg: 2, arrangement: "straddle", widthPct: 70, finish: "black" },
  },
  {
    id: "geo-pop",
    name: "Geo Pop",
    background: { type: "gradient", colors: ["#fef3c7", "#fca5a5"], angle: 135 },
    decor: [
      { type: "circle", xFrac: 0.18, yFrac: 0.22, sizeFrac: 0.5, color: "#fb7185", opacity: 0.5 },
      { type: "ring", xFrac: 0.8, yFrac: 0.3, sizeFrac: 0.7, color: "#f59e0b", thicknessFrac: 0.016, opacity: 0.7 },
      { type: "dots", xFrac: 0.5, yFrac: 0.85, wFrac: 0.5, hFrac: 0.3, color: "#f43f5e", gapFrac: 0.045, opacity: 0.5 },
      { type: "stripe", xFrac: 0.35, yFrac: 0.6, wFrac: 0.22, hFrac: 0.02, color: "#0ea5e9", angleDeg: -20, opacity: 0.6 },
    ],
    font: { family: SANS, captionSizePct: 4.4, weight: 800, color: "#7c2d12" },
    caption: { position: "top" },
    device: { pose: "flat", arrangement: "centered", widthPct: 66, finish: "silver" },
  },
  {
    id: "confetti-dark",
    name: "Confetti Dark",
    background: { type: "gradient", colors: ["#0b1020", "#1e1b4b"], angle: 160 },
    decor: [
      { type: "dots", xFrac: 0.5, yFrac: 0.5, wFrac: 1, hFrac: 1, color: "rgba(255,255,255,0.08)", gapFrac: 0.06 },
      { type: "circle", xFrac: 0.15, yFrac: 0.2, sizeFrac: 0.14, color: "#f59e0b", opacity: 0.9 },
      { type: "circle", xFrac: 0.85, yFrac: 0.28, sizeFrac: 0.1, color: "#22c55e", opacity: 0.9 },
      { type: "ring", xFrac: 0.72, yFrac: 0.78, sizeFrac: 0.5, color: "#ec4899", thicknessFrac: 0.014, opacity: 0.8 },
      { type: "circle", xFrac: 0.4, yFrac: 0.9, sizeFrac: 0.08, color: "#38bdf8", opacity: 0.9 },
    ],
    font: { family: SANS, captionSizePct: 4.4, weight: 800, color: "#ffffff" },
    caption: { position: "top" },
    device: { pose: "angled", tiltDeg: 12, arrangement: "cascade", widthPct: 60, finish: "black" },
  },
  {
    id: "neon-split",
    name: "Neon Split",
    // Split #2
    background: { type: "gradient", colors: ["#0f0524", "#3b0764", "#7c3aed"], angle: 125 },
    decor: [
      { type: "dots", xFrac: 0.5, yFrac: 0.5, wFrac: 1, hFrac: 1, color: "rgba(217,180,255,0.10)", gapFrac: 0.055 },
      { type: "ring", xFrac: 0.5, yFrac: 0.35, sizeFrac: 1.5, color: "rgba(34,211,238,0.35)", thicknessFrac: 0.014 },
      { type: "circle", xFrac: 0.82, yFrac: 0.72, sizeFrac: 0.24, color: "rgba(236,72,153,0.5)" },
    ],
    font: { family: SANS, captionSizePct: 4.6, weight: 800, color: "#ffffff" },
    caption: { position: "top" },
    device: { pose: "angled", tiltDeg: -8, leanDeg: -4, arrangement: "straddle", widthPct: 70, finish: "black" },
  },
  {
    id: "aurora-split",
    name: "Aurora Split",
    // Split #3
    background: { type: "gradient", colors: ["#042f2e", "#0d9488", "#22d3ee"], angle: 110 },
    decor: [
      { type: "stripe", xFrac: 0.3, yFrac: 0.25, wFrac: 0.6, hFrac: 0.02, color: "rgba(255,255,255,0.25)", angleDeg: -12 },
      { type: "stripe", xFrac: 0.65, yFrac: 0.8, wFrac: 0.7, hFrac: 0.02, color: "rgba(255,255,255,0.18)", angleDeg: -12 },
      { type: "circle", xFrac: 0.2, yFrac: 0.8, sizeFrac: 0.3, color: "rgba(255,255,255,0.12)" },
    ],
    font: { family: SANS, captionSizePct: 4.6, weight: 800, color: "#ecfeff" },
    caption: { position: "top" },
    device: { pose: "angled", tiltDeg: 8, arrangement: "straddle", widthPct: 68, finish: "titanium" },
  },
  {
    id: "coral-pop",
    name: "Coral Pop",
    background: { type: "gradient", colors: ["#fff7ed", "#fdba74", "#fb7185"], angle: 135 },
    decor: [
      { type: "circle", xFrac: 0.2, yFrac: 0.25, sizeFrac: 0.45, color: "#fb7185", opacity: 0.45 },
      { type: "ring", xFrac: 0.82, yFrac: 0.3, sizeFrac: 0.7, color: "#f97316", thicknessFrac: 0.016, opacity: 0.7 },
      { type: "dots", xFrac: 0.5, yFrac: 0.88, wFrac: 0.6, hFrac: 0.25, color: "#f43f5e", gapFrac: 0.05, opacity: 0.5 },
    ],
    font: { family: SANS, captionSizePct: 4.4, weight: 800, color: "#7c2d12" },
    caption: { position: "top" },
    device: { pose: "angled", tiltDeg: -10, arrangement: "cascade", widthPct: 64, finish: "silver" },
  },
  {
    id: "forest-calm",
    name: "Forest Calm",
    background: { type: "gradient", colors: ["#052e16", "#166534", "#4ade80"], angle: 150 },
    decor: [
      { type: "blob", xFrac: 0.25, yFrac: 0.3, sizeFrac: 1.0, color: "#22c55e", opacity: 0.3, blurFrac: 0.14 },
      { type: "blob", xFrac: 0.8, yFrac: 0.7, sizeFrac: 1.1, color: "#86efac", opacity: 0.25, blurFrac: 0.15 },
    ],
    font: { family: SANS, captionSizePct: 4.4, weight: 800, color: "#f0fdf4" },
    caption: { position: "top" },
    device: { pose: "angled", tiltDeg: -12, arrangement: "cascade", widthPct: 62, finish: "titanium" },
  },
  {
    id: "deep-space",
    name: "Deep Space",
    background: { type: "gradient", colors: ["#020617", "#0f172a", "#1e293b"], angle: 160 },
    decor: [
      { type: "dots", xFrac: 0.5, yFrac: 0.5, wFrac: 1, hFrac: 1, color: "rgba(255,255,255,0.14)", gapFrac: 0.08 },
      { type: "circle", xFrac: 0.3, yFrac: 0.22, sizeFrac: 0.06, color: "#93c5fd", opacity: 0.9 },
      { type: "circle", xFrac: 0.78, yFrac: 0.35, sizeFrac: 0.05, color: "#fef08a", opacity: 0.9 },
      { type: "ring", xFrac: 0.85, yFrac: 0.8, sizeFrac: 0.6, color: "rgba(99,102,241,0.5)", thicknessFrac: 0.012 },
    ],
    font: { family: SANS, captionSizePct: 4.4, weight: 800, color: "#e2e8f0" },
    caption: { position: "top" },
    device: { pose: "angled", tiltDeg: 10, leanDeg: 3, arrangement: "cascade", widthPct: 60, finish: "black" },
  },
];

/** Kimliğe göre tema getir; yoksa hata fırlat. */
export function getTheme(id: string): Theme {
  const t = THEMES.find((x) => x.id === id);
  if (!t) throw new Error(`Bilinmeyen tema: "${id}"`);
  return t;
}

/** Galeriden seç + özelleştir: tema kimliği + override → çözülmüş Theme. */
export function resolveTheme(id: string, overrides?: Parameters<typeof mergeTheme>[1]): Theme {
  return mergeTheme(getTheme(id), overrides);
}
