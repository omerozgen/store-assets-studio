/**
 * Foto-gerçekçi çerçeve KANITI (karşılaştırma için).
 * Gerçek bir fotoğrafik telefon mockup'ının (Unsplash, angled iPhone) beyaz ekran
 * bölgesinin 4 köşesini otomatik tespit eder, ardından bir "ekran görüntüsü"nü
 * homography → matrix3d ile bu perspektif dörtgene oturtur.
 *
 * Not: Bu foto yalnızca GÖRSEL KARŞILAŞTIRMA amaçlıdır (Unsplash License). Üründe
 * kullanılacak asset'in lisansı ayrıca netleştirilecek.
 *
 * Çalıştır:  pnpm render:photo
 */
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { chromium } from "playwright";
import { compositeFrame, type DeviceFrame, type Point } from "@sas/device-frames";

const here = dirname(fileURLToPath(import.meta.url));
const assetPath = join(here, "..", "demo-assets", "photo-phone.jpg");
const outDir = join(here, "..", "out", "photo");

/** Renkli, uygulama-benzeri örnek ekran (data URI). */
function appScreen(w: number, h: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#6366f1"/><stop offset="1" stop-color="#ec4899"/></linearGradient></defs>
    <rect width="${w}" height="${h}" fill="url(#g)"/>
    <circle cx="${w * 0.5}" cy="${h * 0.28}" r="${w * 0.18}" fill="rgba(255,255,255,0.9)"/>
    <text x="50%" y="${h * 0.52}" fill="#fff" font-family="sans-serif" font-size="${w * 0.11}" font-weight="800" text-anchor="middle">Merhaba</text>
    <rect x="${w * 0.12}" y="${h * 0.62}" width="${w * 0.76}" height="${h * 0.07}" rx="${h * 0.035}" fill="rgba(255,255,255,0.35)"/>
    <rect x="${w * 0.12}" y="${h * 0.72}" width="${w * 0.76}" height="${h * 0.07}" rx="${h * 0.035}" fill="rgba(255,255,255,0.25)"/>
    <rect x="${w * 0.12}" y="${h * 0.85}" width="${w * 0.76}" height="${h * 0.08}" rx="${h * 0.04}" fill="#fff"/>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** Fotoğraftaki beyaz ekran bölgesinin 4 uç köşesini tarayıcı canvas ile tespit eder. */
async function detectScreenQuad(page: import("playwright").Page, dataUri: string, thr: number) {
  return page.evaluate(
    async ({ dataUri, thr }: { dataUri: string; thr: number }) => {
      const img = new Image();
      img.src = dataUri;
      await img.decode();
      const w = img.naturalWidth,
        h = img.naturalHeight;
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, w, h).data;
      // Uç köşeler: min(x+y)=tl, max(x+y)=br, max(x-y)=tr, min(x-y)=bl
      let tl: [number, number] = [0, 0],
        br: [number, number] = [0, 0],
        tr: [number, number] = [0, 0],
        bl: [number, number] = [0, 0];
      let tlv = 1e9,
        brv = -1e9,
        trv = -1e9,
        blv = 1e9;
      // Metal parlamalarını dışlamak için kaba bir arama penceresi (ekran bu bölgede).
      const x0 = Math.floor(w * 0.4),
        x1 = Math.floor(w * 0.62),
        y0 = Math.floor(h * 0.1),
        y1 = Math.floor(h * 0.95);
      for (let y = y0; y < y1; y++)
        for (let x = x0; x < x1; x++) {
          const i = (y * w + x) * 4;
          if (d[i] > thr && d[i + 1] > thr && d[i + 2] > thr) {
            const s = x + y,
              diff = x - y;
            if (s < tlv) { tlv = s; tl = [x, y]; }
            if (s > brv) { brv = s; br = [x, y]; }
            if (diff > trv) { trv = diff; tr = [x, y]; }
            if (diff < blv) { blv = diff; bl = [x, y]; }
          }
        }
      return { w, h, tl, tr, br, bl };
    },
    { dataUri, thr },
  );
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const jpg = await readFile(assetPath);
  const photoUri = `data:image/jpeg;base64,${jpg.toString("base64")}`;

  const browser = await chromium.launch();
  try {
    const detectPage = await browser.newPage();
    const q = await detectScreenQuad(detectPage, photoUri, 250);
    console.log(`Foto: ${q.w}×${q.h}`);
    console.log(`Tespit edilen ekran köşeleri:`);
    console.log(`  tl=${q.tl}  tr=${q.tr}  br=${q.br}  bl=${q.bl}`);

    const frame: DeviceFrame = {
      id: "photo-iphone-angled",
      name: "Foto iPhone (angled)",
      platform: "ios",
      pose: "angled",
      frameSrc: photoUri,
      canvas: { width: q.w, height: q.h },
      screen: { tl: q.tl as Point, tr: q.tr as Point, br: q.br as Point, bl: q.bl as Point },
      frameOnTop: false, // foto ekranı opak (beyaz) → screenshot ÜSTe biner
      license: { source: "Unsplash", type: "Unsplash License", note: "sadece demo/karşılaştırma" },
    };

    const shot = appScreen(1179, 2556);
    const composite = compositeFrame(frame, shot, { width: 1179, height: 2556 });

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{width:${q.w}px;height:${q.h}px;background:#f2f2f3}
    </style></head><body>${composite}</body></html>`;

    const page = await browser.newPage();
    await page.setViewportSize({ width: q.w, height: q.h });
    await page.setContent(html, { waitUntil: "networkidle" });
    const png = Buffer.from(await page.screenshot({ type: "png" }));
    await writeFile(join(outDir, "photo-composite.png"), png);
    console.log(`\nÇıktı: ${join(outDir, "photo-composite.png")}`);
    console.log("✅ Foto compositing tamam (görsel doğrulama gerekli)");
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
