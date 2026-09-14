/**
 * Rota bazlı SEO head yöneticisi. Her navigasyonda title, description, canonical, OG,
 * Twitter, hreflang alternatifleri, robots ve JSON-LD'yi <head>'e imperatif yazar.
 * Prerender (Playwright) render sonrası bu head'i yakalar → statik HTML'de doğru meta.
 * Tüm SEO verisi tek kaynaktan gelir: seo/site.ts `metaFor()`.
 */
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { metaFor, parsePath } from "../seo/site.ts";

const MANAGED = "data-seo"; // bu bileşenin eklediği etiketleri işaretle → temizle/değiştir

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    el.setAttribute(MANAGED, "");
    document.head.appendChild(el);
  }
  el.content = content;
}

function upsertCanonical(href: string) {
  let el = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.rel = "canonical";
    document.head.appendChild(el);
  }
  el.href = href;
}

export function Seo() {
  const { pathname } = useLocation();
  useEffect(() => {
    const { path, lang } = parsePath(pathname);
    const m = metaFor(path, lang);

    document.title = m.title;
    upsertMeta("name", "description", m.description);
    upsertCanonical(m.canonical);

    // Open Graph + Twitter
    upsertMeta("property", "og:title", m.title);
    upsertMeta("property", "og:description", m.description);
    upsertMeta("property", "og:url", m.canonical);
    upsertMeta("property", "og:image", m.ogImage);
    upsertMeta("property", "og:type", path.startsWith("/blog/") ? "article" : "website");
    upsertMeta("property", "og:locale", lang === "tr" ? "tr_TR" : "en_US");
    upsertMeta("name", "twitter:title", m.title);
    upsertMeta("name", "twitter:description", m.description);
    upsertMeta("name", "twitter:image", m.ogImage);

    // robots (noindex yalnız bilinmeyen/404 yollarda)
    upsertMeta("name", "robots", m.noindex ? "noindex, follow" : "index, follow");

    // hreflang alternatifleri — eskileri temizle, yenilerini ekle
    document.head.querySelectorAll(`link[rel="alternate"][${MANAGED}]`).forEach((n) => n.remove());
    for (const a of m.alternates) {
      const l = document.createElement("link");
      l.rel = "alternate";
      l.hreflang = a.hreflang;
      l.href = a.href;
      l.setAttribute(MANAGED, "");
      document.head.appendChild(l);
    }

    // JSON-LD — eskileri temizle, yenilerini ekle
    document.head.querySelectorAll(`script[type="application/ld+json"][${MANAGED}]`).forEach((n) => n.remove());
    for (const obj of m.jsonLd) {
      const s = document.createElement("script");
      s.type = "application/ld+json";
      s.setAttribute(MANAGED, "");
      s.textContent = JSON.stringify(obj);
      document.head.appendChild(s);
    }
  }, [pathname]);

  return null;
}
