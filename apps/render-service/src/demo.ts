/**
 * Faz 0 uçtan-uca kanıtı: örnek bir sahneyi birkaç hedef için render eder,
 * out/ altına yazar ve HER çıktının boyutunun hedefle birebir eşleştiğini
 * (piksel doğruluğu) assert eder.
 *
 * Çalıştır:  pnpm render:demo
 */
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { chromium } from "playwright";
import { placeholderScreenshot, type Scene } from "@sas/core-renderer";
import { STORE_TARGETS, validateTargets, type StoreTarget } from "@sas/store-specs";
import { renderTargetToPng } from "./render.ts";

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "out");

/** Hedefin tipine göre uygun demo sahnesi üretir. */
function demoScene(target: StoreTarget): Scene {
  if (target.assetType === "icon") {
    return {
      background: { type: "gradient", colors: ["#6366f1", "#ec4899"], angle: 135 },
      paddingPct: 14,
      screenshot: {
        src: placeholderScreenshot(600, 600, "◎", "#4338ca"),
        frame: false,
        cornerPct: 22,
      },
    };
  }
  if (target.assetType === "feature-graphic") {
    return {
      background: { type: "gradient", colors: ["#0ea5e9", "#7c3aed"], angle: 90 },
      paddingPct: 5,
      caption: { text: "Uygulamanı öne çıkar", sizePct: 7, position: "top" },
    };
  }
  // screenshot
  return {
    background: { type: "gradient", colors: ["#111827", "#4f46e5"], angle: 160 },
    paddingPct: 8,
    caption: { text: "Her şey tek dokunuşta", sizePct: 6.5, position: "top" },
    screenshot: {
      src: placeholderScreenshot(1080, 2160, target.label, "#1f2937"),
      frame: true,
      frameColor: "#0b0b0b",
      cornerPct: 9,
    },
  };
}

async function main() {
  const specProblems = validateTargets();
  if (specProblems.length) {
    console.error("❌ store-specs tutarsız:\n  " + specProblems.join("\n  "));
    process.exit(1);
  }

  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();
  let failures = 0;

  try {
    for (const target of STORE_TARGETS) {
      const scene = demoScene(target);
      const res = await renderTargetToPng(browser, scene, target);
      const file = join(outDir, `${target.id}.png`);
      await writeFile(file, res.png);

      const status = res.ok ? "✓" : "✗";
      const size = `${res.actual.width}×${res.actual.height}`;
      const want = `${target.width}×${target.height}`;
      console.log(
        `  ${status} ${target.id.padEnd(24)} ${size.padEnd(11)} (beklenen ${want})`,
      );
      if (!res.ok) failures++;
    }
  } finally {
    await browser.close();
  }

  console.log(`\nÇıktılar: ${outDir}`);
  if (failures) {
    console.error(`❌ ${failures} hedefte boyut uyuşmadı`);
    process.exit(1);
  }
  console.log(`✅ ${STORE_TARGETS.length} hedefin tümü birebir doğru boyutta`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
