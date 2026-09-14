/** Yatıklık (sağa/sola eğim, rotateZ) gösterimi. */
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { chromium } from "playwright";
import { phoneMockupHtml, PHONE_ASPECT } from "@sas/device-frames";

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "out");

function appScreen(): string {
  const w = 1080, h = 2280;
  const rows = Array.from({ length: 4 }, (_, k) => {
    const y = h * 0.44 + k * h * 0.12;
    return `<rect x="${w*0.08}" y="${y}" width="${w*0.84}" height="${h*0.085}" rx="28" fill="#16223a"/>
      <circle cx="${w*0.18}" cy="${y+h*0.0425}" r="${w*0.05}" fill="#3b82f6"/>
      <rect x="${w*0.28}" y="${y+h*0.022}" width="${w*0.4}" height="${h*0.018}" rx="9" fill="#fff" opacity="0.85"/>`;
  }).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect width="${w}" height="${h}" fill="#0b1220"/>
    <rect x="${w*0.08}" y="${h*0.135}" width="${w*0.5}" height="${h*0.03}" rx="12" fill="#fff" opacity="0.95"/>
    <rect x="${w*0.08}" y="${h*0.24}" width="${w*0.84}" height="${h*0.14}" rx="36" fill="#3b82f6"/>${rows}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const LEANS = [
  { label: "Sola eğik (-15°)", lean: -15 },
  { label: "Düz (0°)", lean: 0 },
  { label: "Sağa eğik (+15°)", lean: 15 },
];

async function main() {
  await mkdir(outDir, { recursive: true });
  const W = 300, H = Math.round(W * PHONE_ASPECT);
  const shot = appScreen();
  const cols = LEANS.map((p, i) => {
    const mockup = phoneMockupHtml({ id: `l${i}`, screenshotSrc: shot, finish: "black", widthPx: W, heightPx: H, tiltYDeg: -8, tiltXDeg: 2, rotateDeg: p.lean, thicknessPct: 8 });
    return `<div class="col"><div class="stage" style="perspective:${W*4}px"><div class="shadow"></div>${mockup}</div><div class="cap">${p.label}</div></div>`;
  }).join("");
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#eceef2;font-family:sans-serif;padding:60px 30px}
    .row{display:flex;gap:40px;align-items:flex-end;justify-content:center}
    .col{width:${W+40}px;text-align:center}
    .stage{position:relative;width:${W}px;height:${H}px;margin:0 auto}
    .shadow{position:absolute;left:4%;top:76%;width:92%;height:22%;background:radial-gradient(50% 50% at 50% 50%, rgba(0,0,0,0.4), rgba(0,0,0,0));filter:blur(14px)}
    .cap{margin-top:30px;font-weight:700;color:#1f2430;font-size:19px}
  </style></head><body><div class="row">${cols}</div></body></html>`;
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: (W + 40) * 3 + 100, height: H + 200 });
    await page.setContent(html, { waitUntil: "networkidle" });
    await writeFile(join(outDir, "lean.png"), Buffer.from(await page.screenshot({ type: "png", fullPage: true })));
    console.log("Çıktı:", join(outDir, "lean.png"));
  } finally { await browser.close(); }
}
main().catch((e) => { console.error(e); process.exit(1); });
