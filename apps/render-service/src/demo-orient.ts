/**
 * Yön testi: aynı ekranı DİKEY ve YATAY cihazda yan yana render eder.
 * Yatay için geniş (landscape) ekran görüntüsü verilir; çıktıda içerik DÜZGÜN
 * (yan/ters değil) görünmeli.
 *
 * Çalıştır: pnpm --filter @sas/render-service exec tsx src/demo-orient.ts
 */
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { chromium } from "playwright";
import { phoneMockupHtml, PHONE_ASPECT } from "@sas/device-frames";

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "out");

/** Yönü belli ekran: üstte bar + "YUKARI ↑" + sol/sağ farklı renk. */
function orientedScreen(w: number, h: number, label: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect width="${w}" height="${h}" fill="#0b1220"/>
    <rect x="0" y="0" width="${w}" height="${h * 0.12}" fill="#22c55e"/>
    <text x="50%" y="${h * 0.08}" fill="#062" font-family="sans-serif" font-size="${h * 0.06}" font-weight="800" text-anchor="middle">ÜST BAR</text>
    <rect x="0" y="${h * 0.12}" width="${w * 0.12}" height="${h * 0.88}" fill="#3b82f6"/>
    <text x="55%" y="45%" fill="#fff" font-family="sans-serif" font-size="${h * 0.1}" font-weight="800" text-anchor="middle">${label}</text>
    <text x="55%" y="60%" fill="#fff" font-family="sans-serif" font-size="${h * 0.08}" text-anchor="middle">YUKARI ↑</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const PW = 300,
    PH = Math.round(PW * PHONE_ASPECT);
  // Yatay cihaz: portrait çerçeve boyutu küçük tutulur, 90° dönünce geniş görünür.
  const LW = 260,
    LH = Math.round(LW * PHONE_ASPECT);

  const portrait = phoneMockupHtml({
    id: "por", screenshotSrc: orientedScreen(1080, 2280, "DİKEY"),
    finish: "black", widthPx: PW, heightPx: PH, tiltYDeg: 0, thicknessPct: 8,
  });
  const landscape = phoneMockupHtml({
    id: "lan", screenshotSrc: orientedScreen(2340, 1080, "YATAY"),
    finish: "black", widthPx: LW, heightPx: LH, tiltYDeg: 0, thicknessPct: 8, landscape: true,
  });

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#eceef2;font-family:sans-serif;padding:60px;display:flex;gap:80px;align-items:center;justify-content:center}
    .stage{position:relative}
    .cap{text-align:center;margin-top:20px;font-weight:700;color:#1f2430}
  </style></head><body>
    <div>
      <div class="stage" style="width:${PW}px;height:${PH}px;perspective:${PW * 4}px">${portrait}</div>
      <div class="cap">DİKEY (portrait)</div>
    </div>
    <div>
      <div class="stage" style="width:${LW}px;height:${LH}px;perspective:${LW * 4}px">${landscape}</div>
      <div class="cap">YATAY (landscape)</div>
    </div>
  </body></html>`;

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 900, height: 820 });
    await page.setContent(html, { waitUntil: "networkidle" });
    const png = Buffer.from(await page.screenshot({ type: "png", fullPage: true }));
    await writeFile(join(outDir, "orient.png"), png);
    console.log("Çıktı:", join(outDir, "orient.png"));
  } finally {
    await browser.close();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
