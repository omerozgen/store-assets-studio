/**
 * Export HTTP sunucusu — editörden gelen seti Playwright ile birebir boyutta
 * render edip panel dilimlerini base64 PNG olarak döndürür. Editördeki canlı
 * önizleme ile AYNI core-renderer çıktısı (WYSIWYG).
 *
 * Çalıştır:  pnpm export:serve   (yerel: 8787; Cloud Run PORT env verir)
 *
 * Ortam değişkenleri (yayın):
 *   PORT                    Cloud Run otomatik verir (varsayılan 8787)
 *   RATE_LIMIT_PER_DAY      IP başına günlük export isteği (varsayılan 20; 0 = kapalı)
 *   MAX_CONCURRENT_RENDERS  Eşzamanlı render (varsayılan 2)
 *   ALLOWED_ORIGINS         Virgüllü CORS allowlist (varsayılan *; Hosting rewrite
 *                           kullanılırsa aynı origin olur, CORS'a gerek kalmaz)
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join, normalize, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type Browser } from "playwright";
import { resolveTheme } from "@sas/themes";
import { getTarget } from "@sas/store-specs";
import { renderFeatureGraphicHtml, renderIconHtml, type Panel } from "@sas/core-renderer";
import { logicalViewport } from "@sas/store-specs";
import { renderSetToPngs, renderSingleToPng } from "./render-set.ts";

const PORT = Number(process.env.PORT ?? 8787);
const RATE_LIMIT_PER_DAY = Number(process.env.RATE_LIMIT_PER_DAY ?? 0); // 0 = sınırsız (self-host için varsayılan)
const MAX_CONCURRENT = Math.max(1, Number(process.env.MAX_CONCURRENT_RENDERS ?? 2));
const MAX_QUEUE = 10;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? "*").split(",").map((s) => s.trim());

let browser: Browser | null = null;
async function getBrowser() {
  if (!browser) browser = await chromium.launch();
  return browser;
}

// ---- Statik editör sunumu (tek-servis deploy: editör build'i varsa buradan servis edilir) ----
const STATIC_DIR =
  process.env.STATIC_DIR ?? join(dirname(fileURLToPath(import.meta.url)), "..", "..", "editor", "dist");
const HAS_STATIC = existsSync(join(STATIC_DIR, "index.html"));
const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".json": "application/json",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};
/** gzip'lenebilir metin türleri. */
const GZIP_TYPES = new Set([
  "text/html; charset=utf-8",
  "text/javascript",
  "text/css",
  "image/svg+xml",
  "application/json",
  "application/manifest+json",
  "text/plain; charset=utf-8",
  "application/xml; charset=utf-8",
]);

async function serveStatic(
  url: string,
  req: import("node:http").IncomingMessage,
  res: import("node:http").ServerResponse,
): Promise<boolean> {
  if (!HAS_STATIC) return false;
  const path = normalize((url.split("?")[0] || "/")).replace(/^\/+/, "");
  let file = join(STATIC_DIR, path === "" ? "index.html" : path);
  if (!file.startsWith(STATIC_DIR)) return false; // path traversal koruması

  // Prerender edilmiş rota dizini: /blog/x → dist/blog/x/index.html
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");

  // Dosya yoksa: dizin-index'i dene, yoksa asset/rota ayrımıyla 404.
  let status = 200;
  if (!existsSync(file)) {
    const asDir = join(STATIC_DIR, path, "index.html");
    if (path && !extname(path) && existsSync(asDir)) {
      file = asDir; // prerender'lı rota (dizin-index) → 200
    } else if (extname(path)) {
      // Eksik asset → düz 404 (HTML shell döndürme).
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("not found");
      return true;
    } else {
      // Bilinmeyen rota → SPA shell'i 404 statüsüyle dön (soft-404 değil; NotFound render eder).
      file = join(STATIC_DIR, "index.html");
      status = 404;
    }
  }
  try {
    let data = await readFile(file);
    const type = MIME[extname(file)] ?? "application/octet-stream";
    const immutable = path.startsWith("assets/");
    const headers: Record<string, string> = {
      "content-type": type,
      "cache-control": immutable ? "public, max-age=31536000, immutable" : "public, max-age=0, must-revalidate",
    };
    // gzip (metin türleri + istemci destekliyorsa)
    const acceptsGzip = (req.headers["accept-encoding"] ?? "").includes("gzip");
    if (acceptsGzip && GZIP_TYPES.has(type) && data.length > 512) {
      data = gzipSync(data);
      headers["content-encoding"] = "gzip";
      headers["vary"] = "Accept-Encoding";
    }
    res.writeHead(status, headers);
    res.end(data);
    return true;
  } catch {
    return false;
  }
}

