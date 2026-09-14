import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../i18n/index.tsx";
import { loadAdSense } from "../config.ts";

/**
 * Çerez onayı (Google Consent Mode v2). index.html varsayılan olarak consent'i
 * "denied" kurar; kullanıcı Kabul edene kadar GA/reklam çerezi yazılmaz. Seçim
 * localStorage'da kalıcı. Kabul → gtag('consent','update', granted).
 */
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const KEY = "sas-consent";
const GA_ID = (import.meta.env.VITE_GA_ID as string | undefined)?.trim() ?? "";
let gaLoaded = false;

/** gtag.js'i YALNIZCA onaydan sonra ve GA_ID tanımlıysa yükler. */
function loadGA() {
  if (!GA_ID || gaLoaded || document.getElementById("ga-src")) return;
  gaLoaded = true;
  const s = document.createElement("script");
  s.id = "ga-src";
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);
  window.gtag?.("js", new Date());
  window.gtag?.("config", GA_ID);
}

function grantConsent() {
  window.gtag?.("consent", "update", {
    ad_storage: "granted",
    ad_user_data: "granted",
    ad_personalization: "granted",
    analytics_storage: "granted",
  });
  loadGA();
  loadAdSense(); // yalnız ADSENSE_CLIENT doluysa yükler (aksi halde no-op)
}

export function CookieConsent() {
  const { t } = useI18n();
  const [show, setShow] = useState(false);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(KEY);
    } catch {
      /* yoksay */
    }
    if (saved === "granted") grantConsent(); // önceki onay → GA'yı yükle
    else if (saved !== "denied") setShow(true); // seçim yoksa banner göster
    // "denied" → hiçbir şey yükleme
  }, []);

  const choose = (granted: boolean) => {
    try {
      localStorage.setItem(KEY, granted ? "granted" : "denied");
    } catch {
      /* yoksay */
    }
    if (granted) grantConsent(); // reddedilirse GA/AdSense hiç yüklenmez
    // AdSlot bileşenleri onay durumunu bu olayla dinler (yeniden render).
    window.dispatchEvent(new Event("sas-consent"));
    setShow(false);
  };

  if (!show) return null;
  return (
    <div className="cookie" role="dialog" aria-live="polite">
      <p>
        {t("consent.text")}{" "}
        <Link to="/privacy">{t("consent.more")}</Link>
      </p>
      <div className="cookie-btns">
        <button className="btn-ghost sm" onClick={() => choose(false)}>
          {t("consent.reject")}
        </button>
        <button className="btn-primary sm" onClick={() => choose(true)}>
          {t("consent.accept")}
        </button>
      </div>
    </div>
  );
}
