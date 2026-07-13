/**
 * Farklı açı + derinlik gösterimi: aynı ekranı çeşitli duruşlarda, 3B derinlikli
 * telefon mockup'ıyla tek karede yan yana render eder.
 *
 * Çalıştır:  pnpm render:angles
 */
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { chromium } from "playwright";
import { phoneMockupHtml, PHONE_ASPECT } from "@sas/device-frames";

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "out");

function appScreen(): string {
  const w = 1080,
    h = 2280;
  const rows = Array.from({ length: 4 }, (_, k) => {
    const y = h * 0.44 + k * h * 0.12;
    return `<rect x="${w * 0.08}" y="${y}" width="${w * 0.84}" height="${h * 0.085}" rx="28" fill="#16223a"/>
      <circle cx="${w * 0.18}" cy="${y + h * 0.0425}" r="${w * 0.05}" fill="#3b82f6"/>
      <rect x="${w * 0.28}" y="${y + h * 0.022}" width="${w * 0.4}" height="${h * 0.018}" rx="9" fill="#fff" opacity="0.85"/>
      <rect x="${w * 0.28}" y="${y + h * 0.05}" width="${w * 0.28}" height="${h * 0.014}" rx="7" fill="#fff" opacity="0.4"/>`;
  }).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect width="${w}" height="${h}" fill="#0b1220"/>
    <rect x="${w * 0.08}" y="${h * 0.135}" width="${w * 0.5}" height="${h * 0.03}" rx="12" fill="#fff" opacity="0.95"/>
    <rect x="${w * 0.08}" y="${h * 0.24}" width="${w * 0.84}" height="${h * 0.14}" rx="36" fill="#3b82f6"/>
    ${rows}
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const POSES = [
  { label: "Düz / önden", tiltY: 0, tiltX: 0, rot: 0, finish: "titanium" as const },
  { label: "Hafif sağ", tiltY: -14, tiltX: 4, rot: 0, finish: "black" as const },
  { label: "Belirgin sağ", tiltY: -24, tiltX: 6, rot: -2, finish: "titanium" as const },
  { label: "Sola dönük", tiltY: 16, tiltX: 4, rot: 2, finish: "silver" as const },
  { label: "Öne yatık", tiltY: -10, tiltX: 14, rot: -4, finish: "black" as const },
];

async function main() {
  await mkdir(outDir, { recursive: true });
  const W = 300;
  const H = Math.round(W * PHONE_ASPECT);
  const shot = appScreen();

  const cols = POSES.map((p, i) => {
    const mockup = phoneMockupHtml({
      id: `a${i}`,
      screenshotSrc: shot,
      finish: p.finish,
      widthPx: W,
      heightPx: H,
      tiltYDeg: p.tiltY,
      tiltXDeg: p.tiltX,
      rotateDeg: p.rot,
      thicknessPct: 9,
    });
    return `<div class="col">
      <div class="stage" style="perspective:${W * 4}px">
        <div class="shadow"></div>
        ${mockup}
      </div>
      <div class="cap">${p.label}<br><small>${p.finish} · Y ${p.tiltY}° · X ${p.tiltX}°</small></div>
    </div>`;
  }).join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#eceef2;font-family:-apple-system,Segoe UI,Roboto,sans-serif;padding:50px 30px}
    .row{display:flex;gap:24px;align-items:flex-end;justify-content:center}
    .col{width:${W + 30}px;text-align:center}
    .stage{position:relative;width:${W}px;height:${H}px;margin:0 auto}
    .shadow{position:absolute;left:4%;top:76%;width:92%;height:22%;
      background:radial-gradient(50% 50% at 50% 50%, rgba(0,0,0,0.45), rgba(0,0,0,0));
      filter:blur(14px);z-index:0}
    .cap{margin-top:26px;color:#1f2430;font-size:19px;font-weight:700}
    .cap small{color:#78808e;font-weight:500;font-size:14px}
  </style></head><body>
    <div class="row">${cols}</div>
  </body></html>`;

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: (W + 54) * POSES.length + 60, height: H + 220 });
    await page.setContent(html, { waitUntil: "networkidle" });
    const png = Buffer.from(await page.screenshot({ type: "png", fullPage: true }));
    await writeFile(join(outDir, "angles.png"), png);
    console.log("Çıktı:", join(outDir, "angles.png"));
  } finally {
    await browser.close();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
