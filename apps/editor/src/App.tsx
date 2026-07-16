import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import JSZip from "jszip";
import { renderSet, placeholderScreenshot, type Panel } from "@sas/core-renderer";
import { THEMES, resolveTheme } from "@sas/themes";
import { STORE_TARGETS, getTarget, logicalViewport } from "@sas/store-specs";

type PanelText = { id: string; content: Record<string, string>; x: number; y: number; sizePct: number; color: string };
type EditorPanel = {
  id: string;
  src: string;
  captions: Record<string, string>;
  capX?: number;
  capY?: number;
  devX?: number;
  devY?: number;
  texts?: PanelText[];
};
type Finish = "titanium" | "black" | "silver";
type Pose = "flat" | "angled";

let idc = 0;
const uid = () => `p${++idc}`;

const readFile = (f: File): Promise<string> =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(f);
  });

// ---- Önizleme için blob URL katmanı ----
// State/kayıt/export'ta data URI kalır (kalıcı + sunucuya gidebilir); ama önizleme
// HTML'ine data URI gömmek her güncellemede megabaytlarca parse + görsel decode
// demek. Blob URL ile HTML kilobaytlara iner, tarayıcı görseli BİR KEZ çözer ve
// önbellekten kullanır → Canva tarzı akıcılık. Aynı data URI hep aynı URL'i alır.
const blobUrlCache = new Map<string, string>();
function previewUrl(src: string): string {
  if (!src.startsWith("data:")) return src;
  const hit = blobUrlCache.get(src);
  if (hit) return hit;
  const comma = src.indexOf(",");
  const head = src.slice(5, comma); // ör. "image/png;base64"
  const mime = head.split(";")[0] || "application/octet-stream";
  const body = src.slice(comma + 1);
  const blob = head.includes("base64")
    ? new Blob([Uint8Array.from(atob(body), (c) => c.charCodeAt(0))], { type: mime })
    : new Blob([decodeURIComponent(body)], { type: mime });
  const url = URL.createObjectURL(blob);
  blobUrlCache.set(src, url);
  return url;
}

/** PNG base64'ü seçilen formata (jpeg/webp) canvas ile çevirir. png ise dokunmaz. */
async function convertPng(base64Png: string, mime: string, quality: number): Promise<Blob> {
  const img = new Image();
  img.src = "data:image/png;base64," + base64Png;
  await img.decode();
  const c = document.createElement("canvas");
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext("2d")!;
  if (mime === "image/jpeg") {
    ctx.fillStyle = "#ffffff"; // JPEG alfa desteklemez → beyaz zemin
    ctx.fillRect(0, 0, c.width, c.height);
  }
  ctx.drawImage(img, 0, 0);
  return await new Promise<Blob>((res) => c.toBlob((b) => res(b!), mime, quality));
}

const FORMATS: Record<string, { mime: string; ext: string }> = {
  png: { mime: "image/png", ext: "png" },
  jpeg: { mime: "image/jpeg", ext: "jpg" },
  webp: { mime: "image/webp", ext: "webp" },
};

const SCREENSHOT_TARGETS = STORE_TARGETS.filter((t) => t.assetType === "screenshot");
const ASSET_LABEL: Record<string, string> = {
  screenshot: "Ekran görüntüsü",
  "feature-graphic": "Feature graphic",
  icon: "İkon",
};

