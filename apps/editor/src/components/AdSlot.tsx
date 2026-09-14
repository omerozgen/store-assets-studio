import { useEffect, useRef, useState } from "react";
import { ADSENSE_CLIENT, adsEnabled } from "../config.ts";

/** localStorage'dan çerez onayı durumu. */
function consentGranted(): boolean {
  try {
    return localStorage.getItem("sas-consent") === "granted";
  } catch {
    return false;
  }
}

/**
 * Tek bir AdSense reklam birimi. YALNIZ (geçerli publisher ID + çerez onayı) varsa render eder;
 * aksi halde null (onay öncesi veya ID boşken hiçbir reklam kodu/isteği çıkmaz). Editör çalışma
 * alanına KONMAZ — yalnız landing/blog/export-sonrası.
 */
export function AdSlot({ slot }: { slot: string }) {
  const insRef = useRef<HTMLModElement>(null);
  const [granted, setGranted] = useState(consentGranted);

  useEffect(() => {
    const onConsent = () => setGranted(consentGranted());
    window.addEventListener("sas-consent", onConsent);
    return () => window.removeEventListener("sas-consent", onConsent);
  }, []);

  useEffect(() => {
    if (!adsEnabled() || !slot || !granted) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* adsbygoogle henüz hazır değil — script yüklenince sonraki mount'ta tekrar denenir */
    }
  }, [granted, slot]);

  if (!adsEnabled() || !slot || !granted) return null;
  return (
    <div className="adslot" aria-hidden="true">
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
