/**
 * render-service çekirdeği — bir Scene'i bir StoreTarget için birebir piksel
 * boyutunda PNG'ye basar. Editördeki canlı önizleme ile AYNI core-renderer
 * çıktısını headless Chromium'da render eder (WYSIWYG).
 */
import { chromium, type Browser } from "playwright";
import { renderScene, type Scene } from "@sas/core-renderer";
import { getTarget, logicalViewport, type StoreTarget } from "@sas/store-specs";

/** Bir PNG buffer'ının IHDR'ından genişlik/yükseklik okur (sharp'a gerek yok). */
export function readPngSize(buf: Buffer): { width: number; height: number } {
  // PNG imzası (8 bayt) + IHDR uzunluğu (4) + "IHDR" (4) = offset 16'da width.
  const isPng =
    buf.length > 24 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47;
  if (!isPng) throw new Error("Geçerli PNG değil");
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

export type RenderResult = {
  target: StoreTarget;
  png: Buffer;
  actual: { width: number; height: number };
  /** Çıktı boyutu hedefle birebir eşleşiyor mu? */
  ok: boolean;
};

/** Tek bir sahne+hedef render'ı. Paylaşılan bir Browser örneği alır. */
export async function renderTargetToPng(
  browser: Browser,
  scene: Scene,
  target: StoreTarget,
): Promise<RenderResult> {
  const vp = logicalViewport(target);
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: target.scaleFactor,
  });
  try {
    const page = await context.newPage();
    const html = renderScene(scene, vp);
    await page.setContent(html, { waitUntil: "networkidle" });
    const png = await page.screenshot({ type: "png" });
    const buf = Buffer.from(png);
    const actual = readPngSize(buf);
    const ok = actual.width === target.width && actual.height === target.height;
    return { target, png: buf, actual, ok };
  } finally {
    await context.close();
  }
}

/** Kolaylık: id ile render (kendi tarayıcısını açıp kapatır). */
export async function renderById(scene: Scene, targetId: string): Promise<RenderResult> {
  const browser = await chromium.launch();
  try {
    return await renderTargetToPng(browser, scene, getTarget(targetId));
  } finally {
    await browser.close();
  }
}
