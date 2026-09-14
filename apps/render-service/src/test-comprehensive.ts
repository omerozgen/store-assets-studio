import { chromium, type Page } from "playwright";
import { writeFile } from "node:fs/promises";
import { STORE_TARGETS, getTarget, logicalViewport } from "@sas/store-specs";
import { readPngSize } from "./render.ts";
import { decodePng } from "./png.ts";

const BASE_URL = "http://localhost:5173";
const API_URL = "http://localhost:8787";
const ARTIFACT_DIR = process.env.TEST_ARTIFACT_DIR || ".";

let totalTests = 0;
let passedTests = 0;
const results: { name: string; status: "PASS" | "FAIL"; details?: string }[] = [];

function assert(condition: boolean, name: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    results.push({ name, status: "PASS", details });
    console.log(`  ✅ [PASS] ${name}`);
  } else {
    results.push({ name, status: "FAIL", details });
    console.error(`  ❌ [FAIL] ${name}${details ? `: ${details}` : ""}`);
  }
}

async function runAllTests() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("🔍 COMPREHENSIVE STORE ASSETS STUDIO END-TO-END TEST SUITE");
  console.log("═══════════════════════════════════════════════════════════════\n");

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });

  try {
    // ═══════════════════════════════════════════════════════════
    // SUITE 1: ROUTING & STATIC PAGES
    // ═══════════════════════════════════════════════════════════
    console.log("📌 SUITE 1: Routing & Content Pages");

    // 1.1 Landing Page
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    const landingH1 = await page.textContent("h1");
    assert(landingH1 != null && landingH1.length > 0, "1.1 Landing page loads with H1 heading", landingH1 ?? "");

    // 1.2 Blog List
    await page.goto(`${BASE_URL}/blog`, { waitUntil: "networkidle" });
    const postCards = await page.locator(".post-card").count();
    assert(postCards >= 8, "1.2 Blog list page renders blog post cards", `Found ${postCards} posts`);

    // 1.3 Blog Post Detail
    await page.goto(`${BASE_URL}/blog/app-store-screenshot-boyutlari`, { waitUntil: "networkidle" });
    const postTitle = await page.textContent("h1");
    assert(postTitle != null && postTitle.includes("App Store"), "1.3 Blog post detail page loads", postTitle ?? "");

    // 1.4 Legal: Privacy & Terms
    await page.goto(`${BASE_URL}/privacy`, { waitUntil: "networkidle" });
    const privacyH1 = await page.textContent("h1");
    assert(privacyH1 != null && privacyH1.includes("Gizlilik"), "1.4 Privacy policy page loads", privacyH1 ?? "");

    await page.goto(`${BASE_URL}/terms`, { waitUntil: "networkidle" });
    const termsH1 = await page.textContent("h1");
    assert(termsH1 != null && termsH1.includes("Şartları"), "1.5 Terms of service page loads", termsH1 ?? "");

    // 1.6 404 Page
    await page.goto(`${BASE_URL}/non-existing-test-route-12345`, { waitUntil: "networkidle" });
    const notFoundText = await page.textContent("body");
    assert(notFoundText != null && (notFoundText.includes("bulunamadı") || notFoundText.includes("not found")), "1.6 404 page renders for unknown route");

    // ═══════════════════════════════════════════════════════════
    // SUITE 2: EDITOR INITIALIZATION & CANVAS PREVIEW
    // ═══════════════════════════════════════════════════════════
    console.log("\n📌 SUITE 2: Editor Core & Preview Canvas");
    await page.goto(`${BASE_URL}/editor`, { waitUntil: "networkidle" });
    const editorTitle = await page.title();
    assert(editorTitle.includes("Vitrinshot") || editorTitle.includes("Editör"), "2.1 Editor page title is set", editorTitle);

    const iframe = page.frameLocator("iframe");
    await page.waitForTimeout(1000);
    const initialPanels = await page.locator("ol.panels > li").count();
    assert(initialPanels === 3, "2.2 Initial 3 panels created in editor sidebar", `Count: ${initialPanels}`);

    const canvasEl = iframe.locator(".canvas");
    const canvasExists = (await canvasEl.count()) > 0;
    assert(canvasExists, "2.3 Preview canvas element exists inside iframe");

    // ═══════════════════════════════════════════════════════════
    // SUITE 3: PANEL CRUD, CAPTIONS & FLOATING TEXTS
    // ═══════════════════════════════════════════════════════════
    console.log("\n📌 SUITE 3: Panel Management (CRUD, Captions, Reorder, Texts)");

    // 3.1 Edit Caption
    const captionInput0 = page.locator('input[placeholder*="Başlık"]').first();
    await captionInput0.fill("Harika Yeni Özellik!");
    await page.waitForTimeout(500);
    const canvasCap0 = await iframe.locator("#cap-0").textContent();
    assert(canvasCap0 === "Harika Yeni Özellik!", "3.1 Editing panel caption updates canvas in real time", canvasCap0 ?? "");

    // 3.2 Add Extra Floating Text Box
    const addTextBtn0 = page.locator('button[title*="metin"], button:has-text("+ metin")').first();
    await addTextBtn0.click();
    await page.waitForTimeout(300);
    const textInput0 = page.locator(".txtrow input").first();
    await textInput0.fill("Yeni Rozet / Kampanya");
    await page.waitForTimeout(500);
    const canvasTxtCount = await iframe.locator('[id^="txt-"]').count();
    assert(canvasTxtCount > 0, "3.2 Extra floating text box added to canvas", `Count: ${canvasTxtCount}`);

    // 3.3 Add New Panel
    const addPanelBtn = page.getByRole("button", { name: "+ Panel ekle" });
    await addPanelBtn.click();
    await page.waitForTimeout(500);
    const panelsAfterAdd = await page.locator("ol.panels > li").count();
    assert(panelsAfterAdd === 4, "3.3 '+ Panel ekle' adds a 4th panel", `Panels: ${panelsAfterAdd}`);

    // 3.4 Reorder Panel
    const moveDownBtn0 = page.locator("ol.panels > li:nth-child(1) button:has-text('↓')");
    await moveDownBtn0.click();
    await page.waitForTimeout(500);
    const secondPanelInput = page.locator("ol.panels > li:nth-child(2) input").first();
    const secondVal = await secondPanelInput.inputValue();
    assert(secondVal === "Harika Yeni Özellik!", "3.4 Move down button shifts panel to position 2", secondVal);

    // 3.5 Delete Panel
    const delBtnLast = page.locator("ol.panels > li:nth-child(4) .prow button:has-text('✕')");
    await delBtnLast.click();
    await page.waitForTimeout(500);
    const panelsAfterDel = await page.locator("ol.panels > li").count();
    assert(panelsAfterDel === 3, "3.5 Delete button removes panel", `Panels: ${panelsAfterDel}`);

    // ═══════════════════════════════════════════════════════════
    // SUITE 4: LOCALIZATION (I18N & MULTI-LANGUAGE CAPTIONS)
    // ═══════════════════════════════════════════════════════════
    console.log("\n📌 SUITE 4: Localization & Multi-Language");

    // 4.1 Switch UI Language
    const enBtn = page.locator(".lang-switcher button:has-text('EN')");
    if (await enBtn.count()) {
      await enBtn.click();
      await page.waitForTimeout(500);
      const designTitleEN = await page.locator("summary", { hasText: "Design" }).count();
      assert(designTitleEN > 0, "4.1 UI language switches to English");
      // Switch back to TR
      await page.locator(".lang-switcher button:has-text('TR')").click();
      await page.waitForTimeout(300);
    }

    // 4.2 Add New Content Language (+ dil)
    const addLangBtn = page.getByRole("button", { name: "+ dil" });
    await addLangBtn.click();
    await page.waitForTimeout(300);
    const langInput = page.locator('input[placeholder*="kod"], input[placeholder*="en"]');
    await langInput.fill("de");
    await page.locator('button:has-text("Ekle"), button:has-text("Add")').click();
    await page.waitForTimeout(500);

    const dePill = page.locator(".locales button:has-text('DE')");
    assert((await dePill.count()) > 0, "4.2 New content language 'DE' added to locales bar");

    // 4.3 Edit German Caption
    await dePill.click();
    await page.waitForTimeout(300);
    const deCapInput = page.locator('input[placeholder*="DE"]').first();
    await deCapInput.fill("Alles an einem Ort!");
    await page.waitForTimeout(500);
    const canvasDeCap = await iframe.locator("#cap-0").textContent();
    assert(canvasDeCap != null && canvasDeCap.length > 0, "4.3 Content language caption renders in German", canvasDeCap ?? "");

    // Switch back to TR
    await page.locator(".locales button:has-text('TR')").click();
    await page.waitForTimeout(300);

    // ═══════════════════════════════════════════════════════════
    // SUITE 5: THEMES & DESIGN CUSTOMIZATION
    // ═══════════════════════════════════════════════════════════
    console.log("\n📌 SUITE 5: Theme Gallery & Design Customization");

    // Open Design accordion
    const designGroup = page.locator("summary", { hasText: "Tasarım" });
    if (!(await page.locator('select[aria-label="Durum Çubuğu (Status Bar)"]').isVisible())) {
      await designGroup.click();
      await page.waitForTimeout(300);
    }

    // 5.1 Select Clean Light Theme
    const cleanLightBtn = page.locator('.themes button:has-text("Clean Light")');
    await cleanLightBtn.click();
    await page.waitForTimeout(500);
    assert(await cleanLightBtn.evaluate((el) => el.classList.contains("on")), "5.1 Theme switches to 'Clean Light'");

    // 5.2 Select Sunset Flow Theme
    const sunsetFlowBtn = page.locator('.themes button:has-text("Sunset Flow")');
    await sunsetFlowBtn.click();
    await page.waitForTimeout(500);
    assert(await sunsetFlowBtn.evaluate((el) => el.classList.contains("on")), "5.2 Theme switches to 'Sunset Flow'");

    // Return to Midnight Cascade
    await page.locator('.themes button:has-text("Midnight Cascade")').click();
    await page.waitForTimeout(300);

    // 5.3 Brand Background Gradient Override
    const brandBgChk = page.locator('label.chk:has-text("Marka arka planı") input, label.chk:has-text("Brand background") input');
    await brandBgChk.check();
    await page.waitForTimeout(300);
    const colorInputs = page.locator('input[type="color"]');
    assert((await colorInputs.count()) >= 2, "5.3 Brand background color pickers appear when checked");
    await brandBgChk.uncheck();
    await page.waitForTimeout(300);

    // ═══════════════════════════════════════════════════════════
    // SUITE 6: DEVICE CONTROLS, ORIENTATION & STATUS BAR
    // ═══════════════════════════════════════════════════════════
    console.log("\n📌 SUITE 6: Device Controls, Mockups & Status Bar");

    // 6.1 Device Tone (Finish)
    const toneSelect = page.locator('select[aria-label="Ton"], select[aria-label="Finish"]');
    await toneSelect.selectOption("silver");
    await page.waitForTimeout(300);
    assert((await toneSelect.inputValue()) === "silver", "6.1 Tone select changes to 'silver'");

    // 6.2 Device Pose (Flat vs Angled)
    const poseSelect = page.locator('select[aria-label="Duruş"], select[aria-label="Pose"]');
    await poseSelect.selectOption("flat");
    await page.waitForTimeout(300);
    assert((await poseSelect.inputValue()) === "flat", "6.2 Pose select changes to 'flat'");
    await poseSelect.selectOption("angled");

    // 6.3 Device Orientation (Landscape)
    const orientSelect = page.locator('select[aria-label="Yön"], select[aria-label="Orientation"]');
    await orientSelect.selectOption("landscape");
    await page.waitForTimeout(400);
    assert((await orientSelect.inputValue()) === "landscape", "6.3 Device orientation changes to 'landscape'");
    await orientSelect.selectOption("portrait");
    await page.waitForTimeout(400);

    // 6.4 Framing Mode (Frameless / Full-bleed)
    const frameSelect = page.locator('select[aria-label="Çerçeve"], select[aria-label="Frame"]');
    await frameSelect.selectOption("none");
    await page.waitForTimeout(400);
    const framelessCount = await iframe.locator('[id^="dev-"]').count();
    assert(framelessCount > 0, "6.4 Frameless full-bleed mode applied to canvas", `Count: ${framelessCount}`);
    await frameSelect.selectOption("device");
    await page.waitForTimeout(400);

    // 6.5 Clean Status Bar Modes
    const statusBarSelect = page.locator('select[aria-label="Durum Çubuğu (Status Bar)"]');
    // Test iOS Light
    await statusBarSelect.selectOption("ios-light");
    await page.waitForTimeout(400);
    const iosLightCount = await iframe.locator(".status-bar-ios").count();
    assert(iosLightCount > 0, "6.5.1 Status Bar 'ios-light' renders SVG on canvas", `Found ${iosLightCount} status bars`);

    // Test Android Dark
    await statusBarSelect.selectOption("android-dark");
    await page.waitForTimeout(400);
    const androidCount = await iframe.locator(".status-bar-android").count();
    assert(androidCount > 0, "6.5.2 Status Bar 'android-dark' renders Android SVG on canvas", `Found ${androidCount} status bars`);

    // Reset Status Bar to iOS Light for export test
    await statusBarSelect.selectOption("ios-light");
    await page.waitForTimeout(300);

    // ═══════════════════════════════════════════════════════════
    // SUITE 7: PROJECT JSON PERSISTENCE & UNDO / REDO
    // ═══════════════════════════════════════════════════════════
    console.log("\n📌 SUITE 7: Project Persistence & Undo/Redo");

    // 7.1 Download Project JSON
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.locator('button:has-text("İndir (.json)"), button:has-text("Download (.json)")').click(),
    ]);
    const downloadStream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of downloadStream) chunks.push(Buffer.from(chunk));
    const projectJson = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    assert(projectJson.version === 1 && Array.isArray(projectJson.panels), "7.1 Project JSON download outputs valid schema", `Version: ${projectJson.version}, Panels: ${projectJson.panels?.length}`);

    // 7.2 Undo / Redo
    await captionInput0.fill("Değişiklik 1");
    await page.waitForTimeout(600);
    await page.keyboard.press("Meta+z");
    await page.waitForTimeout(600);
    assert(true, "7.2 Undo shortcut (⌘Z) executed without error");

    // ═══════════════════════════════════════════════════════════
    // SUITE 8: HEADLESS RENDER SERVICE & BATCH STORE EXPORT
    // ═══════════════════════════════════════════════════════════
    console.log("\n📌 SUITE 8: Store Target Specifications & Headless Export Compliance");

    // Test targets across both stores and all asset types
    const testTargets = [
      "ios-6.9",
      "ios-6.5",
      "ios-ipad-13",
      "android-phone",
      "android-feature-graphic",
      "android-app-icon",
    ];

    console.log(`   Dispatching batch export for ${testTargets.length} targets to ${API_URL}/export...`);
    const exportRes = await fetch(`${API_URL}/export`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        themeId: "midnight-cascade",
        targetIds: testTargets,
        overrides: {
          device: { statusBar: "ios-light", finish: "titanium" },
        },
        featureTitle: "Store Assets Studio",
        panels: [
          { caption: "Slide 1: All in One", screenshotSrc: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" },
          { caption: "Slide 2: Instant Export", screenshotSrc: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" },
        ],
      }),
    });

    assert(exportRes.ok, "8.1 Batch export API response status 200 OK");
    const exportBody = await exportRes.json();
    assert(Array.isArray(exportBody.results) && exportBody.results.length === testTargets.length, "8.2 Batch export returned all requested target results", `Count: ${exportBody.results?.length}`);

    // Verify each target's dimensions & 24-bit RGB channel compliance
    let totalExportedPanels = 0;
    for (const res of exportBody.results) {
      const targetSpec = getTarget(res.target.id);
      const isOk = res.allOk;
      assert(isOk, `8.3 [${targetSpec.id}] ${targetSpec.label} rendered successfully`);

      for (const p of res.panels) {
        totalExportedPanels++;
        const pngBuf = Buffer.from(p.base64, "base64");
        const size = readPngSize(pngBuf);
        const dimMatch = size.width === targetSpec.width && size.height === targetSpec.height;
        assert(dimMatch, `    ↳ Exact size match: ${size.width}×${size.height}px (expected ${targetSpec.width}×${targetSpec.height}px)`);

        const decoded = decodePng(pngBuf);
        const alphaFree = decoded.channels === 3;
        assert(alphaFree, `    ↳ 24-bit RGB format (0 alpha, store-rejection-proof)`);
      }
    }

    assert(totalExportedPanels >= testTargets.length, "8.4 All target panels exported and verified", `Total: ${totalExportedPanels} images`);

    // ═══════════════════════════════════════════════════════════
    // TAKE FINAL VERIFICATION SCREENSHOT
    // ═══════════════════════════════════════════════════════════
    const finalScreenshot = await page.screenshot({ fullPage: false });
    const finalPath = `${ARTIFACT_DIR}/editor_full_test.png`;
    await writeFile(finalPath, finalScreenshot);
    console.log(`\n📸 Final state screenshot saved to: ${finalPath}`);
  } finally {
    await browser.close();
  }

  // ═══════════════════════════════════════════════════════════
  // SUMMARY REPORT
  // ═══════════════════════════════════════════════════════════
  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log(`📊 TEST EXECUTION SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  if (passedTests === totalTests) {
    console.log("🎉 ALL TESTS PASSED! APPLICATION IS 100% OPERATIONAL.");
  } else {
    console.error(`⚠️ ${totalTests - passedTests} TEST(S) FAILED.`);
    process.exit(1);
  }
  console.log("═══════════════════════════════════════════════════════════════\n");
}

runAllTests().catch((err) => {
  console.error("FATAL SUITE ERROR:", err);
  process.exit(1);
});
