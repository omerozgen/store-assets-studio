/**
 * Hafif i18n — bağımlılıksız sözlükler (`tr.ts` / `en.ts`). Dil artık **URL'den** türetilir:
 * `/en...` → EN, aksi halde TR (SEO için her dil ayrı URL). `setLang` karşı dilin eşdeğer
 * URL'ine gider. `lp(path)` bir yolu aktif dile göre önekler. Provider Router içinde olmalı.
 */
import { createContext, useContext, useCallback, useEffect, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { tr } from "./tr.ts";
import { en } from "./en.ts";
import { parsePath, localizedPath } from "../seo/site.ts";

export type Lang = "tr" | "en";
const DICTS: Record<Lang, Record<string, string>> = { tr, en };

type Vars = Record<string, string | number>;
type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Vars) => string;
  /** Bir dil-nötr yolu aktif dile göre önekler (TR: aynı, EN: /en önekli). */
  lp: (path: string) => string;
};
const I18nCtx = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();
  const { path, lang } = parsePath(pathname);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback(
    (l: Lang) => {
      try {
        localStorage.setItem("sas-lang", l);
      } catch {
        /* yoksay */
      }
      navigate(localizedPath(path, l) + search + hash);
    },
    [path, search, hash, navigate],
  );

  const lp = useCallback((p: string) => localizedPath(p, lang), [lang]);

  const t = useCallback(
    (key: string, vars?: Vars) => {
      let s = DICTS[lang][key] ?? DICTS.tr[key] ?? key;
      if (vars) for (const k in vars) s = s.replace(new RegExp(`\\{${k}\\}`, "g"), String(vars[k]));
      return s;
    },
    [lang],
  );

  return <I18nCtx.Provider value={{ lang, setLang, t, lp }}>{children}</I18nCtx.Provider>;
}

export function useI18n(): Ctx {
  const c = useContext(I18nCtx);
  if (!c) throw new Error("useI18n bir I18nProvider içinde çağrılmalı");
  return c;
}