// ---- IP başına günlük rate limit (bellek içi; tek instance için doğru,
// çoklu instance'ta yaklaşık — v2'de Firestore/Redis sayacına taşınır) ----
const usage = new Map<string, { day: string; count: number }>();
function clientIp(req: import("node:http").IncomingMessage): string {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length) return fwd.split(",")[0].trim();
  return req.socket.remoteAddress ?? "unknown";
}
/** Limit aşıldıysa false; değilse sayacı artırır. */
function checkRateLimit(ip: string): { ok: boolean; remaining: number } {
  if (RATE_LIMIT_PER_DAY <= 0) return { ok: true, remaining: -1 };
  const day = new Date().toISOString().slice(0, 10);
  const u = usage.get(ip);
  if (!u || u.day !== day) {
    usage.set(ip, { day, count: 1 });
    if (usage.size > 50_000) usage.clear(); // bellek emniyeti
    return { ok: true, remaining: RATE_LIMIT_PER_DAY - 1 };
  }
  if (u.count >= RATE_LIMIT_PER_DAY) return { ok: false, remaining: 0 };
  u.count++;
  return { ok: true, remaining: RATE_LIMIT_PER_DAY - u.count };
}

// ---- Render kuyruğu (Chromium CPU-yoğun; aynı anda en fazla N render) ----
let active = 0;
const waiting: Array<() => void> = [];
async function acquireSlot(): Promise<void> {
  if (active < MAX_CONCURRENT) {
    active++;
    return;
  }
  if (waiting.length >= MAX_QUEUE) {
    throw Object.assign(new Error("Sunucu yoğun, lütfen az sonra tekrar deneyin"), { statusCode: 429 });
  }
  await new Promise<void>((res) => waiting.push(res));
  active++;
}
function releaseSlot() {
  active--;
  waiting.shift()?.();
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
  const origin = req.headers.origin ?? "";
  const allowOrigin = ALLOWED_ORIGINS.includes("*") ? "*" : ALLOWED_ORIGINS.includes(origin) ? origin : "";
  if (allowOrigin) res.setHeader("Access-Control-Allow-Origin", allowOrigin);
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.writeHead(204).end();

  // Cloud Run sağlık kontrolü
  if (req.method === "GET" && req.url === "/healthz") {
    res.writeHead(200, { "content-type": "text/plain" });
    return res.end("ok");
  }

  // Editör (statik build) — /api dışındaki GET'ler
  if (req.method === "GET" && !req.url?.startsWith("/api")) {
    if (await serveStatic(req.url ?? "/", req, res)) return;
  }

  if (req.method === "POST" && req.url?.endsWith("/export")) {
    // Rate limit (render'a hiç girmeden reddet)
    const rl = checkRateLimit(clientIp(req));
    if (rl.remaining >= 0) res.setHeader("X-RateLimit-Remaining", String(rl.remaining));
    if (!rl.ok) {
      res.writeHead(429, { "content-type": "application/json" });
      return res.end(JSON.stringify({ error: "Günlük export limitine ulaşıldı. Yarın tekrar deneyin." }));
    }
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

      // Render kuyruğu: aynı anda en fazla MAX_CONCURRENT istek render eder.
      await acquireSlot();
      try {
      // Hedefler paralel render edilir (her biri kendi browser context'inde).
      const results = await Promise.all(
        ids.map(async (id) => {
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
          console.log(`export: ${target.id} (${target.assetType}) × ${panelsOut.length} → ${allOk ? "OK" : "BOYUT HATASI"}`);
          return {
            target: { id: target.id, store: target.store, assetType: target.assetType, width: target.width, height: target.height },
            panels: panelsOut.map((p) => ({ index: p.index, base64: p.png.toString("base64"), ok: p.ok })),
            allOk,
          };
        }),
      );
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ results }));
      } finally {
        releaseSlot();
      }
    } catch (e) {
      console.error(e);
      const status = (e as { statusCode?: number }).statusCode ?? 500;
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: (e as Error).message }));
    }
    return;
  }

  res.writeHead(404).end("not found");
});

server.listen(PORT, () =>
  console.log(
    `Export sunucusu: http://localhost:${PORT} (limit: ${RATE_LIMIT_PER_DAY}/gün, eşzamanlı: ${MAX_CONCURRENT})`,
  ),
);
