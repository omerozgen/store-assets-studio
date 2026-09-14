/**
 * Build sonrası prerender (SSG) — editör SPA'sını headless Chromium ile gezip her rotayı
 * gerçek HTML'e döker. Botlar artık JS çalıştırmadan içeriği + doğru <head>'i (title,
 * canonical, OG, hreflang, JSON-LD) görür. Ayrıca dist/sitemap.xml'i üretir.
 *
 * Çalıştır (editör build'inden SONRA):  pnpm --filter @sas/render-service prerender
 * Docker'da chromium install'dan sonra çağrılır.
 */
import { createServer } from "node:http";
import { readFile, writeFile, mkdir, readFile as read } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { allUrls, buildSitemap, localizedPath } from "../../editor/src/seo/site.ts";

const DIST = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "editor", "dist");
const PORT = 41999;

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
  ".webp": "image/webp",
};

async function main() {
  if (!existsSync(join(DIST, "index.html"))) {
    console.error(`prerender: ${DIST}/index.html yok — önce editörü build et.`);
    process.exit(1);
  }
  // Orijinal shell'i belleğe al; tüm rota istekleri bunu alır (saf SPA). Asset'ler diskten.
  const SHELL = await read(join(DIST, "index.html"));

  const server = createServer(async (req, res) => {
    const url = (req.url ?? "/").split("?")[0];
    const ext = extname(url);
    if (ext && ext !== ".html") {
      const file = join(DIST, url.replace(/^\/+/, ""));
      if (file.startsWith(DIST) && existsSync(file)) {
        res.writeHead(200, { "content-type": MIME[ext] ?? "application/octet-stream" });
        return res.end(await readFile(file));
      }
      res.writeHead(404).end("not found");
      return;
    }
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(SHELL); // rota → SPA shell; JS URL'den doğru sayfayı render eder
  });
  await new Promise<void>((r) => server.listen(PORT, r));

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const urls = allUrls();
  let ok = 0;
  try {
    for (const { path, lang } of urls) {
      const route = localizedPath(path, lang);
      try {
        await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: "networkidle", timeout: 20000 });
        // React render + Seo effect tamamlansın: #root dolu + canonical + başlık var.
        await page.waitForFunction(
          () =>
            (document.getElementById("root")?.children.length ?? 0) > 0 &&
            !!document.querySelector('link[rel="canonical"]') &&
            document.title.length > 0,
          { timeout: 15000 },
        );
      } catch (e) {
        console.warn(`  ! ${route} bekleme zaman aşımı — yine de yakalanıyor (${(e as Error).message.split("\n")[0]})`);
      }
      const html = "<!DOCTYPE html>\n" + (await page.evaluate(() => document.documentElement.outerHTML));
      const outFile = route === "/" ? join(DIST, "index.html") : join(DIST, route.replace(/^\/+/, ""), "index.html");
      await mkdir(dirname(outFile), { recursive: true });
      await writeFile(outFile, html);
      ok++;
      console.log(`  ✓ ${route} → ${outFile.replace(DIST, "dist")}`);
    }

    // sitemap.xml üret (hreflang alternatifleriyle)
    await writeFile(join(DIST, "sitemap.xml"), buildSitemap());
    console.log(`  ✓ dist/sitemap.xml (${urls.length} URL)`);
  } finally {
    await browser.close();
    server.close();
  }
  console.log(`\n✅ Prerender: ${ok}/${urls.length} rota + sitemap`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
