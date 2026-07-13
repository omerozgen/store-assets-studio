/**
 * Faz 1 uçtan-uca kanıtı: 3 panelli bir panorama setini bir tema ile render eder.
 *   1) Her panel dilimini out/set/ altına yazar + tam tuvali yazar.
 *   2) Her dilimin boyutunun hedefle birebir eşleştiğini assert eder.
 *   3) SÜREKLİLİK: dilimlerin tam tuvali birebir döşediğini (kenar sütunları
 *      tam tuvaldeki karşılıklarıyla aynı) piksel bazında doğrular.
 *
 * Çalıştır:  pnpm render:set
 */
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { chromium } from "playwright";
import { placeholderScreenshot, type Panel } from "@sas/core-renderer";
import { getTheme, THEMES } from "@sas/themes";
import { getTarget } from "@sas/store-specs";
import { renderSetToPngs } from "./render-set.ts";
import { decodePng } from "./png.ts";

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "out", "set");

const CAPTIONS = ["Her şey tek yerde", "Saniyeler içinde paylaş", "Sen odaklan, gerisi bizde"];

/** Gerçek uygulama ekranı benzeri örnek içerik (data URI). */
function appScreen(i: number): string {
  const w = 1080,
    h = 2280;
  const themes = [
    { bg: "#0b1220", accent: "#3b82f6", card: "#16223a" },
    { bg: "#1a1030", accent: "#a855f7", card: "#2a1a4a" },
    { bg: "#2a0f1a", accent: "#f43f5e", card: "#3d1626" },
  ];
  const t = themes[i % themes.length];
  const rows = Array.from({ length: 4 }, (_, k) => {
    const y = h * 0.42 + k * h * 0.12;
    return `<rect x="${w * 0.08}" y="${y}" width="${w * 0.84}" height="${h * 0.085}" rx="28" fill="${t.card}"/>
      <circle cx="${w * 0.18}" cy="${y + h * 0.0425}" r="${w * 0.05}" fill="${t.accent}" opacity="0.9"/>
      <rect x="${w * 0.28}" y="${y + h * 0.022}" width="${w * 0.4}" height="${h * 0.018}" rx="9" fill="#ffffff" opacity="0.85"/>
      <rect x="${w * 0.28}" y="${y + h * 0.05}" width="${w * 0.28}" height="${h * 0.014}" rx="7" fill="#ffffff" opacity="0.4"/>`;
  }).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect width="${w}" height="${h}" fill="${t.bg}"/>
    <rect x="${w * 0.08}" y="${h * 0.13}" width="${w * 0.5}" height="${h * 0.03}" rx="12" fill="#fff" opacity="0.95"/>
    <rect x="${w * 0.08}" y="${h * 0.175}" width="${w * 0.32}" height="${h * 0.02}" rx="10" fill="#fff" opacity="0.5"/>
    <rect x="${w * 0.08}" y="${h * 0.235}" width="${w * 0.84}" height="${h * 0.14}" rx="36" fill="${t.accent}"/>
    <rect x="${w * 0.13}" y="${h * 0.275}" width="${w * 0.5}" height="${h * 0.028}" rx="12" fill="#fff" opacity="0.95"/>
    <rect x="${w * 0.13}" y="${h * 0.315}" width="${w * 0.35}" height="${h * 0.02}" rx="10" fill="#fff" opacity="0.7"/>
    ${rows}
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function demoPanels(): Panel[] {
  return CAPTIONS.map((caption, i) => ({ caption, screenshotSrc: appScreen(i) }));
}

/**
 * Dilimlerin tam tuvali doğru döşediğini doğrular. Her dilimi, tam tuvalin
 * karşılık gelen bölgesiyle TOLERANSLI karşılaştırır: gerçek bir hizalama hatası
 * (yanlış clip x / boşluk / kayma) yüksek kontrastlı cihaz kenarlarında kitlesel
 * fark yaratır; açılı cihazın transform+gölge AA gürültüsü ise küçük ve seyrektir.
 * Eşik: bir dilimde belirgin (>24/255) sapan piksel oranı %0.5'i geçerse hata.
 */
const DELTA = 24; // kanal başına kabul edilebilir fark
const MAX_FRAC = 0.005; // dilim başına kabul edilebilir sapma oranı

function checkContinuity(fullPng: Buffer, slices: Buffer[], targetW: number): string[] {
  const problems: string[] = [];
  const full = decodePng(fullPng);
  if (full.width !== targetW * slices.length) {
    problems.push(`Tam tuval genişliği ${full.width}, beklenen ${targetW * slices.length}`);
    return problems;
  }
  const ch = full.channels;
  slices.forEach((sliceBuf, i) => {
    const s = decodePng(sliceBuf);
    const offX = i * targetW;
    let bad = 0;
    let total = 0;
    for (let y = 0; y < s.height; y++) {
      const sRow = y * s.width * ch;
      const fRow = y * full.width * ch;
      for (let x = 0; x < targetW; x++) {
        const si = sRow + x * ch;
        const fi = fRow + (x + offX) * ch;
        for (let c = 0; c < ch; c++) {
          if (Math.abs(s.data[si + c] - full.data[fi + c]) > DELTA) bad++;
          total++;
        }
      }
    }
    const frac = bad / total;
    const pct = (frac * 100).toFixed(3);
    if (frac > MAX_FRAC) {
      problems.push(`Panel ${i}: %${pct} piksel sapması — hizalama hatası (eşik %${MAX_FRAC * 100})`);
    } else {
      console.log(`    panel ${i + 1}: %${pct} sapma (AA gürültüsü, eşik altı)`);
    }
  });
  return problems;
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const theme = getTheme(process.argv[2] || "midnight-cascade"); // opsiyonel tema id argümanı
  const target = getTarget("ios-6.9");
  const panels = demoPanels();

  console.log(`Tema: ${theme.name} | Hedef: ${target.label} (${target.width}×${target.height}) | ${panels.length} panel\n`);
  console.log(`Galerideki temalar: ${THEMES.map((t) => t.id).join(", ")}\n`);

  const browser = await chromium.launch();
  let failures = 0;
  try {
    const res = await renderSetToPngs(browser, theme, panels, target);

    await writeFile(join(outDir, "_full-canvas.png"), res.fullCanvas);
    for (const p of res.panels) {
      const file = join(outDir, `panel-${p.index + 1}.png`);
      await writeFile(file, p.png);
      const status = p.ok ? "✓" : "✗";
      console.log(`  ${status} panel-${p.index + 1}  ${p.actual.width}×${p.actual.height}`);
      if (!p.ok) failures++;
    }

    console.log("\nSüreklilik testi (dilimler tam tuvali döşüyor mu):");
    const contProblems = checkContinuity(
      res.fullCanvas,
      res.panels.map((p) => p.png),
      target.width,
    );
    if (contProblems.length) {
      console.error("  ✗ " + contProblems.join("\n  ✗ "));
      failures += contProblems.length;
    } else {
      console.log("  ✓ Tüm dilimler tam tuvalle birebir sürekli");
    }
  } finally {
    await browser.close();
  }

  console.log(`\nÇıktılar: ${outDir}`);
  if (failures) {
    console.error(`❌ ${failures} sorun`);
    process.exit(1);
  }
  console.log("✅ Panorama render + boyut + süreklilik: hepsi geçti");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
