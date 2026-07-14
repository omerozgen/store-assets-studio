/**
 * Export HTTP sunucusu — editörden gelen seti Playwright ile birebir boyutta
 * render edip panel dilimlerini base64 PNG olarak döndürür. Editördeki canlı
 * önizleme ile AYNI core-renderer çıktısı (WYSIWYG).
 *
 * Çalıştır:  pnpm export:serve   (port 8787)
 */
import { createServer } from "node:http";
import { chromium, type Browser } from "playwright";
import { resolveTheme } from "@sas/themes";
import { getTarget } from "@sas/store-specs";
import { renderFeatureGraphicHtml, renderIconHtml, type Panel } from "@sas/core-renderer";
import { logicalViewport } from "@sas/store-specs";
import { renderSetToPngs, renderSingleToPng } from "./render-set.ts";

const PORT = 8787;
let browser: Browser | null = null;
async function getBrowser() {
  if (!browser) browser = await chromium.launch();
  return browser;
}

/** Base64 görsellerle büyük gövdeler normal; yine de bellek için üst sınır koy. */
const MAX_BODY = 128 * 1024 * 1024; // 128 MB

function readBody(req: import("node:http").IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const parts: Buffer[] = [];
    req.on("data", (c: Buffer) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(Object.assign(new Error("İstek gövdesi çok büyük"), { statusCode: 413 }));
        req.destroy();
        return;
      }
      parts.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(parts).toString("utf8")));
    req.on("error", reject);
  });
}

const server = createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.writeHead(204).end();

  if (req.method === "POST" && req.url?.endsWith("/export")) {
    try {
      let body: {
        themeId: string;
        targetId?: string;
        targetIds?: string[];
        overrides?: Parameters<typeof resolveTheme>[1];
        panels: Panel[];
        featureTitle?: string;
        iconSrc?: string;
      };
      try {
        body = JSON.parse(await readBody(req));
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode ?? 400;
        res.writeHead(status, { "content-type": "application/json" });
        return res.end(JSON.stringify({ error: (e as Error).message || "Geçersiz JSON" }));
      }
      if (!Array.isArray(body.panels)) {
        res.writeHead(400, { "content-type": "application/json" });
        return res.end(JSON.stringify({ error: "panels alanı (dizi) zorunlu" }));
      }
      const theme = resolveTheme(body.themeId, body.overrides);
      const ids = body.targetIds?.length ? body.targetIds : [body.targetId ?? "ios-6.9"];
      const browser = await getBrowser();
      const title = body.featureTitle || body.panels[0]?.caption || "";

      const results = [];
      for (const id of ids) {
        const target = getTarget(id);
        let panelsOut;
        if (target.assetType === "feature-graphic") {
          const html = renderFeatureGraphicHtml(
            theme,
            { title, screenshotSrc: body.panels[0]?.screenshotSrc ?? "" },
            logicalViewport(target),
          );
          panelsOut = [await renderSingleToPng(browser, html, target)];
        } else if (target.assetType === "icon") {
          const html = renderIconHtml(
            { src: body.iconSrc, letter: (title || "A").trim().charAt(0).toUpperCase(), background: theme.background, color: theme.font.color, fontFamily: theme.font.family },
            logicalViewport(target),
          );
          panelsOut = [await renderSingleToPng(browser, html, target)];
        } else {
          panelsOut = (await renderSetToPngs(browser, theme, body.panels, target)).panels;
        }
        const allOk = panelsOut.every((p) => p.ok);
        results.push({
          target: { id: target.id, store: target.store, assetType: target.assetType, width: target.width, height: target.height },
          panels: panelsOut.map((p) => ({ index: p.index, base64: p.png.toString("base64"), ok: p.ok })),
          allOk,
        });
        console.log(`export: ${target.id} (${target.assetType}) × ${panelsOut.length} → ${allOk ? "OK" : "BOYUT HATASI"}`);
      }
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ results }));
    } catch (e) {
      console.error(e);
      res.writeHead(500, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: (e as Error).message }));
    }
    return;
  }

  res.writeHead(404).end("not found");
});

server.listen(PORT, () => console.log(`Export sunucusu: http://localhost:${PORT}`));
