/**
 * Store Spec Registry — her mağaza/cihaz hedefinin tek doğruluk kaynağı.
 *
 * DİKKAT: Buradaki piksel ölçüleri temsilidir ve Apple/Google zaman zaman
 * değiştirir. Prodüksiyona geçmeden önce her hedefi güncel mağaza dokümanına
 * karşı bir kez doğrula. Bir ölçü değiştiğinde SADECE bu dosya güncellenir.
 *
 * scaleFactor = fiziksel piksel / mantıksal (CSS) piksel.
 * Render sırasında viewport = width/scaleFactor × height/scaleFactor kurulur,
 * deviceScaleFactor = scaleFactor verilir; ekran görüntüsü tam width×height çıkar.
 * Bu yüzden width ve height, scaleFactor'a tam bölünmelidir (bkz. validateTargets).
 */

export type Store = "app-store" | "play-store";
export type AssetType = "screenshot" | "feature-graphic" | "icon";

export type StoreTarget = {
  /** Kararlı, benzersiz kimlik — export klasör adlarında da kullanılır. */
  id: string;
  store: Store;
  assetType: AssetType;
  /** İnsan-okur etiket (editör/UI). */
  label: string;
  /** Fiziksel piksel — mağazaya yüklenen dosyanın birebir boyutu. */
  width: number;
  height: number;
  /** Retina çarpanı; mantıksal viewport = boyut / scaleFactor. */
  scaleFactor: number;
  /** Mağaza listelemesi için zorunlu mu? */
  required: boolean;
  /** Mockup çerçevesi türü (screenshot hedefleri için). Varsayılan telefon. */
  deviceKind?: "phone" | "tablet";
  notes?: string;
};

export const STORE_TARGETS: readonly StoreTarget[] = [
  // ---- Apple App Store ----
  {
    id: "ios-6.9",
    store: "app-store",
    assetType: "screenshot",
    label: 'iPhone 6.9"',
    width: 1290,
    height: 2796,
    scaleFactor: 3,
    required: true,
    notes: "iPhone 16 Pro Max sınıfı. App Store Connect 1320×2868'i de kabul eder.",
  },
  {
    id: "ios-6.5",
    store: "app-store",
    assetType: "screenshot",
    label: 'iPhone 6.5"',
    width: 1242,
    height: 2688,
    scaleFactor: 3,
    required: false,
    notes: "iPhone 11 Pro Max / XS Max sınıfı.",
  },
  {
    id: "ios-ipad-13",
    store: "app-store",
    assetType: "screenshot",
    label: 'iPad 12.9"/13"',
    width: 2048,
    height: 2732,
    scaleFactor: 2,
    required: false,
    deviceKind: "tablet",
    notes: "iPad Pro. Yeni 13\" için 2064×2752 de görülüyor — doğrula.",
  },
  {
    id: "ios-6.9-landscape",
    store: "app-store",
    assetType: "screenshot",
    label: 'iPhone 6.9" yatay',
    width: 2796,
    height: 1290,
    scaleFactor: 3,
    required: false,
    notes: "Yatay uygulamalar (oyun/video) için. 2796×1290 resmi kabul listesinde.",
  },
  {
    id: "ios-ipad-13-landscape",
    store: "app-store",
    assetType: "screenshot",
    label: 'iPad 13" yatay',
    width: 2732,
    height: 2048,
    scaleFactor: 2,
    required: false,
    deviceKind: "tablet",
    notes: "iPad yatay. 2732×2048 resmi kabul listesinde.",
  },
  {
    id: "ios-app-icon",
    store: "app-store",
    assetType: "icon",
    label: "App Store icon",
    width: 1024,
    height: 1024,
    scaleFactor: 1,
    required: true,
    notes: "1024×1024, alfa/şeffaflık yok.",
  },

  // ---- Google Play ----
  {
    id: "android-phone",
    store: "play-store",
    assetType: "screenshot",
    label: "Android telefon",
    width: 1080,
    height: 1920,
    scaleFactor: 3,
    required: true,
    notes: "Min 2 adet. Kenar 320–3840px arası, en/boy 16:9–9:16 sınırında.",
  },
  {
    id: "android-tablet-10",
    store: "play-store",
    assetType: "screenshot",
    label: 'Android tablet 10"',
    width: 1920,
    height: 1200,
    scaleFactor: 2,
    required: false,
    deviceKind: "tablet",
    notes: "10 inç tablet, yatay.",
  },
  {
    id: "android-phone-landscape",
    store: "play-store",
    assetType: "screenshot",
    label: "Android telefon yatay",
    width: 1920,
    height: 1080,
    scaleFactor: 3,
    required: false,
    notes: "Yatay uygulamalar için (16:9, kurallara uygun).",
  },
  {
    id: "android-feature-graphic",
    store: "play-store",
    assetType: "feature-graphic",
    label: "Feature graphic",
    width: 1024,
    height: 500,
    scaleFactor: 1,
    required: true,
    notes: "Play listelemesi için zorunlu. Alfa yok.",
  },
  {
    id: "android-app-icon",
    store: "play-store",
    assetType: "icon",
    label: "Play icon",
    width: 512,
    height: 512,
    scaleFactor: 1,
    required: true,
    notes: "512×512, 32-bit PNG.",
  },
];

/** Kimliğe göre hedef getir; yoksa hata fırlat. */
export function getTarget(id: string): StoreTarget {
  const t = STORE_TARGETS.find((x) => x.id === id);
  if (!t) throw new Error(`Bilinmeyen store target: "${id}"`);
  return t;
}

/** Bir mağazanın tüm hedefleri. */
export function targetsFor(store: Store): StoreTarget[] {
  return STORE_TARGETS.filter((t) => t.store === store);
}

/** Mantıksal (CSS) viewport boyutu — render motoru bunu kullanır. */
export function logicalViewport(t: StoreTarget): { width: number; height: number } {
  return {
    width: t.width / t.scaleFactor,
    height: t.height / t.scaleFactor,
  };
}

/**
 * Registry tutarlılığını doğrula: id benzersiz, boyutlar pozitif tam sayı,
 * ve width/height scaleFactor'a tam bölünüyor (aksi halde ekran görüntüsü
 * yuvarlama yüzünden 1px kayar). Sorun listesini döndürür (boş = sağlam).
 */
export function validateTargets(targets: readonly StoreTarget[] = STORE_TARGETS): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const t of targets) {
    if (seen.has(t.id)) problems.push(`Yinelenen id: ${t.id}`);
    seen.add(t.id);
    if (!Number.isInteger(t.width) || t.width <= 0) problems.push(`${t.id}: geçersiz width ${t.width}`);
    if (!Number.isInteger(t.height) || t.height <= 0) problems.push(`${t.id}: geçersiz height ${t.height}`);
    if (t.scaleFactor <= 0) problems.push(`${t.id}: geçersiz scaleFactor ${t.scaleFactor}`);
    if (t.width % t.scaleFactor !== 0)
      problems.push(`${t.id}: width ${t.width}, scaleFactor ${t.scaleFactor}'a tam bölünmüyor`);
    if (t.height % t.scaleFactor !== 0)
      problems.push(`${t.id}: height ${t.height}, scaleFactor ${t.scaleFactor}'a tam bölünmüyor`);
  }
  return problems;
}
