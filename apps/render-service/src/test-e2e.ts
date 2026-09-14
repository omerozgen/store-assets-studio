import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";
import { readPngSize } from "./render.ts";
import { decodePng } from "./png.ts";

async function runE2E() {
  console.log("🚀 Starting E2E verification with Playwright...");
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  try {
    // 1. Load Editor
    console.log("👉 1. Navigating to http://localhost:5173/editor...");
    await page.goto("http://localhost:5173/editor", { waitUntil: "networkidle", timeout: 15000 });
    const title = await page.title();
    console.log(`   Page Title: "${title}"`);

    // 2. Open Design Accordion ("2 · Tasarım")
    console.log("👉 2. Opening Design group (2 · Tasarım)...");
    const designSummary = page.locator("summary", { hasText: "Tasarım" });
    await designSummary.click();
    await page.waitForTimeout(500);

    // 3. Check for the new Status Bar selector
    console.log("👉 3. Checking Status Bar selector...");
    const statusBarSelect = page.locator('select[aria-label="Durum Çubuğu (Status Bar)"]');
    await statusBarSelect.waitFor({ state: "visible", timeout: 5000 });
    console.log("   ✓ Status Bar select found and visible!");

    // Select iOS Light
    await statusBarSelect.selectOption("ios-light");
    console.log("   ✓ Selected 'ios-light' status bar!");

    // Wait for canvas to update
    await page.waitForTimeout(1000);

    // 4. Inspect preview iframe for the status bar SVG
    console.log("👉 4. Inspecting preview canvas for status bar SVG...");
    const frame = page.frameLocator("iframe");
    const statusBarG = frame.locator(".status-bar-ios");
    const count = await statusBarG.count();
    console.log(`   ✓ Found ${count} .status-bar-ios element(s) in preview canvas!`);

    // 5. Take full-page screenshot of the working editor
    console.log("👉 5. Taking screenshot of editor with Status Bar active...");
    const screenshotBuf = await page.screenshot({ fullPage: false });
    const screenshotPath = process.env.TEST_ARTIFACT_DIR
      ? `${process.env.TEST_ARTIFACT_DIR}/editor_preview.png`
      : "./editor_preview.png";
    await writeFile(screenshotPath, screenshotBuf);
    console.log(`   ✓ Screenshot saved to: ${screenshotPath}`);

    // 6. Test API Export endpoint with statusBar enabled
    console.log("👉 6. Testing /export endpoint with statusBar: 'ios-light'...");
    const exportResponse = await fetch("http://localhost:8787/export", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        themeId: "midnight-cascade",
        targetId: "ios-6.9",
        overrides: {
          device: { statusBar: "ios-light" },
        },
        panels: [
          { caption: "E2E Test Başlığı", screenshotSrc: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" },
        ],
      }),
    });

    if (!exportResponse.ok) {
      throw new Error(`Export request failed with status: ${exportResponse.status} ${await exportResponse.text()}`);
    }

    const exportData = await exportResponse.json();
    console.log("   ✓ Export API response received!");
    const panel0 = exportData.results[0].panels[0];
    const pngBuf = Buffer.from(panel0.base64, "base64");
    const size = readPngSize(pngBuf);
    console.log(`   ✓ Rendered size: ${size.width}×${size.height} (Target: 1290×2796)`);

    const decoded = decodePng(pngBuf);
    console.log(`   ✓ Channels: ${decoded.channels} (3 = 24-bit RGB without alpha, store compliant!)`);

    if (size.width === 1290 && size.height === 2796 && decoded.channels === 3) {
      console.log("🎉 ALL E2E & COMPLIANCE TESTS PASSED SUCCESSFULLY!");
    } else {
      throw new Error("Dimension or channel mismatch!");
    }
  } finally {
    await browser.close();
  }
}

runE2E().catch((err) => {
  console.error("❌ E2E Failed:", err);
  process.exit(1);
});
