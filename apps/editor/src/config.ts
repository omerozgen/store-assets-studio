/**
 * İsteğe bağlı reklam / sponsorluk yapılandırması.
 * Varsayılan olarak kapalıdır.
 */
export const ADSENSE_CLIENT = "";

export const AD_SLOTS = {
  landing: "",
  blog: "",
  exportDone: "",
};

/** Reklam kodu yalnız geçerli bir publisher ID varsa etkinleşir. */
export const adsEnabled = (): boolean => /^ca-pub-\d{10,}$/.test(ADSENSE_CLIENT);

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

let adsScriptLoaded = false;
/** adsbygoogle.js'i YALNIZ onay (consent) sonrası ve ID doluysa dinamik yükler. Auto ads KAPALI. */
export function loadAdSense(): void {
  if (!adsEnabled() || adsScriptLoaded || document.getElementById("adsense-src")) return;
  adsScriptLoaded = true;
  const s = document.createElement("script");
  s.id = "adsense-src";
  s.async = true;
  s.crossOrigin = "anonymous";
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
  document.head.appendChild(s);
}
