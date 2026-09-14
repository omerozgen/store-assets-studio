import { useI18n } from "../i18n/index.tsx";

/** TR/EN dil değiştirici — küçük iki düğme. Seçim localStorage'da kalıcı. */
export function LangSwitcher() {
  const { lang, setLang } = useI18n();
  return (
    <div className="langsw" role="group" aria-label="Language">
      <button className={lang === "tr" ? "on" : ""} onClick={() => setLang("tr")} aria-pressed={lang === "tr"}>
        TR
      </button>
      <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")} aria-pressed={lang === "en"}>
        EN
      </button>
    </div>
  );
}