// ---- IndexedDB otokayıt (localStorage 5MB'a sığmaz; görseller data URI) ----
function idbOpen(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open("sas-editor", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("kv");
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function idbSet(key: string, val: unknown): Promise<void> {
  const db = await idbOpen();
  return new Promise((res, rej) => {
    const tx = db.transaction("kv", "readwrite");
    tx.objectStore("kv").put(val, key);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}
async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await idbOpen();
  return new Promise((res, rej) => {
    const rq = db.transaction("kv").objectStore("kv").get(key);
    rq.onsuccess = () => res(rq.result as T | undefined);
    rq.onerror = () => rej(rq.error);
  });
}
async function idbDel(key: string): Promise<void> {
  const db = await idbOpen();
  return new Promise((res, rej) => {
    const tx = db.transaction("kv", "readwrite");
    tx.objectStore("kv").delete(key);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

/** Kaydedilen/yüklenen proje şeması (undo geçmişi de aynı yapıyı kullanır). */
type ProjectState = {
  version: 1;
  panels: EditorPanel[];
  themeId: string;
  finish: Finish;
  pose: Pose;
  orientation: "portrait" | "landscape";
  tiltDeg: number;
  leanDeg: number;
  thickness: number;
  arrangement: "" | "centered" | "cascade" | "straddle";
  captionPos: "top" | "bottom";
  locales: string[];
  locale: string;
  targetId: string;
  exportTargets: string[];
  featureTitle: string;
  iconSrc: string;
  format: "png" | "jpeg" | "webp";
  quality: number;
  layout: "simple" | "fastlane";
  fontSrc: string;
  fontName: string;
  useBrandBg: boolean;
  bgA: string;
  bgB: string;
  useTextColor: boolean;
  textColor: string;
};

export function App() {
  const [locales, setLocales] = useState<string[]>(["tr"]);
  const [locale, setLocale] = useState("tr");
  const [panels, setPanels] = useState<EditorPanel[]>([
    { id: uid(), src: "", captions: { tr: "Her şey tek yerde" } },
    { id: uid(), src: "", captions: { tr: "Saniyeler içinde paylaş" } },
    { id: uid(), src: "", captions: { tr: "Sen odaklan, gerisi bizde" } },
  ]);
  const [themeId, setThemeId] = useState(THEMES[0].id);
  const [finish, setFinish] = useState<Finish>("black");
  const [pose, setPose] = useState<Pose>("angled");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [tiltDeg, setTiltDeg] = useState(-16);
  const [leanDeg, setLeanDeg] = useState(0);
  const [thickness, setThickness] = useState(8);
  const [arrangement, setArrangement] = useState<"" | "centered" | "cascade" | "straddle">("");
  const [captionPos, setCaptionPos] = useState<"top" | "bottom">("top");
  const [targetId, setTargetId] = useState("ios-6.9");
  const [exportTargets, setExportTargets] = useState<string[]>(["ios-6.9", "android-phone"]);
  const [featureTitle, setFeatureTitle] = useState("");
  const [iconSrc, setIconSrc] = useState("");
  const [format, setFormat] = useState<"png" | "jpeg" | "webp">("png");
  const [quality, setQuality] = useState(0.9);
  const [layout, setLayout] = useState<"simple" | "fastlane">("simple");
  const [fontSrc, setFontSrc] = useState("");
  const [fontName, setFontName] = useState("");
  const [useBrandBg, setUseBrandBg] = useState(false);
  const [bgA, setBgA] = useState("#4f46e5");
  const [bgB, setBgB] = useState("#db2777");
  const [useTextColor, setUseTextColor] = useState(false);
  const [textColor, setTextColor] = useState("#ffffff");
  const [dragOver, setDragOver] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);
  const [sel, setSel] = useState<{ kind: "cap" | "dev" | "txt"; i: number; j?: number } | null>(null);

  const target = getTarget(targetId);

  const deviceOverride = { finish, pose, tiltDeg, leanDeg, thicknessPct: thickness, orientation, ...(arrangement ? { arrangement } : {}) };
  const overrides = {
    caption: { position: captionPos },
    device: deviceOverride,
    ...(useBrandBg ? { background: { type: "gradient" as const, colors: [bgA, bgB], angle: 135 } } : {}),
    font: {
      ...(fontSrc ? { family: "'SASCustom', -apple-system, sans-serif", customSrc: fontSrc } : {}),
      ...(useTextColor ? { color: textColor } : {}),
    },
  };

  const theme = useMemo(
    () => resolveTheme(themeId, overrides),
    [themeId, finish, pose, tiltDeg, leanDeg, thickness, captionPos, arrangement, orientation,
      useBrandBg, bgA, bgB, useTextColor, textColor, fontSrc],
  );

  // ---- Proje durumu: topla / uygula ----
  function collectProject(): ProjectState {
    return {
      version: 1, panels, themeId, finish, pose, orientation, tiltDeg, leanDeg, thickness,
      arrangement, captionPos, locales, locale, targetId, exportTargets, featureTitle,
      iconSrc, format, quality, layout, fontSrc, fontName, useBrandBg, bgA, bgB,
      useTextColor, textColor,
    };
  }
  function applyProject(p: ProjectState) {
    // id çakışmasın; eski kayıtlarda texts olmayabilir → boş dizi.
    setPanels(p.panels.map((x) => ({ ...x, id: uid(), texts: (x.texts ?? []).map((t) => ({ ...t, id: uid() })) })));
    setThemeId(p.themeId); setFinish(p.finish); setPose(p.pose); setOrientation(p.orientation);
    setTiltDeg(p.tiltDeg); setLeanDeg(p.leanDeg); setThickness(p.thickness);
    setArrangement(p.arrangement); setCaptionPos(p.captionPos);
    setLocales(p.locales); setLocale(p.locale); setTargetId(p.targetId);
    setExportTargets(p.exportTargets); setFeatureTitle(p.featureTitle); setIconSrc(p.iconSrc);
    setFormat(p.format); setQuality(p.quality); setLayout(p.layout);
    setFontSrc(p.fontSrc); setFontName(p.fontName);
    setUseBrandBg(p.useBrandBg); setBgA(p.bgA); setBgB(p.bgB);
    setUseTextColor(p.useTextColor); setTextColor(p.textColor);
  }

  // ---- Otokayıt (IndexedDB) + açılışta geri yükleme ----
  const restoredRef = useRef(false);
  const applyingRef = useRef(false);
  useEffect(() => {
    idbGet<ProjectState>("project")
      .then((p) => {
        if (p && p.version === 1) {
          applyingRef.current = true;
          applyProject(p);
        }
      })
      .catch(() => { })
      .finally(() => { restoredRef.current = true; });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!restoredRef.current) return;
    const t = setTimeout(() => { idbSet("project", collectProject()).catch(() => { }); }, 800);
    return () => clearTimeout(t);
  }); // her state değişiminde debounce'lı kaydet

  // ---- Undo/redo (⌘/Ctrl+Z, ⇧ ile redo) ----
  const hist = useRef<{ past: string[]; future: string[] }>({ past: [], future: [] });
  useEffect(() => {
    if (!restoredRef.current) return;
    const t = setTimeout(() => {
      const snap = JSON.stringify(collectProject());
      const { past } = hist.current;
      if (applyingRef.current) {
        // Geri yükleme / undo / redo sonrası: durumu baseline olarak kaydet,
        // future'ı KORU (redo çalışsın). Dedupe zaten çift kaydı engeller.
        applyingRef.current = false;
        if (past[past.length - 1] !== snap) {
          past.push(snap);
          if (past.length > 20) past.shift();
        }
        return;
      }
      if (past[past.length - 1] !== snap) {
        past.push(snap);
        if (past.length > 20) past.shift();
        hist.current.future = [];
      }
    }, 400);
    return () => clearTimeout(t);
  });
  function undo() {
    const h = hist.current;
    if (h.past.length < 2) return;
    h.future.push(h.past.pop()!);
    applyingRef.current = true;
    applyProject(JSON.parse(h.past[h.past.length - 1]));
  }
  function redo() {
    const nxt = hist.current.future.pop();
    if (!nxt) return;
    hist.current.past.push(nxt);
    applyingRef.current = true;
    applyProject(JSON.parse(nxt));
  }

  // Panellerin aktif dildeki hâli. Boş görüntüler placeholder ile.
  // preview=true → görseller blob URL'e çevrilir (hafif HTML); export data URI kullanır.
  const localePanels = (loc: string, preview = false): Panel[] =>
    (panels.length ? panels : [{ id: "x", src: "", captions: {} } as EditorPanel]).map((p, i) => {
      const src = p.src || placeholderScreenshot(1080, 2280, `Ekran ${i + 1}`, "#1f2937");
      return {
        caption: p.captions[loc] || undefined,
        screenshotSrc: preview ? previewUrl(src) : src,
        captionXFrac: p.capX,
        captionYFrac: p.capY,
        deviceXFrac: p.devX,
        deviceYFrac: p.devY,
        texts: (p.texts ?? [])
          .map((t) => ({ id: t.id, text: t.content[loc] || "", xFrac: t.x, yFrac: t.y, sizePct: t.sizePct, color: t.color }))
          .filter((t) => t.text),
      };
    });

  const renderPanels = useMemo(() => localePanels(locale, true), [panels, locale]);

  // ---- Önizleme çözünürlüğü: ekranda kaplanan alan kadar ----
  // Tuval eskiden mantıksal boyutun 2 katında render edilip CSS ile küçültülüyordu;
  // panel sayısı artınca (12 panel ≈ 31.000px genişlik) Chrome/Safari bu dev katmanın
  // karolarını GPU belleğinde tutamıyor, fare hareketinde beyaz yanıp sönüyordu
  // (raster thrash). Artık panel, ekranda kapladığı CSS pikseli × devicePixelRatio
  // boyutunda üretilir → katman ekran kadar küçük, görüntü yine keskin. Tüm
  // koordinatlar oransal (frac) olduğundan export birebir aynı kalır.
  const [stage, setStage] = useState({ w: 1200, h: 800 });
  const onStageSize = useCallback(
    (w: number, h: number) => setStage((s) => (s.w === w && s.h === h ? s : { w, h })),
    [],
  );
  const lv = logicalViewport(target);
  const stagePad = 48; // .stage padding'i (24px × 2) — sığdırma hesabıyla aynı
  const fitScale = Math.max(
    0.01,
    Math.min((stage.w - stagePad) / (lv.width * renderPanels.length), (stage.h - stagePad) / lv.height),
  );
  // 16px kuantizasyon: pencere sürüklenirken her pikselde yeniden üretim olmasın.
  const renderW = Math.min(
    lv.width * 2, // eski süperörnekleme tavanı — bundan keskini gereksiz
    Math.max(64, Math.ceil((lv.width * fitScale * (window.devicePixelRatio || 1)) / 16) * 16),
  );
  const renderH = Math.round(lv.height * (renderW / lv.width));
  // Render pikseli → CSS pikseli ölçeği (Retina'da ~1/2'ye denk gelir).
  const previewScale = (lv.width * fitScale) / renderW;

  const { canvasHtml, css, viewport, deviceCenters } = useMemo(() => {
    // Özel font da önizlemede blob URL ile — büyük data URI'yi CSS'e gömme.
    const previewTheme = theme.font.customSrc
      ? { ...theme, font: { ...theme.font, customSrc: previewUrl(theme.font.customSrc) } }
      : theme;
    return renderSet(previewTheme, renderPanels, { width: renderW, height: renderH }, target.deviceKind ?? "phone");
  }, [theme, renderPanels, target, renderW, renderH]);

  // --- yükleme ---
  async function addFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const srcs = await Promise.all(arr.map(readFile));
    setPanels((prev) => {
      const next = [...prev];
      let si = 0;
      for (let i = 0; i < next.length && si < srcs.length; i++) {
        if (!next[i].src) next[i] = { ...next[i], src: srcs[si++] };
      }
      while (si < srcs.length) next.push({ id: uid(), src: srcs[si++], captions: {} });
      return next;
    });
  }

  const move = (i: number, d: number) =>
    setPanels((prev) => {
      const j = i + d;
      if (j < 0 || j >= prev.length) return prev;
      const n = [...prev];
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });
  const reorder = (from: number, to: number) =>
    setPanels((prev) => {
      if (from === to) return prev;
      const n = [...prev];
      const [it] = n.splice(from, 1);
      n.splice(to, 0, it);
      return n;
    });
  const remove = (i: number) => setPanels((prev) => prev.filter((_, k) => k !== i));
  const setCaption = (i: number, v: string) =>
    setPanels((prev) => prev.map((p, k) => (k === i ? { ...p, captions: { ...p.captions, [locale]: v } } : p)));
  const addEmpty = () => setPanels((prev) => [...prev, { id: uid(), src: "", captions: {} }]);

  // --- diller ---
  function addLocale() {
    const code = prompt("Dil kodu (ör. en, de, fr):")?.trim().toLowerCase();
    if (!code || locales.includes(code)) return;
    setLocales((p) => [...p, code]);
    setLocale(code);
  }
  const removeLocale = (code: string) => {
    if (locales.length <= 1) return;
    setLocales((p) => p.filter((l) => l !== code));
    if (locale === code) setLocale(locales.find((l) => l !== code)!);
    // Silinen dilin başlık + metinlerini panellerden de temizle (bayat veri kalmasın).
    setPanels((prev) =>
      prev.map((p) => {
        const { [code]: _removed, ...rest } = p.captions;
        const texts = (p.texts ?? []).map((t) => {
          const { [code]: _r, ...c } = t.content;
          return { ...t, content: c };
        });
        return { ...p, captions: rest, texts };
      }),
    );
  };

  const toggleTarget = (id: string) =>
    setExportTargets((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  // Belirli bir panelin telefonuna doğrudan görsel bırakma.
  async function setPanelImage(i: number, file: File) {
    if (!file.type.startsWith("image/")) return;
    const src = await readFile(file);
    setPanels((prev) => {
      if (i < prev.length) return prev.map((p, k) => (k === i ? { ...p, src } : p));
      const n = [...prev];
      while (n.length <= i) n.push({ id: uid(), src: "", captions: {} });
      n[i] = { ...n[i], src };
      return n;
    });
  }

  // ---- Serbest metin kutuları ----
  const addText = (i: number) =>
    setPanels((prev) =>
      prev.map((p, k) =>
        k === i
          ? {
            ...p,
            texts: [
              ...(p.texts ?? []),
              {
                id: uid(),
                content: { [locale]: "Metin" },
                x: 0.5,
                y: Math.min(0.9, 0.3 + (p.texts?.length ?? 0) * 0.08),
                sizePct: 3.2,
                color: "#ffffff",
              },
            ],
          }
          : p,
      ),
    );
  const updateText = (i: number, j: number, patch: Partial<PanelText> | { content: string }) =>
    setPanels((prev) =>
      prev.map((p, k) => {
        if (k !== i) return p;
        const texts = [...(p.texts ?? [])];
        const t = texts[j];
        if (!t) return p;
        texts[j] =
          "content" in patch && typeof patch.content === "string"
            ? { ...t, content: { ...t.content, [locale]: patch.content } }
            : { ...t, ...(patch as Partial<PanelText>) };
        return { ...p, texts };
      }),
    );
  const removeText = (i: number, j: number) =>
    setPanels((prev) => prev.map((p, k) => (k === i ? { ...p, texts: (p.texts ?? []).filter((_, m) => m !== j) } : p)));
  const setTextPos = (i: number, j: number, x: number, y: number) => updateText(i, j, { x, y });

  // Başlık serbest konumu (sürükle-bırak). Panele özel, tüm dillerde ortak.
  const setCapPos = (i: number, x: number, y: number) =>
    setPanels((prev) => prev.map((p, k) => (k === i ? { ...p, capX: x, capY: y } : p)));
  // Cihaz serbest konumu (sürükle-bırak) — manuel, yerleşimi geçersiz kılar.
  const setDevPos = (i: number, x: number, y: number) =>
    setPanels((prev) => prev.map((p, k) => (k === i ? { ...p, devX: x, devY: y } : p)));
  // Motor varsayılanıyla aynı (set.ts: top=H*0.05, bottom=H*0.82) → tutamak metnin üstünde durur.
  const defaultCapY = captionPos === "top" ? 0.05 : 0.82;
  const caps = (panels.length ? panels : [{ captions: {} } as EditorPanel]).map((p) => ({
    text: p.captions[locale] || "",
    x: p.capX ?? 0.5,
    y: p.capY ?? defaultCapY,
  }));

  // ---- Klavye: ⌘/Ctrl+Z undo, ⇧⌘Z redo; seçili tutamağı ok tuşlarıyla it ----
  useEffect(() => {
    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
        return;
      }
      // Ok tuşları: bir input'a yazarken karışma.
      if (mod || !sel || (e.target instanceof HTMLElement && /input|textarea|select/i.test(e.target.tagName))) return;
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
      e.preventDefault();
      const step = e.shiftKey ? 0.02 : 0.005;
      const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
      const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
      if (sel.kind === "cap") {
        const c = caps[sel.i];
        if (c) setCapPos(sel.i, clamp(c.x + dx, 0.06, 0.94), clamp(c.y + dy, 0.02, 0.95));
      } else if (sel.kind === "txt") {
        const t = panels[sel.i]?.texts?.[sel.j ?? -1];
        if (t) setTextPos(sel.i, sel.j!, clamp(t.x + dx, 0.04, 0.96), clamp(t.y + dy, 0.02, 0.96));
      } else {
        const d = deviceCenters[sel.i];
        if (d) setDevPos(sel.i, clamp(d.x + dx, -0.1, 1.1), clamp(d.y + dy, 0.1, 0.95));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // ---- Proje dosyası: indir / yükle / sıfırla ----
  function saveProjectFile() {
    const blob = new Blob([JSON.stringify(collectProject(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "store-assets-proje.json";
    a.click();
    URL.revokeObjectURL(url);
  }
  async function loadProjectFile(f: File) {
    try {
      const p = JSON.parse(await f.text()) as ProjectState;
      if (p.version !== 1) throw new Error("Desteklenmeyen proje sürümü");
      applyingRef.current = true;
      applyProject(p);
    } catch (e) {
      alert("Proje yüklenemedi: " + (e as Error).message);
    }
  }
  async function resetProject() {
    if (!confirm("Proje sıfırlansın mı? (otokayıt silinir)")) return;
    await idbDel("project").catch(() => { });
    location.reload();
  }

  // ---- Zip yol düzeni: basit veya fastlane (deliver/supply) ----
  function zipPath(loc: string, t: { id: string; store: string; assetType: string }, idx: number, ext: string): string {
    if (layout === "simple") return `${loc}/${t.store}/${t.id}/${idx + 1}.${ext}`;
    if (t.store === "app-store") {
      if (t.assetType === "icon") return `extras/ios-app-icon-1024.${ext}`; // deliver'a girmez; binary'de gider
      return `fastlane/screenshots/${loc}/${idx + 1}_${t.id}.${ext}`;
    }
    if (t.assetType === "icon") return `fastlane/metadata/android/${loc}/images/icon.${ext}`;
    if (t.assetType === "feature-graphic") return `fastlane/metadata/android/${loc}/images/featureGraphic.${ext}`;
    const dir = t.id.includes("tablet") ? "tenInchScreenshots" : "phoneScreenshots";
    return `fastlane/metadata/android/${loc}/images/${dir}/${idx + 1}.${ext}`;
  }

  // --- export (dil × hedef) ---
  async function doExport() {
    if (!exportTargets.length) return alert("En az bir export hedefi seç.");
    try {
      const zip = new JSZip();
      const readmeRows: string[] = [];
      let n = 0;
      for (const loc of locales) {
        setExporting(`${loc.toUpperCase()} render ediliyor… (${++n}/${locales.length})`);
        const res = await fetch("/api/export", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            themeId,
            targetIds: exportTargets,
            overrides,
            featureTitle: featureTitle || undefined,
            iconSrc: iconSrc || undefined,
            panels: localePanels(loc).map((p) => ({
              caption: p.caption ?? "",
              screenshotSrc: p.screenshotSrc,
              captionXFrac: p.captionXFrac,
              captionYFrac: p.captionYFrac,
              deviceXFrac: p.deviceXFrac,
              deviceYFrac: p.deviceYFrac,
              texts: p.texts,
            })),
          }),
        });
        if (!res.ok) throw new Error(`Sunucu ${res.status}`);
        const data = (await res.json()) as {
          results: {
            target: { id: string; store: string; assetType: string; width: number; height: number };
            panels: { index: number; base64: string }[];
          }[];
        };
        const { mime, ext } = FORMATS[format];
        for (const r of data.results) {
          for (const p of r.panels) {
            const path = zipPath(loc, r.target, p.index, ext);
            if (format === "png") zip.file(path, p.base64, { base64: true });
            else zip.file(path, await convertPng(p.base64, mime, quality));
            readmeRows.push(`${path}  —  ${r.target.width}×${r.target.height}  (${r.target.id}, ${loc})`);
          }
        }
      }
      zip.file(
        "README.txt",
        [
          "Store Assets Studio export",
          `Tarih: ${new Date().toISOString()}`,
          `Düzen: ${layout === "fastlane" ? "fastlane (deliver/supply)" : "basit"}  ·  Format: ${format.toUpperCase()}`,
          "",
          "Dosyalar:",
          ...readmeRows,
          "",
          "Notlar:",
          "- PNG çıktıları 24-bit RGB (alfasız) — App Store/Play gereksinimi.",
          "- Play Console dil kodları bölgeli olabilir (ör. tr → tr-TR); klasörü gerekirse yeniden adlandırın.",
          "- Mağaza yüklemeleri için PNG önerilir; JPG/WEBP web/pazarlama içindir.",
        ].join("\n"),
      );
      setExporting("Zip hazırlanıyor…");
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `store-assets-${locales.length}dil-${exportTargets.length}boyut.zip`;
      a.click();
      URL.revokeObjectURL(url);
      setExporting(null);
    } catch (e) {
      setExporting(null);
      alert("Export hatası: " + (e as Error).message + "\n(render-service çalışıyor mu? pnpm export:serve)");
    }
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <h1>Store Assets Studio</h1>

        <section>
          <label className="lbl">Proje</label>
          <div className="prow">
            <button onClick={saveProjectFile}>İndir (.json)</button>
            <label className="prowbtn">
              Yükle
              <input type="file" accept=".json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) loadProjectFile(f); e.target.value = ""; }} />
            </label>
            <button onClick={resetProject}>Sıfırla</button>
          </div>
          <p className="note">Otokayıt açık (bu tarayıcıda). Geri al: ⌘/Ctrl+Z · Yinele: ⇧+⌘/Ctrl+Z · Seçili tutamağı ok tuşlarıyla it (⇧ = büyük adım).</p>
        </section>

        <section>
          <label className="lbl">Önizleme hedefi</label>
          <select value={targetId} onChange={(e) => setTargetId(e.target.value)}>
            {SCREENSHOT_TARGETS.map((t) => (
              <option key={t.id} value={t.id}>{t.label} · {t.width}×{t.height}</option>
            ))}
          </select>
        </section>

        <section>
          <label className="lbl">Export hedefleri (tek tıkla hepsi)</label>
          <div className="targets">
            {STORE_TARGETS.map((t) => (
              <label key={t.id} className={"tgt " + (exportTargets.includes(t.id) ? "on" : "")}>
                <input type="checkbox" checked={exportTargets.includes(t.id)} onChange={() => toggleTarget(t.id)} />
                <span>
                  {t.label} <em>· {ASSET_LABEL[t.assetType]}</em>
                  <small>{t.width}×{t.height} · {t.store === "app-store" ? "App Store" : "Play"}</small>
                </span>
              </label>
            ))}
          </div>
        </section>

        <section>
          <label className="lbl">Feature başlığı (opsiyonel)</label>
          <input type="text" value={featureTitle} placeholder="Boşsa ilk panel başlığı" onChange={(e) => setFeatureTitle(e.target.value)} />
          <label className="filebtn" style={{ marginTop: 4 }}>
            {iconSrc ? "✓ İkon yüklendi — değiştir" : "İkon yükle (opsiyonel)"}
            <input type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) setIconSrc(await readFile(f)); }} />
          </label>
        </section>

        <section>
          <label className="lbl">Tema</label>
          <div className="themes">
            {THEMES.map((t) => (
              <button key={t.id} className={"theme " + (t.id === themeId ? "on" : "")} onClick={() => setThemeId(t.id)}>{t.name}</button>
            ))}
          </div>
        </section>

        <section className="grid2">
          <div>
            <label className="lbl">Ton</label>
            <select value={finish} onChange={(e) => setFinish(e.target.value as Finish)}>
              <option value="titanium">Titanium</option><option value="black">Black</option><option value="silver">Silver</option>
            </select>
          </div>
          <div>
            <label className="lbl">Duruş</label>
            <select value={pose} onChange={(e) => setPose(e.target.value as Pose)}>
              <option value="angled">Açılı</option><option value="flat">Düz</option>
            </select>
          </div>
        </section>

        <section>
          <label className="lbl">Yön</label>
          <select value={orientation} onChange={(e) => setOrientation(e.target.value as "portrait" | "landscape")}>
            <option value="portrait">Dikey</option>
            <option value="landscape">Yatay</option>
          </select>
        </section>

        {pose === "angled" && (
          <section>
            <label className="lbl">Açı — sağa/sola çevir ({tiltDeg}°)</label>
            <input type="range" min={-30} max={30} value={tiltDeg} onChange={(e) => setTiltDeg(+e.target.value)} />
          </section>
        )}
        <section>
          <label className="lbl">Yatıklık — sağa/sola eğ ({leanDeg}°)</label>
          <input type="range" min={-25} max={25} value={leanDeg} onChange={(e) => setLeanDeg(+e.target.value)} />
        </section>
        <section>
          <label className="lbl">Derinlik ({thickness})</label>
          <input type="range" min={0} max={16} value={thickness} onChange={(e) => setThickness(+e.target.value)} />
        </section>
        <section>
          <label className="lbl">Yerleşim</label>
          <select value={arrangement} onChange={(e) => setArrangement(e.target.value as typeof arrangement)}>
            <option value="">Tema varsayılanı</option>
            <option value="centered">Ortalı</option>
            <option value="cascade">Kademeli (akış)</option>
            <option value="straddle">Bölünmüş (sınırda)</option>
          </select>
        </section>
        <section>
          <label className="lbl">Başlık konumu</label>
          <select value={captionPos} onChange={(e) => setCaptionPos(e.target.value as "top" | "bottom")}>
            <option value="top">Üst</option><option value="bottom">Alt</option>
          </select>
        </section>

        <section>
          <label className="lbl">Dil</label>
          <div className="locales">
            {locales.map((l) => (
              <button key={l} className={"loc " + (l === locale ? "on" : "")} onClick={() => setLocale(l)} onDoubleClick={() => removeLocale(l)} title="Çift tıkla: sil">
                {l.toUpperCase()}
              </button>
            ))}
            <button className="loc add" onClick={addLocale}>+ dil</button>
          </div>
        </section>

        <section>
          <label className="lbl">Ekran görüntüleri ({locale.toUpperCase()} başlıkları)</label>
          <div
            className={"drop " + (dragOver ? "over" : "")}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
          >
            Görüntüleri buraya sürükle-bırak
            <br />
            <label className="filebtn">veya seç<input type="file" accept="image/*" multiple hidden onChange={(e) => e.target.files && addFiles(e.target.files)} /></label>
          </div>

          <ol className="panels">
            {panels.map((p, i) => (
              <li
                key={p.id}
                draggable
                onDragStart={() => setDragIdx(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => { if (dragIdx !== null) reorder(dragIdx, i); setDragIdx(null); }}
                className={dragIdx === i ? "dragging" : ""}
              >
                <div className="thumb" title="Sürükleyerek sırala">{p.src ? <img src={p.src} alt="" /> : <span>boş</span>}</div>
                <div className="pmeta">
                  <input value={p.captions[locale] ?? ""} placeholder={`Başlık (${locale.toUpperCase()})…`} onChange={(e) => setCaption(i, e.target.value)} />
                  {(p.texts ?? []).map((t, j) => (
                    <div className="txtrow" key={t.id}>
                      <input
                        value={t.content[locale] ?? ""}
                        placeholder={`Metin (${locale.toUpperCase()})…`}
                        onChange={(e) => updateText(i, j, { content: e.target.value })}
                      />
                      <input
                        type="number"
                        min={1.5}
                        max={10}
                        step={0.5}
                        value={t.sizePct}
                        title="Boyut (%)"
                        onChange={(e) => updateText(i, j, { sizePct: +e.target.value })}
                      />
                      <input
                        type="color"
                        value={t.color}
                        title="Renk"
                        onChange={(e) => updateText(i, j, { color: e.target.value })}
                      />
                      <button onClick={() => removeText(i, j)}>✕</button>
                    </div>
                  ))}
                  <div className="prow">
                    <button onClick={() => addText(i)} title="Serbest metin kutusu ekle">+ metin</button>
                    <button onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
                    <button onClick={() => move(i, 1)} disabled={i === panels.length - 1}>↓</button>
                    <button onClick={() => remove(i)}>✕</button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <button className="add" onClick={addEmpty}>+ Panel ekle</button>
        </section>

        <section>
          <label className="lbl">Marka</label>
          <label className="filebtn">
            {fontName ? `✓ Font: ${fontName} — değiştir` : "Font yükle (ttf/otf/woff/woff2)"}
            <input
              type="file"
              accept=".ttf,.otf,.woff,.woff2"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) { setFontSrc(await readFile(f)); setFontName(f.name); }
                e.target.value = "";
              }}
            />
          </label>
          {fontName && <button className="add" onClick={() => { setFontSrc(""); setFontName(""); }}>Fontu kaldır</button>}
          <label className="chk">
            <input type="checkbox" checked={useBrandBg} onChange={(e) => setUseBrandBg(e.target.checked)} />
            Marka arka planı (gradient)
          </label>
          {useBrandBg && (
            <div className="grid2">
              <input type="color" value={bgA} onChange={(e) => setBgA(e.target.value)} title="Renk 1" />
              <input type="color" value={bgB} onChange={(e) => setBgB(e.target.value)} title="Renk 2" />
            </div>
          )}
          <label className="chk">
            <input type="checkbox" checked={useTextColor} onChange={(e) => setUseTextColor(e.target.checked)} />
            Metin rengi
          </label>
          {useTextColor && <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} />}
        </section>

        <section>
          <label className="lbl">Klasör düzeni (zip)</label>
          <select value={layout} onChange={(e) => setLayout(e.target.value as "simple" | "fastlane")}>
            <option value="simple">Basit (dil/mağaza/hedef)</option>
            <option value="fastlane">Fastlane (deliver + supply)</option>
          </select>
        </section>

        <section className="grid2">
          <div>
            <label className="lbl">Format</label>
            <select value={format} onChange={(e) => setFormat(e.target.value as "png" | "jpeg" | "webp")}>
              <option value="png">PNG (kayıpsız)</option>
              <option value="jpeg">JPG (küçük)</option>
              <option value="webp">WEBP</option>
            </select>
          </div>
          {format !== "png" && (
            <div>
              <label className="lbl">Kalite (%{Math.round(quality * 100)})</label>
              <input type="range" min={0.5} max={1} step={0.05} value={quality} onChange={(e) => setQuality(+e.target.value)} />
            </div>
          )}
        </section>
        {format !== "png" && (
          <p className="note">
            Not: App Store/Play ekran görüntüleri için <b>PNG</b> önerilir. JPG/WEBP daha küçük dosya
            için (web/pazarlama) idealdir.
          </p>
        )}

        <button className="export" onClick={doExport} disabled={!!exporting}>
          {exporting ?? `Export → ${locales.length} dil × ${exportTargets.length} boyut · ${format.toUpperCase()} (zip)`}
        </button>
      </aside>

      <main className="preview">
        <Preview
          canvasHtml={canvasHtml}
          css={css}
          viewport={viewport}
          scale={previewScale}
          onStageSize={onStageSize}
          panelCount={renderPanels.length}
          caps={caps}
          devs={deviceCenters}
          onCaptionMove={setCapPos}
          txts={panels.flatMap((p, i) =>
            (p.texts ?? []).map((t, j) => ({ i, j, id: t.id, text: t.content[locale] || "Metin", x: t.x, y: t.y })),
          )}
          onDeviceMove={setDevPos}
          onTextMove={setTextPos}
          onDropImage={setPanelImage}
          onSelect={setSel}
        />
      </main>
    </div>
  );
}

type Cap = { text: string; x: number; y: number };
type Dev = { x: number; y: number };
type Txt = { i: number; j: number; id?: string; text: string; x: number; y: number };
type DragTarget = { kind: "cap" | "dev" | "txt"; i: number; j?: number; id?: string };

/**
 * KALICI önizleme belgesi — bir kez yüklenir, bir daha asla yeniden yüklenmez.
 * Tuval (canvas HTML + CSS) postMessage ile içine enjekte edilir; görseller blob
 * URL olduğundan tarayıcı önbelleğinden gelir. Belge hiç ölmediği için beyaz
 * flaş oluşamaz; "sas-move" sürüklemede yalnız ilgili elemanı taşır.
 */
const HOST_DOC = `<!DOCTYPE html><html><head><meta charset="utf-8"><style id="sas-css"></style></head>
<body><div id="sas-root"></div>
<script>
(function () {
  var root = document.getElementById("sas-root");
  var style = document.getElementById("sas-css");
  window.addEventListener("message", function (e) {
    var d = e.data;
    if (!d) return;
    if (d.type === "sas-canvas") {
      if (style.textContent !== d.css) style.textContent = d.css;
      root.innerHTML = d.canvas;
      return;
    }
    if (d.type !== "sas-move") return;
    var c = root.querySelector(".canvas");
    if (!c) return;
    var N = Number(c.getAttribute("data-panels")) || 1;
    var W = c.offsetWidth / N, H = c.offsetHeight, el;
    if (d.kind === "dev") el = document.getElementById("dev-" + d.i);
    else if (d.kind === "cap") el = document.getElementById("cap-" + d.i);
    else if (d.id != null) el = document.getElementById("txt-" + d.id);
    if (!el) return;
    var cx = d.i * W + d.x * W, cy = d.y * H;
    if (d.kind === "dev") {
      el.style.left = (cx - el.offsetWidth / 2) + "px";
      el.style.top = (cy - el.offsetHeight / 2) + "px";
    } else {
      el.style.left = cx + "px";
      el.style.top = cy + "px";
      el.style.transform = "translateX(-50%)";
    }
  });
})();
</script></body></html>`;

function Preview({
  canvasHtml,
  css,
  viewport,
  scale,
  onStageSize,
  panelCount,
  caps,
  devs,
  txts,
  onCaptionMove,
  onDeviceMove,
  onTextMove,
  onDropImage,
  onSelect,
}: {
  canvasHtml: string;
  css: string;
  viewport: { width: number; height: number };
  /** Render pikseli → CSS pikseli (App hesaplar; tuval ekrana bununla sığar). */
  scale: number;
  /** Sahne (stage) boyutunu App'e bildirir — render çözünürlüğü buna göre seçilir. */
  onStageSize: (w: number, h: number) => void;
  panelCount: number;
  caps: Cap[];
  devs: Dev[];
  txts: Txt[];
  onCaptionMove: (i: number, x: number, y: number) => void;
  onDeviceMove: (i: number, x: number, y: number) => void;
  onTextMove: (i: number, j: number, x: number, y: number) => void;
  onDropImage: (i: number, file: File) => void;
  onSelect: (s: { kind: "cap" | "dev" | "txt"; i: number; j?: number }) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [dragging, setDragging] = useState<DragTarget | null>(null);
  // Sürükleme sırasında AKTİF elemanın anlık konumu (yalnız tutamak overlay'i için;
  // ağır panels state'i sürüklerken değişmez → HTML yeniden üretilmez).
  const [live, setLive] = useState<(DragTarget & { x: number; y: number }) | null>(null);
  const [dropZone, setDropZone] = useState<number | null>(null);

  // Tuvali kalıcı belgeye gönder — iframe yüklendiyse. Yeniden yükleme YOK.
  useEffect(() => {
    if (!ready) return;
    iframeRef.current?.contentWindow?.postMessage({ type: "sas-canvas", css, canvas: canvasHtml }, "*");
  }, [ready, canvasHtml, css]);
  // Sahne boyutunu App'e bildir — App bundan hem sığdırma ölçeğini hem de
  // önizleme render çözünürlüğünü türetir (ekran kadar piksel, fazlası değil).
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const report = () => onStageSize(el.clientWidth, el.clientHeight);
    report();
    const ro = new ResizeObserver(report);
    ro.observe(el);
    return () => ro.disconnect();
  }, [onStageSize]);

  // Sağlam + hızlı sürükleme: window düzeyinde takip; hareket requestAnimationFrame
  // ile 60fps'e sınırlanır ve iframe'e postMessage ile CANLI uygulanır (ağır React
  // state / HTML yeniden üretimi YOK). Kalıcı state'e commit yalnız BIRAKINCA bir kez
  // yapılır → tek temiz yeniden yükleme, sürüklerken beyaz flaş/donma yok.
  useEffect(() => {
    if (!dragging) return;
    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
    let raf: number | null = null;
    let pending: { x: number; y: number } | null = null;

    const apply = () => {
      raf = null;
      if (!pending) return;
      const { kind, i, j, id } = dragging;
      iframeRef.current?.contentWindow?.postMessage(
        { type: "sas-move", kind, i, j, id, x: pending.x, y: pending.y },
        "*",
      );
      setLive({ ...dragging, x: pending.x, y: pending.y });
    };
    const move = (e: PointerEvent) => {
      const box = boxRef.current;
      if (!box) return;
      const r = box.getBoundingClientRect();
      const { kind, i } = dragging;
      const fx = ((e.clientX - r.left) / r.width) * panelCount - i;
      const fy = (e.clientY - r.top) / r.height;
      pending =
        kind === "cap"
          ? { x: clamp(fx, 0.06, 0.94), y: clamp(fy, 0.02, 0.95) }
          : kind === "txt"
            ? { x: clamp(fx, 0.04, 0.96), y: clamp(fy, 0.02, 0.96) }
            : { x: clamp(fx, -0.1, 1.1), y: clamp(fy, 0.1, 0.95) };
      if (raf === null) raf = requestAnimationFrame(apply);
    };
    const up = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      // Son konumu kalıcı state'e yaz (yalnızca gerçekten hareket olduysa).
      if (pending) {
        const { kind, i, j } = dragging;
        if (kind === "cap") onCaptionMove(i, pending.x, pending.y);
        else if (kind === "txt") onTextMove(i, j!, pending.x, pending.y);
        else onDeviceMove(i, pending.x, pending.y);
      }
      setLive(null);
      setDragging(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      if (raf !== null) cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [dragging, panelCount, onCaptionMove, onDeviceMove, onTextMove]);

  const isDrag = (kind: "cap" | "dev", i: number) => dragging?.kind === kind && dragging.i === i;

  const iframeStyle: CSSProperties = {
    position: "absolute",
    left: 0,
    top: 0,
    width: viewport.width,
    height: viewport.height,
    transform: `scale(${scale})`,
    transformOrigin: "top left",
    border: "none",
    pointerEvents: "none", // önizleme etkileşimsiz; tutamaklar üstte
  };

  return (
    <div className="stage" ref={wrapRef}>
      <div className="canvasBox" ref={boxRef} style={{ width: viewport.width * scale, height: viewport.height * scale }}>
        <iframe ref={iframeRef} title="preview" srcDoc={HOST_DOC} style={iframeStyle} onLoad={() => setReady(true)} />
        {/* Panel başına dosya bırakma bölgeleri (telefona doğrudan görsel at) */}
        {Array.from({ length: panelCount }, (_, i) => (
          <div
            key={"dz" + i}
            className={"dropZone " + (dropZone === i ? "over" : "")}
            style={{ left: (i / panelCount) * 100 + "%", width: 100 / panelCount + "%" }}
            onDragOver={(e) => { e.preventDefault(); setDropZone(i); }}
            onDragLeave={() => setDropZone((d) => (d === i ? null : d))}
            onDrop={(e) => {
              e.preventDefault();
              setDropZone(null);
              const f = e.dataTransfer.files?.[0];
              if (f) onDropImage(i, f);
            }}
          >
            <span>bırak → {i + 1}. panel</span>
          </div>
        ))}
        {Array.from({ length: panelCount - 1 }, (_, i) => (
          <div key={i} className="divider" style={{ left: ((i + 1) / panelCount) * 100 + "%" }} />
        ))}
        {/* Sürüklenebilir cihaz tutamakları (telefonun merkezinde) */}
        {devs.map((d, i) => {
          const lv = live?.kind === "dev" && live.i === i ? live : null;
          const x = lv ? lv.x : d.x;
          const y = lv ? lv.y : d.y;
          return (
            <div
              key={"dev" + i}
              className={"devHandle " + (isDrag("dev", i) ? "on" : "")}
              style={{ left: ((i + x) / panelCount) * 100 + "%", top: y * 100 + "%" }}
              onPointerDown={(e) => { e.preventDefault(); setDragging({ kind: "dev", i }); onSelect({ kind: "dev", i }); }}
              title="Sürükleyerek telefonu taşı (ok tuşlarıyla ince ayar)"
            >
              ✥
            </div>
          );
        })}
        {/* Sürüklenebilir başlık tutamakları */}
        {caps.map((c, i) => {
          if (!c.text) return null;
          const lv = live?.kind === "cap" && live.i === i ? live : null;
          const x = lv ? lv.x : c.x;
          const y = lv ? lv.y : c.y;
          return (
            <div
              key={i}
              className={"capHandle " + (isDrag("cap", i) ? "on" : "")}
              style={{ left: ((i + x) / panelCount) * 100 + "%", top: y * 100 + "%" }}
              onPointerDown={(e) => { e.preventDefault(); setDragging({ kind: "cap", i }); onSelect({ kind: "cap", i }); }}
              title="Sürükleyerek başlığı taşı (ok tuşlarıyla ince ayar)"
            >
              <span>⠿ {c.text}</span>
            </div>
          );
        })}
        {/* Sürüklenebilir serbest metin tutamakları */}
        {txts.map((t) => {
          const lv = live?.kind === "txt" && live.i === t.i && live.j === t.j ? live : null;
          const x = lv ? lv.x : t.x;
          const y = lv ? lv.y : t.y;
          return (
            <div
              key={`t${t.i}-${t.j}`}
              className={"txtHandle " + (dragging?.kind === "txt" && dragging.i === t.i && dragging.j === t.j ? "on" : "")}
              style={{ left: ((t.i + x) / panelCount) * 100 + "%", top: y * 100 + "%" }}
              onPointerDown={(e) => { e.preventDefault(); setDragging({ kind: "txt", i: t.i, j: t.j, id: t.id }); onSelect({ kind: "txt", i: t.i, j: t.j }); }}
              title="Sürükleyerek metni taşı (ok tuşlarıyla ince ayar)"
            >
              <span>T {t.text}</span>
            </div>
          );
        })}
      </div>
      <div className="hint">{panelCount} panel · başlık (⠿) ve telefon (✥) tutamaklarını sürükle · canlı önizleme</div>
    </div>
  );
}
