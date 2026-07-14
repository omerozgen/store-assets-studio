/**
 * Ekran görüntüsü seti DIŞINDAKİ tekil mağaza varlıkları: feature graphic ve icon.
 * İzomorfik HTML üretir (renderSet ile aynı WYSIWYG mantığı).
 */
import { phoneMockupHtml } from "@sas/device-frames";
import type { Theme } from "./set.ts";
import { escapeHtml as esc, backgroundCss as bgCss, type Background } from "./util.ts";
function doc(w: number, h: number, inner: string, font: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{margin:0;padding:0}
    .c{position:relative;width:${w}px;height:${h}px;overflow:hidden;font-family:${font}}
  </style></head><body><div class="c">${inner}</div></body></html>`;
}

/**
 * Play feature graphic (tipik 1024×500): akan tema arka planı + başlık + sağda açılı telefon.
 * @param panel mantıksal (CSS) boyut.
 */
export function renderFeatureGraphicHtml(
  theme: Theme,
  opts: { title: string; screenshotSrc: string },
  panel: { width: number; height: number },
): string {
  const { width: W, height: H } = panel;
  const deviceH = H * 0.92;
  const deviceW = deviceH / 2.016;
  const capSize = H * 0.13;
  const inner = `
    <div style="position:absolute;inset:0;background:${bgCss(theme.background)};"></div>
    <div style="position:absolute;left:${W * 0.06}px;top:0;height:100%;width:${W * 0.55}px;
      display:flex;align-items:center;">
      <div style="color:${theme.font.color};font-size:${capSize}px;font-weight:${theme.font.weight};
        line-height:1.1;text-wrap:balance;text-shadow:0 2px 12px rgba(0,0,0,0.25);">${esc(opts.title)}</div>
    </div>
    <div style="position:absolute;right:${W * 0.05}px;top:${(H - deviceH) / 2}px;
      width:${deviceW}px;height:${deviceH}px;perspective:${deviceW * 4}px;">
      ${phoneMockupHtml({
        id: "fg",
        screenshotSrc: opts.screenshotSrc,
        finish: theme.device.finish ?? "black",
        widthPx: deviceW,
        heightPx: deviceH,
        tiltYDeg: -14,
        tiltXDeg: 3,
        thicknessPct: 8,
      })}
    </div>`;
  return doc(W, H, inner, theme.font.family);
}

/**
 * App icon. src verilirse tam-kanvas cover; verilmezse tema gradienti + harf.
 * Mağaza icon'ları alfa/şeffaflık istemez → opak arka plan.
 */
export function renderIconHtml(
  opts: { src?: string; letter?: string; background?: Background; color?: string; fontFamily?: string },
  panel: { width: number; height: number },
): string {
  const { width: W, height: H } = panel;
  const font = opts.fontFamily ?? "-apple-system, Segoe UI, Roboto, sans-serif";
  if (opts.src) {
    const inner = `<img src="${esc(opts.src)}" style="width:${W}px;height:${H}px;object-fit:cover;display:block;"/>`;
    return doc(W, H, inner, font);
  }
  const bg = opts.background ? bgCss(opts.background) : "linear-gradient(135deg,#6366f1,#ec4899)";
  const inner = `
    <div style="position:absolute;inset:0;background:${bg};display:flex;align-items:center;justify-content:center;">
      <div style="color:${opts.color ?? "#fff"};font-size:${W * 0.5}px;font-weight:800;">${esc(opts.letter ?? "A")}</div>
    </div>`;
  return doc(W, H, inner, font);
}
