/**
 * "Kullanıcı kendi ekran görüntüsünü atınca dolar mı?" → EVET, kanıtı.
 * Aynı çerçeve/tema/başlık, ama ekran alanına gerçek bir uygulama ekranı benzeri
 * (zengin, fotoğraflı) görüntü konur; ekranı tamamen o doldurur.
 *
 * Çalıştır:  pnpm render:fill
 */
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { chromium } from "playwright";
import type { Panel } from "@sas/core-renderer";
import { getTheme } from "@sas/themes";
import { getTarget } from "@sas/store-specs";
import { renderSetToPngs } from "./render-set.ts";

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "out");

/** Gerçek bir "fotoğraf uygulaması" ekranı benzeri zengin içerik (data URI). */
function realishAppScreen(): string {
  const w = 1080,
    h = 2280;
  const grad = (id: string, a: string, b: string) =>
    `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
  const thumbs = [
    ["#f59e0b", "#ef4444"],
    ["#10b981", "#3b82f6"],
    ["#8b5cf6", "#ec4899"],
    ["#06b6d4", "#6366f1"],
    ["#f43f5e", "#f59e0b"],
    ["#22c55e", "#0ea5e9"],
  ];
  const grid = thumbs
    .map((c, i) => {
      const col = i % 3,
        row = Math.floor(i / 3);
      const x = w * 0.06 + col * (w * 0.3 + w * 0.02);
      const y = h * 0.55 + row * (h * 0.16 + h * 0.015);
      return `<rect x="${x}" y="${y}" width="${w * 0.3}" height="${h * 0.16}" rx="20" fill="url(#t${i})"/>`;
    })
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      ${grad("hero", "#7c3aed", "#ec4899")}
      ${thumbs.map((c, i) => grad(`t${i}`, c[0], c[1])).join("")}
    </defs>
    <rect width="${w}" height="${h}" fill="#0e1017"/>
    <!-- üst bar -->
    <text x="${w * 0.06}" y="${h * 0.11}" fill="#fff" font-family="sans-serif" font-size="${w * 0.06}" font-weight="800">Keşfet</text>
    <circle cx="${w * 0.9}" cy="${h * 0.1}" r="${w * 0.045}" fill="#232838"/>
    <!-- hero kart -->
    <rect x="${w * 0.06}" y="${h * 0.15}" width="${w * 0.88}" height="${h * 0.32}" rx="40" fill="url(#hero)"/>
    <circle cx="${w * 0.18}" cy="${h * 0.42}" r="${w * 0.045}" fill="#fff" opacity="0.9"/>
    <rect x="${w * 0.24}" y="${h * 0.405}" width="${w * 0.4}" height="${h * 0.022}" rx="11" fill="#fff" opacity="0.95"/>
    <rect x="${w * 0.24}" y="${h * 0.435}" width="${w * 0.26}" height="${h * 0.016}" rx="8" fill="#fff" opacity="0.6"/>
    <!-- grid başlık -->
    <rect x="${w * 0.06}" y="${h * 0.5}" width="${w * 0.3}" height="${h * 0.026}" rx="12" fill="#fff" opacity="0.85"/>
    ${grid}
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const theme = getTheme("midnight-cascade");
  const target = getTarget("ios-6.9");
  const panels: Panel[] = [{ caption: "Senin ekran görüntün burada", screenshotSrc: realishAppScreen() }];

  const browser = await chromium.launch();
  try {
    const res = await renderSetToPngs(browser, theme, panels, target);
    await writeFile(join(outDir, "fill.png"), res.panels[0].png);
    console.log("Çıktı:", join(outDir, "fill.png"), `(${res.panels[0].actual.width}×${res.panels[0].actual.height})`);
  } finally {
    await browser.close();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
