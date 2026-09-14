/** Vektör vs Foto çerçeveyi tek karede, eşit boyda, yan yana koyar. */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { chromium } from "playwright";

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "..", "out");

async function uri(p: string, mime: string) {
  const b = await readFile(p);
  return `data:${mime};base64,${b.toString("base64")}`;
}

async function main() {
  const vector = await uri(join(out, "set", "panel-2.png"), "image/png");
  const photo = await uri(join(out, "photo", "photo-composite.png"), "image/png");

  // Foto (1200×800) içindeki telefonu kırpıp büyütmek için hesaplanmış background değerleri.
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#0f1115;font-family:-apple-system,Segoe UI,Roboto,sans-serif;padding:48px}
    .row{display:flex;gap:56px;align-items:flex-start;justify-content:center}
    .col{width:400px;text-align:center}
    .num{font-size:120px;font-weight:900;color:#3b4150;line-height:1;margin-bottom:8px}
    h2{color:#fff;font-size:32px;margin-bottom:6px}
    p{color:#9aa0aa;font-size:19px;margin-bottom:22px}
    .frame{width:400px;height:870px;border-radius:14px;overflow:hidden;background:#fff}
    .vec{width:100%;height:100%;object-fit:cover;object-position:center;display:block}
    .pho{width:100%;height:100%;
      background-image:url('${photo}');
      background-repeat:no-repeat;
      background-size:1666px 1110px;
      background-position:-639px -115px;}
  </style></head><body>
    <div class="row">
      <div class="col">
        <div class="num">1</div>
        <h2>Vektör (kod)</h2>
        <p>Bizim · ücretsiz · flat</p>
        <div class="frame"><img class="vec" src="${vector}" /></div>
      </div>
      <div class="col">
        <div class="num">2</div>
        <h2>Foto (gerçek mockup)</h2>
        <p>Canva görünümü · lisans gerekir</p>
        <div class="frame"><div class="pho"></div></div>
      </div>
    </div>
  </body></html>`;

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1010, height: 1200 });
    await page.setContent(html, { waitUntil: "networkidle" });
    const png = Buffer.from(await page.screenshot({ type: "png", fullPage: true }));
    await writeFile(join(out, "compare.png"), png);
    console.log("Çıktı:", join(out, "compare.png"));
  } finally {
    await browser.close();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
