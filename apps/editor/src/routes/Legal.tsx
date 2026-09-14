import { useEffect } from "react";
import { useI18n } from "../i18n/index.tsx";
import { Header } from "../components/Header.tsx";
import { Footer } from "../components/Footer.tsx";

/** Gizlilik ve Şartlar sayfaları — aynı düzen, farklı anahtar ön eki. */
export function Legal({ kind }: { kind: "privacy" | "terms" }) {
  const { t } = useI18n();
  const sections = ["s1", "s2", "s3", "s4", "s5"] as const;
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [kind]);
  return (
    <div className="page">
      <Header />
      <article className="legal">
        <h1>{t(`${kind}.title`)}</h1>
        <p className="legal-updated">{t(`${kind}.updated`)}</p>
        <p className="legal-intro">{t(`${kind}.intro`)}</p>
        {sections.map((s) => (
          <section key={s}>
            <h2>{t(`${kind}.${s}.title`)}</h2>
            <p>{t(`${kind}.${s}.body`)}</p>
          </section>
        ))}
      </article>
      <Footer />
    </div>
  );
}
