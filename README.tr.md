<div align="center">

# 📱 Store Assets Studio (Vitrinshot)

**App Store ve Google Play için açık kaynaklı, kesintisiz panorama destekli mağaza görseli stüdyosu ve dışa aktarım motoru.**

[![License: MIT](https://img.shields.io/badge/Lisans-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Playwright](https://img.shields.io/badge/Motor-Playwright%20Chromium-green.svg)](https://playwright.dev/)
[![Docker Ready](https://img.shields.io/badge/Docker-Hazır-2496ED.svg)](docker-compose.yml)
[![Sıfır Telemetri](https://img.shields.io/badge/Gizlilik-Sıfır%20Telemetri-success.svg)](#-gizlilik--güvenlik)
[![Fastlane Uyumlu](https://img.shields.io/badge/Fastlane-Uyumlu-orange.svg)](#-fastlane--cicd-otomasyonu)
[![PR'lara Açık](https://img.shields.io/badge/PR'lar-bekleniyor-brightgreen.svg)](https://github.com)

<br />

<p align="center">
  🌐 <a href="README.md">English</a> • <b>Türkçe</b> • <a href="README.de.md">Deutsch</a>
</p>

<br />

<p align="center">
  <img src="assets/preview.png" alt="Store Assets Studio Editör Arayüzü" width="94%" style="border-radius: 12px; box-shadow: 0 20px 50px rgba(0,0,0,0.35);" />
</p>

<p align="center">
  <b>Piksel piksel tam boyutlu, çoklu dilde, 3B cihaz kasalı, vektörel durum çubuklu ve akan panoramalı ekran görüntülerini doğrudan tarayıcında veya CI/CD hattında üret.</b>
</p>

<p align="center">
  <a href="#-hızlı-başlangıç">Hızlı Başlangıç</a> •
  <a href="#-neden-store-assets-studio">Neden Bu Araç?</a> •
  <a href="#-temel-özellikler">Özellikler</a> •
  <a href="#-mağaza-standartları-ve-çözünürlükler">Ölçüler</a> •
  <a href="#-rest-api--otomasyon">REST API</a> •
  <a href="#-monorepo-mimarisi">Mimari</a> •
  <a href="#-yayına-alma-deployment">Deployment</a>
</p>

</div>

---

## 💡 Neden Store Assets Studio?

Mağaza ekran görüntüleri hazırlamak geliştiriciler için yorucu bir süreçtir:
- **Ticari SaaS araçları** aylık 20–50 dolar talep eder, çözünürlükleri sınırlar, filigran koyar ve abonelik tuzağına çeker.
- **Figma şablonları** responsive değildir, dil değişimlerinde manuel düzenleme gerektirir ve en kötüsü Apple'ın reddettiği **32-bit RGBA (alfa kanallı)** çıktılar üretir.
- **Gerçek cihaz ekran görüntüleri** düşük pil (%14), operatör yazıları ve karmaşık bildirimlerle mağaza vitrinini amatör gösterir.

**Store Assets Studio**, tüm bu sorunları çözen **%100 ücretsiz, MIT lisanslı ve self-host edilebilir** modern bir açık kaynak pakettir:

| Özellik | Ticari SaaS Araçları | Figma Şablonları | Store Assets Studio |
|---|:---:|:---:|:---:|
| **Maliyet** | Aylık \$19–\$49 | Tek seferlik / Manuel | **%100 Ücretsiz & Açık Kaynak** |
| **Mağaza Ret Koruması** | ⚠️ Belirsiz | ❌ Manuel araç gerektirir | **✅ Otomatik 24-bit RGB Düzleştirme** |
| **Kesintisiz Panorama** | ⚠️ Karmaşık | ⚠️ Manuel hizalama | **✅ $N \times W$ Birleşik Tuval Motoru** |
| **Temiz Durum Çubuğu** | ⚠️ Genel / Yok | ⚠️ Sabit maskeler | **✅ Vektörel iOS (9:41) & Android SVG** |
| **Headless CI/CD / API** | ❌ Yok | ❌ Manuel dışa aktarım | **✅ Node.js + Playwright REST API** |
| **Fastlane Metadata Çıktısı** | ❌ Ücretli / Yalnız ZIP | ❌ Manuel adlandırma | **✅ Doğrudan Fastlane Klasör Yapısı** |
| **Gizlilik & Self-Hosting** | ❌ Kapalı bulut | Yalnız yerel | **✅ %100 Bellek İçi / Sıfır Takip** |

---

## ✨ Temel Özellikler

### 🎨 1. Kesintisiz Panorama Motoru (Continuous Panorama)
Paneller birbirinden bağımsız kutular olarak değil, $N$ adet panelden oluşan **tek bir geniş tuval** ($N \times W$) olarak işlenir.
- Degrade geçişler, ortam ışıklandırma balonları ve açılı telefonlar panellerin sınır çizgilerini (seam) kesintisiz aşabilir.
- Dışa aktarma sırasında tuval birebir pikselinde dilimlenir; sınırda kalan telefon iki komşu panele bölünerek App Store vitrininde etkileyici bir **"akan galeri"** efekti oluşturur.

### 📱 2. 3D Vektörel Cihaz Kasaları (Extruded Mockups)
- iPhone (Titanyum, Gümüş, Siyah) ve iPad için keskin vektörel çerçeveler.
- Gerçek zamanlı 3B kontrol: **Yatay Açı (Tilt Y)**, **Yatıklık (Lean Z)**, **Dikey Eğim (Pitch X)** ve **Gövde Derinliği/Kalınlığı**.
- **Çerçevesiz (Full-Bleed) Mod:** Ekran görüntüsünü panel genişliğinde tam doldurarak sıfır kalite kaybı ve minimalist görünüm sağlar.

### ⚡ 3. Mağaza Uyumlu Vektörel Durum Çubuğu (Status Bar Cleaner)
Test cihazlarından alınan görüntülerdeki düşük pil, operatör adı ve bildirimleri gizleyin:
- Tek tıkla **Durum Çubuğu** modunu açın.
- Kusursuz SVG durum çubukları:
  - **iOS (Açık & Koyu):** Apple standart saati `9:41`, 4 çubuk tam hücresel sinyal, tam Wi-Fi ve %100 dolu pil simgesi.
  - **Android (Açık & Koyu):** Android standart durum simgeleri.
- Açık renkli ekranlarda okunabilirlik için hafif degrade kontrast zemini içerir.

### 🛡️ 4. Sıfır Mağaza Reddi (24-bit RGB Düzleştirme)
- Apple App Store (Kural 2.3.3) ve Google Play, şeffaflık (alfa kanalı) içeren PNG'leri **kesinlikle reddeder**.
- Tarayıcılar doğası gereği 32-bit RGBA PNG üretir.
- Store Assets Studio, alfa kanalını arka plan rengiyle harmanlayıp yok eden **saf TypeScript, sıfır bağımlılıklı PNG kodlayıcı** (`png.ts`) ile her görseli **24-bit RGB** formatına dönüştürür.

### 🌍 5. Çoklu Dil (i18n) Otomasyonu
- Başlıklarınızı ve rozet metinlerinizi birden fazla dilde (Türkçe, İngilizce, Almanca, İspanyolca vb.) tanımlayın.
- Canlı önizleme tuvalinde diller arasında anında geçiş yapın.
- Tek tıkla tüm dillerdeki mağaza görsellerini tek bir ZIP paketi olarak indirin.

### 📦 6. Fastlane & CI/CD Uyumluluğu
- Fastlane klasör hiyerarşisine tam uyumlu dışa aktarım:
  - `fastlane/metadata/android/[locale]/images/phoneScreenshots/`
  - `fastlane/metadata/ios/[locale]/`
- App Store Connect veya Google Play Console'a tek tek yükleme zahmetine son verir.

---

## 📐 Mağaza Standartları ve Çözünürlükler

| Mağaza / Platform | Hedef ID | Çözünürlük (Piksel) | En/Boy Oranı | Kullanım Alanı |
|---|---|:---:|:---:|---|
| **Apple App Store** | `ios-6.9` | **1290 × 2796** | 19.5:9 | iPhone 16 Pro Max, 15 Pro Max |
| **Apple App Store** | `ios-6.5` | **1242 × 2688** | 19.5:9 | iPhone 14 Plus, 13 Pro Max |
| **Apple App Store** | `ios-ipad-13` | **2064 × 2752** | 4:3 | iPad Pro 13 inç (M4 / 6. Nesil) |
| **Google Play** | `android-phone` | **1080 × 2400** | 20:9 | Modern Android Telefonlar |
| **Google Play** | `android-feature-graphic` | **1024 × 500** | ~2:1 | Google Play Üst Vitrin Bannerı |
| **Google Play** | `android-app-icon` | **512 × 512** | 1:1 | Yüksek Çözünürlüklü Uygulama İkonu |

---

## 🚀 Hızlı Başlangıç

### Yöntem 1: Docker ile (En Kolay)

Tek bir komutla hem Web Editörünü hem Render Servisini ayağa kaldırın:

```bash
git clone https://github.com/your-username/store-assets-studio.git
cd store-assets-studio

docker compose up --build
```

Tarayıcınızdan **[http://localhost:8080](http://localhost:8080)** adresine gidin.

---

### Yöntem 2: Yerel Geliştirme (Node.js & pnpm)

**Ön Koşullar:**
- Node.js 20+
- pnpm 9+ (`corepack enable pnpm` veya `npm i -g pnpm`)

```bash
# 1. Depoyu klonlayın
git clone https://github.com/your-username/store-assets-studio.git
cd store-assets-studio

# 2. Bağımlılıkları yükleyin
pnpm install

# 3. Playwright Chromium motorunu kurun (tek seferlik)
pnpm --filter @sas/render-service exec playwright install chromium

# 4. Geliştirme sunucularını başlatın (Editör :5173, Render Servisi :8787)
pnpm dev
```

Tarayıcınızdan **[http://localhost:5173](http://localhost:5173)** adresine gidin.

---

## 📋 Kullanılabilir Komutlar

| Komut | Açıklama |
|---|---|
| `pnpm dev` | Render servisini (`:8787`) ve Editörü (`:5173`) paralel başlatır |
| `pnpm editor` | Yalnızca Vite React Editör sunucusunu başlatır |
| `pnpm export:serve` | Yalnızca Playwright render HTTP sunucusunu başlatır |
| `pnpm test` | Birim testlerini (ölçü standartları ve 24-bit PNG kodlayıcı) çalıştırır |
| `pnpm test:specs` | Mağaza çözünürlük ölçek faktörlerini doğrular |
| `pnpm test:png` | Saf TypeScript 24-bit RGB düzleştirme testlerini çalıştırır |
| `pnpm typecheck` | Tüm monorepo genelinde TypeScript tip kontrolü yapar |
| `pnpm build:web` | Editör üretim derlemesini (dist) ve statik sayfaları (SSG) oluşturur |

---

## 🤖 REST API & Otomasyon

Render servisi, GitHub Actions, GitLab CI veya terminal betiklerinizden programatik olarak görsel üretmeniz için `POST /export` uç noktası sunar.

### İstek (JSON Payload)

```bash
curl -X POST http://localhost:8787/export \
  -H "Content-Type: application/json" \
  -d '{
    "themeId": "midnight-cascade",
    "targetId": "ios-6.9",
    "overrides": {
      "device": {
        "finish": "titanium",
        "statusBar": "ios-light"
      }
    },
    "panels": [
      {
        "screenshotSrc": "data:image/png;base64,...",
        "caption": "Yapay Zeka ile Antrenmanını Takip Et",
        "texts": [
          { "text": "★ 4.9 Puan", "xFrac": 0.5, "yFrac": 0.12, "color": "#facc15" }
        ]
      },
      {
        "screenshotSrc": "data:image/png;base64,...",
        "caption": "60 FPS Canlı Duruş Analizi"
      }
    ]
  }'
```

### Yanıt

```json
{
  "results": [
    {
      "target": {
        "id": "ios-6.9",
        "store": "apple",
        "width": 1290,
        "height": 2796
      },
      "panels": [
        { "index": 0, "base64": "iVBORw0KGgo...", "ok": true },
        { "index": 1, "base64": "iVBORw0KGgo...", "ok": true }
      ],
      "allOk": true
    }
  ]
}
```

---

## 🏗️ Monorepo Mimarisi

```
store-assets-studio/
├── packages/
│   ├── store-specs/        # Mağaza boyutları, en/boy oranları ve kırpma yardımcıları
│   ├── device-frames/      # 3B vektörel telefon kasaları ve SVG durum çubuğu motoru
│   ├── core-renderer/      # İzomorfik HTML/CSS şablon motoru (Editör ve Node ortak kullanır)
│   └── themes/             # Hazır temalar, degradeler, dekoratif ışıklandırma şekilleri
│
├── apps/
│   ├── editor/             # React + Vite web uygulaması
│   │   ├── src/i18n/       # Kullanıcı arayüzü yerelleştirmeleri (Türkçe, İngilizce)
│   │   ├── src/components/ # Stüdyo kontrolleri, sürükle-bırak tuval bileşenleri
│   │   └── src/routes/     # Editör, vitrin, blog ve yasal sayfalar
│   │
│   └── render-service/     # Headless render ve dışa aktarım servisi
│       ├── src/server.ts   # Node.js HTTP sunucusu (:8787)
│       ├── src/render.ts   # Playwright Chromium ekran yakalama hattı
│       ├── src/png.ts      # Saf TypeScript 24-bit RGB kodlayıcı
│       └── src/prerender.ts# Statik sayfa ön-derleme betiği (SSG)
│
├── assets/                 # Önizleme görselleri
├── docker-compose.yml      # Üretim Docker yapılandırması
└── Dockerfile              # Node.js + Chromium Alpine konteyner tanımı
```

---

## ⚙️ Çevre Değişkenleri (.env)

| Değişken | Varsayılan | Açıklama |
|---|:---:|---|
| `PORT` | `8787` (Docker: `8080`) | Render servisi HTTP portu |
| `RATE_LIMIT_PER_DAY` | `0` | IP başına günlük limit (`0` = sınırsız) |
| `MAX_CONCURRENT_RENDERS` | `4` | Eşzamanlı Chromium render sayısı |
| `ALLOWED_ORIGINS` | `*` | CORS izin verilen adresler |
| `VITE_GA_ID` | *(boş)* | İsteğe bağlı Google Analytics ID |

---

## 🔒 Gizlilik & Güvenlik

- **Sıfır Telemetri:** `VITE_GA_ID` tanımlanmadığı sürece hiçbir analitik veya takip kodu yüklenmez.
- **Tarayıcı İçi Depolama:** Projeleriniz tarayıcınızın yerel IndexedDB veritabanında tutulur; tasarımlarınız harici sunuculara kaydedilmez.
- **Geçici Bellek İçi İşleme:** Dışa aktarım için gönderilen görseller sunucu RAM'inde anlık işlenir ve yanıt sonrası derhal serbest bırakılır. Diske hiçbir görsel kaydedilmez.

---

## 🤝 Katkıda Bulunma

Açık kaynak topluluğuna katkı sağlamak isterseniz:

1. Projeyi **Fork** edin
2. Yeni bir özellik dalı oluşturun (`git checkout -b feat/yeni-cihaz-kasasi`)
3. Değişikliklerinizi commit'leyin (`git commit -m 'feat: Apple Watch kasası eklendi'`)
4. Dalınıza push edin (`git push origin feat/yeni-cihaz-kasasi`)
5. Bir **Pull Request** açın

---

## 🌐 Çeviriler

Bu dokümantasyon birden fazla dilde mevcuttur:
- 🇬🇧 [English](README.md)
- 🇹🇷 [Türkçe](README.tr.md)
- 🇩🇪 [Deutsch](README.de.md)

---

## 📄 Lisans

Bu proje **MIT Lisansı** altında dağıtılmaktadır. Kişisel, ticari ve kurumsal projelerde dilediğiniz gibi kullanabilirsiniz. Detaylar için [`LICENSE`](LICENSE) dosyasına göz atın.
