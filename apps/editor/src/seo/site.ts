/**
 * Tek SEO doğruluk kaynağı — hem React <Seo> bileşeni hem build-time prerender/sitemap
 * betikleri (render-service, tsx) bunu kullanır. Saf veri + string üretir; React/DOM'a
 * bağımlı değil, node'da da import edilebilir (posts.ts saf veri; `import type Lang` erase edilir).
 *
 * Dil stratejisi: TR kökte (/, /blog/x), İngilizce /en önekiyle (/en, /en/blog/x).
 * Dil URL'den türetilir → her dil ayrı taranır/indekslenir; prerender doğru dili yakalar.
 */
import type { Lang } from "../i18n/index.tsx";
import { POSTS, getPost } from "../content/posts.ts";

export const BASE = "https://vitrinshot.com";
const OG_IMAGE = `${BASE}/og-image.png`;
const ORG = { "@type": "Organization", name: "Vitrinshot", url: BASE, logo: `${BASE}/icon-512.png` };
/** Statik sayfaların lastmod'u için en yeni yazı tarihini kullan (deterministik). */
const LATEST = POSTS.reduce((m, p) => (p.date > m ? p.date : m), "2026-01-01");

/** Dil-nötr (TR/temel biçim) tüm rota yolları. */
export const STATIC_PATHS = ["/", "/editor", "/blog", "/privacy", "/terms"] as const;
export function allNeutralPaths(): string[] {
  return [...STATIC_PATHS, ...POSTS.map((p) => `/blog/${p.slug}`)];
}

export function enPath(path: string): string {
  return path === "/" ? "/en" : "/en" + path;
}
export function localizedPath(path: string, lang: Lang): string {
  return lang === "en" ? enPath(path) : path;
}
export function fullUrl(path: string, lang: Lang): string {
  return BASE + localizedPath(path, lang);
}

/** URL yolunu dil-nötr yola + dile ayırır. "/en/blog/x" → { path:"/blog/x", lang:"en" } */
export function parsePath(pathname: string): { path: string; lang: Lang } {
  const p = pathname.replace(/\/+$/, "") || "/";
  if (p === "/en") return { path: "/", lang: "en" };
  if (p.startsWith("/en/")) return { path: p.slice(3), lang: "en" };
  return { path: p || "/", lang: "tr" };
}

/** Sitemap + prerender için tüm URL'ler (her dil). */
export function allUrls(): { url: string; path: string; lang: Lang; lastmod: string }[] {
  const out: { url: string; path: string; lang: Lang; lastmod: string }[] = [];
  for (const path of allNeutralPaths()) {
    const m = path.match(/^\/blog\/(.+)$/);
    const lastmod = m ? getPost(m[1])?.date ?? LATEST : LATEST;
    for (const lang of ["tr", "en"] as Lang[]) out.push({ url: fullUrl(path, lang), path, lang, lastmod });
  }
  return out;
}

export type SeoMeta = {
  title: string;
  description: string;
  canonical: string;
  ogImage: string;
  lang: Lang;
  noindex: boolean;
  alternates: { hreflang: string; href: string }[];
  jsonLd: object[];
};

/** Statik sayfa SEO metinleri (dil bazlı). */
const STATIC_META: Record<string, { title: Record<Lang, string>; desc: Record<Lang, string> }> = {
  "/": {
    title: {
      tr: "Vitrinshot — App Store & Google Play ekran görüntüsü ve mağaza görseli oluşturucu",
      en: "Vitrinshot — App Store & Google Play screenshot generator",
    },
    desc: {
      tr: "App Store ve Google Play için panorama tarzı, tam boyutlu ekran görüntülerini ve mağaza görsellerini çoklu dilde, ücretsiz ve üyeliksiz oluştur — doğrudan tarayıcında.",
      en: "Create polished, panorama-style App Store and Google Play screenshots in exact sizes and multiple languages — free, no sign-up, right in your browser.",
    },
  },
  "/editor": {
    title: { tr: "Editör — Vitrinshot", en: "Editor — Vitrinshot" },
    desc: {
      tr: "Ekran görüntülerini sürükle-bırak, tema seç, çoklu mağaza boyutunda ve dilde tek tıkla dışa aktar. Ücretsiz, üyeliksiz.",
      en: "Drag and drop your screenshots, pick a theme, and export in every store size and language in one click. Free, no sign-up.",
    },
  },
  "/blog": {
    title: { tr: "Blog — mağaza görselleri rehberleri | Vitrinshot", en: "Blog — store asset guides | Vitrinshot" },
    desc: {
      tr: "App Store ve Google Play ekran görüntüsü boyutları, red sebepleri, tasarım ve otomasyon rehberleri.",
      en: "Guides on App Store and Google Play screenshot sizes, rejection reasons, design, and automation.",
    },
  },
  "/privacy": {
    title: { tr: "Gizlilik Politikası — Vitrinshot", en: "Privacy Policy — Vitrinshot" },
    desc: {
      tr: "Vitrinshot gizlilik politikası: hangi verileri işliyoruz, çerezler ve üçüncü taraf hizmetleri.",
      en: "Vitrinshot privacy policy: what data we process, cookies, and third-party services.",
    },
  },
  "/terms": {
    title: { tr: "Kullanım Şartları — Vitrinshot", en: "Terms of Service — Vitrinshot" },
    desc: {
      tr: "Vitrinshot kullanım şartları ve hizmet koşulları.",
      en: "Vitrinshot terms of service and conditions of use.",
    },
  },
};

