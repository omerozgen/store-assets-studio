/**
 * Panorama set export'u — geniş tuvali bir kez render eder, N `clip` ile dilimler.
 * Editördeki canlı önizleme ile AYNI renderSet çıktısı (WYSIWYG).
 */
import { chromium, type Browser } from "playwright";
import { renderSet, type Panel, type Theme } from "@sas/core-renderer";
import { logicalViewport, type StoreTarget } from "@sas/store-specs";
import { readPngSize } from "./render.ts";
import { flattenPngToRgb } from "./png.ts";

export type PanelResult = {
  index: number;
  png: Buffer;
  actual: { width: number; height: number };
  ok: boolean;
};

export type SetRenderResult = {
  target: StoreTarget;
  panels: PanelResult[];
  /** Kesilmemiş tam panorama tuvali (önizleme/doğrulama için). */
  fullCanvas: Buffer;
  allOk: boolean;
};

/** Bir temayı + panelleri bir hedef için render edip dilimlere böler. */
export async function renderSetToPngs(
  browser: Browser,
  theme: Theme,
  panels: Panel[],
  target: StoreTarget,
): Promise<SetRenderResult> {
  const vp = logicalViewport(target);
  const { wideHtml, viewport, clips } = renderSet(theme, panels, vp, target.deviceKind ?? "phone");

  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: target.scaleFactor,
  });
  try {
    const page = await context.newPage();
    await page.setContent(wideHtml, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready); // özel @font-face yüklensin

    // Mağaza uyumu: Playwright RGBA üretir; Apple/Google alfasız (24-bit RGB) ister.
    // Süreklilik testi ikisini karşılaştırdığı için tam tuval de düzleştirilir.
    const fullCanvas = flattenPngToRgb(Buffer.from(await page.screenshot({ type: "png" })));

    const panelResults: PanelResult[] = [];
    for (let i = 0; i < clips.length; i++) {
      const png = flattenPngToRgb(Buffer.from(await page.screenshot({ type: "png", clip: clips[i] })));
      const actual = readPngSize(png);
      const ok = actual.width === target.width && actual.height === target.height;
      panelResults.push({ index: i, png, actual, ok });
    }

    return {
      target,
      panels: panelResults,
      fullCanvas,
      allOk: panelResults.every((p) => p.ok),
    };
  } finally {
    await context.close();
  }
}

/** Tekil (feature graphic / icon) HTML'i bir hedef için birebir boyutta PNG'ye basar. */
export async function renderSingleToPng(
  browser: Browser,
  html: string,
  target: StoreTarget,
): Promise<PanelResult> {
  const vp = logicalViewport(target);
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: target.scaleFactor,
  });
  try {
    const page = await context.newPage();
    await page.setContent(html, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready); // özel @font-face yüklensin
    const png = flattenPngToRgb(Buffer.from(await page.screenshot({ type: "png" })));
    const actual = readPngSize(png);
    return { index: 0, png, actual, ok: actual.width === target.width && actual.height === target.height };
  } finally {
    await context.close();
  }
}

/** Kolaylık: kendi tarayıcısını açıp kapatır. */
export async function renderSetStandalone(
  theme: Theme,
  panels: Panel[],
  target: StoreTarget,
): Promise<SetRenderResult> {
  const browser = await chromium.launch();
  try {
    return await renderSetToPngs(browser, theme, panels, target);
  } finally {
    await browser.close();
  }
}
