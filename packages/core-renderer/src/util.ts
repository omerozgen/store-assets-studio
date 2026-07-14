/** Paylaşılan küçük yardımcılar — tek doğruluk kaynağı (kopya fonksiyon yok). */

export type Background =
  | { type: "solid"; color: string }
  | { type: "gradient"; colors: string[]; angle?: number };

/** Metni HTML gövdesi VE attribute bağlamı için güvenli kaçışlar (& < > "). */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function backgroundCss(bg: Background): string {
  if (bg.type === "solid") return bg.color;
  const angle = bg.angle ?? 135;
  return `linear-gradient(${angle}deg, ${bg.colors.join(", ")})`;
}