function alternatesFor(path: string): { hreflang: string; href: string }[] {
  return [
    { hreflang: "tr", href: fullUrl(path, "tr") },
    { hreflang: "en", href: fullUrl(path, "en") },
    { hreflang: "x-default", href: fullUrl(path, "en") },
  ];
}

function softwareJsonLd(lang: Lang): object[] {
  const m = STATIC_META["/"];
  return [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Vitrinshot",
      description: m.desc[lang],
      applicationCategory: "DesignApplication",
      operatingSystem: "Web",
      url: fullUrl("/", lang),
      inLanguage: lang,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      publisher: ORG,
    },
    { "@context": "https://schema.org", "@type": "WebSite", name: "Vitrinshot", url: BASE, inLanguage: lang },
    { "@context": "https://schema.org", ...ORG },
  ];
}

function breadcrumb(items: { name: string; path: string }[], lang: Lang): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: fullUrl(it.path, lang),
    })),
  };
}

/** Bir rota (dil-nötr yol) + dil için tüm SEO head verisi. */
export function metaFor(path: string, lang: Lang): SeoMeta {
  const base = { canonical: fullUrl(path, lang), ogImage: OG_IMAGE, lang, alternates: alternatesFor(path) };

  // Blog yazısı?
  const bm = path.match(/^\/blog\/(.+)$/);
  if (bm) {
    const post = getPost(bm[1]);
    if (post) {
      return {
        ...base,
        title: `${post.title[lang]} — Vitrinshot`,
        description: post.description[lang],
        noindex: false,
        jsonLd: [
          {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title[lang],
            description: post.description[lang],
            datePublished: post.date,
            dateModified: post.date,
            inLanguage: lang,
            image: OG_IMAGE,
            author: ORG,
            publisher: ORG,
            mainEntityOfPage: { "@type": "WebPage", "@id": base.canonical },
          },
          breadcrumb(
            [
              { name: lang === "tr" ? "Ana sayfa" : "Home", path: "/" },
              { name: "Blog", path: "/blog" },
              { name: post.title[lang], path },
            ],
            lang,
          ),
        ],
      };
    }
  }

  // Statik sayfa?
  const sm = STATIC_META[path];
  if (sm) {
    const jsonLd: object[] =
      path === "/" || path === "/editor"
        ? softwareJsonLd(lang)
        : path === "/blog"
          ? [
              { "@context": "https://schema.org", "@type": "CollectionPage", name: sm.title[lang], url: base.canonical, inLanguage: lang },
              breadcrumb([{ name: lang === "tr" ? "Ana sayfa" : "Home", path: "/" }, { name: "Blog", path: "/blog" }], lang),
            ]
          : [{ "@context": "https://schema.org", "@type": "WebPage", name: sm.title[lang], url: base.canonical, inLanguage: lang }];
    return { ...base, title: sm.title[lang], description: sm.desc[lang], noindex: false, jsonLd };
  }

  // Bilinmeyen yol (404) → noindex, alternatif yok.
  return {
    canonical: fullUrl(path, lang),
    ogImage: OG_IMAGE,
    lang,
    alternates: [],
    title: lang === "tr" ? "Sayfa bulunamadı — Vitrinshot" : "Page not found — Vitrinshot",
    description: "",
    noindex: true,
    jsonLd: [],
  };
}

/** sitemap.xml içeriğini üretir (hreflang alternatifleriyle). */
export function buildSitemap(): string {
  // Aynı dil-nötr yol için iki dil kaydı; her kayıt tüm alternatifleri listeler.
  const urls = allUrls();
  const rows = urls
    .map(({ url, path, lastmod }) => {
      const alts = [
        `<xhtml:link rel="alternate" hreflang="tr" href="${fullUrl(path, "tr")}"/>`,
        `<xhtml:link rel="alternate" hreflang="en" href="${fullUrl(path, "en")}"/>`,
        `<xhtml:link rel="alternate" hreflang="x-default" href="${fullUrl(path, "en")}"/>`,
      ].join("");
      const priority = path === "/" ? "1.0" : path === "/editor" ? "0.9" : path.startsWith("/blog/") ? "0.7" : path === "/blog" ? "0.6" : "0.3";
      return `  <url><loc>${url}</loc><lastmod>${lastmod}</lastmod><priority>${priority}</priority>${alts}</url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${rows}
</urlset>
`;
}
