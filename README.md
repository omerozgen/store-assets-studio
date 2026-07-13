# Store Assets Studio

App Store / Google Play için ekran görüntüsü, feature graphic ve icon'ları
**şablon tabanlı, birebir doğru ölçülerde ve çoklu dilde** üreten platform.

**Kilit mimari:** Tek render motoru, iki runtime. Sahne bir JSON olarak tanımlanır;
aynı `core-renderer` hem tarayıcıda (editör önizleme) hem sunucuda (headless Chromium ile
final PNG export) çalışır → "önizlemede gördüğün = çıktı" (WYSIWYG).

## Yapı (monorepo, pnpm workspaces)

| Paket | Sorumluluk |
|------|-----------|
| `packages/store-specs` | Tüm mağaza/cihaz ölçülerinin tek doğruluk kaynağı (registry) |
| `packages/core-renderer` | Scene + **Set (panorama)** JSON → HTML/CSS üreten izomorfik motor (kalp). `renderSet` geniş tuval + dilim üretir |
| `packages/themes` | Hazır tema galerisi (düz + açılı cihaz, akan gradient/dekor) + override |
| `apps/render-service` | Playwright ile panorama tuvalini dilimleyip birebir boyutta PNG export + boyut & süreklilik doğrulama |
| `apps/editor` | Web görsel editörü (Vite+React) — sürükle-bırak yükleme, tema/açı/derinlik kontrolleri, canlı panorama önizleme (iframe), zip export |
| `packages/device-frames` | (Faz 3) Gerçekçi cihaz çerçevesi asset kütüphanesi |
| `apps/api` | (Faz 4) Proje/auth/job orkestrasyon |

## Çalıştırma

```bash
pnpm install
pnpm --filter @sas/render-service exec playwright install chromium  # bir kez
pnpm test:specs      # registry testleri
pnpm render:demo     # 8 hedefe örnek render → apps/render-service/out/
```

`render:demo` her hedefi render eder ve çıktı boyutunun mağaza ölçüsüyle
**birebir eşleştiğini** assert eder (piksel doğruluğu).

## Durum

- [x] **Faz 0** — İskelet: registry, izomorfik renderer, birebir boyutlu PNG export + doğrulama
- [x] **Faz 1** — Panorama motoru (`renderSet`), 5 tema, slice export + süreklilik
- [x] **Faz 1.5** — Cilalı vektör telefon çerçevesi + 3B derinlik + açı presetleri (foto compositing motoru drop-in, ertelendi)
- [x] **Faz 2** — Web editör: sürükle-bırak, tema/açı/derinlik, canlı önizleme, zip export
- [x] **Faz 3** — Çok-boyut batch export, feature graphic & icon, çoklu dil, panel sürükle-sırala
- [ ] **Faz 4** — SaaS: auth, org/proje, kalıcı storage, job kuyruğu, faturalama

## Çalıştırma (editör)

```bash
pnpm export:serve   # export sunucusu (port 8787) — bir terminalde
pnpm editor         # editör (port 5173) — başka terminalde
```

> Not: `store-specs`'teki ölçüler temsilidir; prodüksiyon öncesi güncel Apple/Google
> dokümanına karşı doğrulanmalı. Ölçü değişince sadece o dosya güncellenir.
