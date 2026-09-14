import type { Lang } from "../i18n/index.tsx";

export type Post = {
  slug: string;
  date: string; // ISO
  title: Record<Lang, string>;
  description: Record<Lang, string>;
  /** Güvenilir (bizim yazdığımız) HTML — dangerouslySetInnerHTML ile basılır. */
  bodyHtml: Record<Lang, string>;
};

const CTA_TR = `<p class="post-cta"><a href="/editor">Vitrinshot editörüyle ücretsiz dene →</a></p>`;
const CTA_EN = `<p class="post-cta"><a href="/en/editor">Try it free with the Vitrinshot editor →</a></p>`;

export const POSTS: Post[] = [
  {
    slug: "app-store-screenshot-boyutlari",
    date: "2026-07-18",
    title: {
      tr: "App Store ekran görüntüsü boyutları (2026 tam liste)",
      en: "App Store screenshot sizes (2026 complete list)",
    },
    description: {
      tr: "iPhone ve iPad için App Store Connect'in kabul ettiği güncel ekran görüntüsü piksel boyutları, format kuralları ve pratik ipuçları.",
      en: "The current App Store Connect screenshot pixel sizes for iPhone and iPad, format rules, and practical tips.",
    },
    bodyHtml: {
      tr: `
<p>App Store Connect, ekran görüntülerini <strong>birebir piksel boyutlarında</strong> ister; yanlış ölçü yüklemen reddedilmene yol açar. 2026 itibarıyla en çok kullanılan boyutlar:</p>
<table>
<thead><tr><th>Cihaz</th><th>Dikey</th><th>Yatay</th></tr></thead>
<tbody>
<tr><td>iPhone 6.9" (15/16 Pro Max)</td><td>1290 × 2796</td><td>2796 × 1290</td></tr>
<tr><td>iPhone 6.5" (11 Pro Max, XS Max)</td><td>1242 × 2688</td><td>2688 × 1242</td></tr>
<tr><td>iPad Pro 12.9"/13"</td><td>2048 × 2732</td><td>2732 × 2048</td></tr>
</tbody>
</table>
<h2>Format kuralları</h2>
<ul>
<li><strong>PNG veya JPG</strong> — mağaza yüklemeleri için PNG önerilir.</li>
<li><strong>Alfa kanalı olmamalı</strong> (24-bit RGB). Şeffaflık içeren PNG reddedilir.</li>
<li>sRGB renk uzayı; her boyut için en az 1, en çok 10 görsel.</li>
</ul>
<h2>Pratik ipuçları</h2>
<ul>
<li>Apple, 6.9" setini diğer boyutlara otomatik ölçekleyebilir; yine de en az 6.9" setini hazırlayın.</li>
<li>İlk 2–3 görsel en kritiği — kullanıcı galeriyi kaydırmadan bunları görür.</li>
<li>Her dil için ayrı başlık/görsel yükleyebilirsiniz (lokalizasyon dönüşümü artırır).</li>
</ul>
${CTA_TR}`,
      en: `
<p>App Store Connect requires screenshots at <strong>exact pixel dimensions</strong>; uploading the wrong size gets you rejected. As of 2026, the most-used sizes:</p>
<table>
<thead><tr><th>Device</th><th>Portrait</th><th>Landscape</th></tr></thead>
<tbody>
<tr><td>iPhone 6.9" (15/16 Pro Max)</td><td>1290 × 2796</td><td>2796 × 1290</td></tr>
<tr><td>iPhone 6.5" (11 Pro Max, XS Max)</td><td>1242 × 2688</td><td>2688 × 1242</td></tr>
<tr><td>iPad Pro 12.9"/13"</td><td>2048 × 2732</td><td>2732 × 2048</td></tr>
</tbody>
</table>
<h2>Format rules</h2>
<ul>
<li><strong>PNG or JPG</strong> — PNG is recommended for store uploads.</li>
<li><strong>No alpha channel</strong> (24-bit RGB). PNGs with transparency are rejected.</li>
<li>sRGB color space; 1–10 images per size.</li>
</ul>
<h2>Practical tips</h2>
<ul>
<li>Apple can auto-scale the 6.9" set to other sizes; still, prepare at least the 6.9" set.</li>
<li>The first 2–3 images matter most — users see them before scrolling.</li>
<li>You can upload separate captions/images per language (localization lifts conversion).</li>
</ul>
${CTA_EN}`,
    },
  },
  {
    slug: "play-feature-graphic-nasil-yapilir",
    date: "2026-07-19",
    title: {
      tr: "Google Play feature graphic nasıl yapılır (1024×500)",
      en: "How to make a Google Play feature graphic (1024×500)",
    },
    description: {
      tr: "Play Store feature graphic'in tam boyutu, güvenli alan, metin ve tasarım kuralları — reddedilmeden hazırlamanın yolu.",
      en: "The exact size, safe area, text and design rules for the Play Store feature graphic — how to prepare it without rejection.",
    },
    bodyHtml: {
      tr: `
<p>Feature graphic, Google Play'de uygulamanızın üst banner'ıdır ve <strong>zorunludur</strong>. Boyut tektir:</p>
<ul>
<li><strong>1024 × 500 piksel</strong>, PNG veya JPG (alfa kanalı olmadan).</li>
<li>Maksimum 15 MB.</li>
</ul>
<h2>Güvenli alan</h2>
<p>Play, bazı yerleşimlerde graphic'in üzerine oynat düğmesi veya kırpma uygulayabilir. Önemli logo/metni <strong>ortadaki güvenli alanda</strong> tutun, kenarlara kritik öğe koymayın.</p>
<h2>Tasarım kuralları</h2>
<ul>
<li>Uygulama adını net ve büyük yazın; küçük ekranlarda okunmalı.</li>
<li>Yüksek kontrast + sade arka plan; kalabalık kompozisyondan kaçının.</li>
<li>Yanıltıcı öğe kullanmayın (sahte "indir" düğmesi, ödül rozeti vb.) — reddedilir.</li>
</ul>
${CTA_TR}`,
      en: `
<p>The feature graphic is the top banner for your app on Google Play and is <strong>required</strong>. There is a single size:</p>
<ul>
<li><strong>1024 × 500 pixels</strong>, PNG or JPG (no alpha channel).</li>
<li>Max 15 MB.</li>
</ul>
<h2>Safe area</h2>
<p>Play may overlay a play button or crop the graphic in some placements. Keep important logo/text in the <strong>central safe area</strong> and avoid critical elements near the edges.</p>
<h2>Design rules</h2>
<ul>
<li>Make the app name large and legible; it must read on small screens.</li>
<li>High contrast + a clean background; avoid busy compositions.</li>
<li>No misleading elements (fake "download" buttons, award badges, etc.) — they get rejected.</li>
</ul>
${CTA_EN}`,
    },
  },
  {
    slug: "magaza-ekran-goruntusu-tasarim-rehberi",
    date: "2026-07-20",
    title: {
      tr: "Mağaza ekran görüntüsü tasarım rehberi",
      en: "Store screenshot design guide",
    },
    description: {
      tr: "App Store ve Google Play için dönüşüm getiren ekran görüntüsü setleri nasıl tasarlanır: başlık, panorama düzen, lokalizasyon ve cihaz çerçeveleri.",
      en: "How to design store screenshot sets that convert on the App Store and Google Play: captions, panorama layout, localization and device frames.",
    },
    bodyHtml: {
      tr: `
<p>Ekran görüntüleri, mağaza sayfanızda indirmeyi en çok etkileyen görsellerdir. İyi bir set rastgele ekran fotoğrafı değil, <strong>tasarlanmış</strong> bir vitrindir.</p>
<h2>1. İlk görsel her şeydir</h2>
<p>Kullanıcı çoğu zaman yalnız ilk 1–2 görseli görür. En güçlü faydayı (değer önermesini) buraya koyun; kısa, net bir başlıkla.</p>
<h2>2. Başlık ekleyin</h2>
<p>Çıplak ekran görüntüsü yerine her panele kısa bir başlık ekleyin ("Saniyeler içinde paylaş" gibi). Başlıklar özelliği değil <em>faydayı</em> anlatmalı.</p>
<h2>3. Panorama (akan) düzen</h2>
<p>Arka planın ve cihazların paneller arasında aktığı "panorama" setler profesyonel durur; telefon yan yana iki görselin sınırında bölünebilir. Vitrinshot bunu tek tuvalde üretir.</p>
<h2>4. Cihaz çerçeveleri ve açı</h2>
<p>Ekran görüntüsünü gerçekçi bir telefon/tablet çerçevesine, hafif açı ve derinlikle yerleştirmek algılanan kaliteyi artırır.</p>
<h2>5. Lokalizasyon</h2>
<p>Hedef pazarların dilinde başlık kullanın. Yerelleştirilmiş görseller dönüşümü belirgin artırır.</p>
${CTA_TR}`,
      en: `
<p>Screenshots are the visuals that most influence installs on your store page. A good set isn't a random screen grab — it's a <strong>designed</strong> showcase.</p>
<h2>1. The first image is everything</h2>
<p>Users often see only the first 1–2 images. Put your strongest benefit (value proposition) there, with a short, clear caption.</p>
<h2>2. Add captions</h2>
<p>Instead of a bare screenshot, add a short caption to each panel (e.g. "Share in seconds"). Captions should sell the <em>benefit</em>, not the feature.</p>
<h2>3. Panorama (flowing) layout</h2>
<p>"Panorama" sets, where the background and devices flow across panels, look professional; the phone can even split across two side-by-side images. Vitrinshot builds this on a single canvas.</p>
<h2>4. Device frames and angle</h2>
<p>Placing the screenshot in a realistic phone/tablet frame with a subtle angle and depth raises perceived quality.</p>
<h2>5. Localization</h2>
<p>Use captions in your target markets' languages. Localized images noticeably lift conversion.</p>
${CTA_EN}`,
    },
  },

  {
    slug: "play-ekran-goruntusu-boyutlari",
    date: "2026-07-21",
    title: {
      tr: "Google Play ekran görüntüsü boyutları (2026)",
      en: "Google Play screenshot sizes (2026)",
    },
    description: {
      tr: "Google Play Console'un telefon ve tablet ekran görüntüleri için istediği boyutlar, oran ve format kuralları.",
      en: "The dimensions, aspect ratio and format rules Google Play Console requires for phone and tablet screenshots.",
    },
    bodyHtml: {
      tr: `
<p>Google Play, App Store'a göre daha esnek boyut kabul eder ama yine de kuralları vardır. Ekran görüntüsü gereksinimleri:</p>
<table>
<thead><tr><th>Tür</th><th>Kural</th></tr></thead>
<tbody>
<tr><td>Kenar uzunluğu</td><td>Her kenar 320–3840 piksel arası</td></tr>
<tr><td>Oran</td><td>16:9 (yatay) veya 9:16 (dikey)</td></tr>
<tr><td>Önerilen</td><td>1080 × 1920 (telefon), 1080 × 2340 gibi uzun oranlar da kabul</td></tr>
<tr><td>Adet</td><td>Telefon için en az 2, en fazla 8</td></tr>
<tr><td>Format</td><td>PNG (24-bit, alfasız) veya JPEG</td></tr>
</tbody>
</table>
<h2>Tablet ekran görüntüleri</h2>
<p>7" ve 10" tablet sekmeleri ayrıdır; tableti hedefliyorsan bu setleri de doldur — Play, tablet kullanıcılarına bunları gösterir ve eksikse "tablet için optimize değil" uyarısı çıkabilir.</p>
<h2>İpuçları</h2>
<ul>
<li>İlk 2–3 görsel arama sonuçlarında da görünebilir; en güçlülerini başa koy.</li>
<li>Metni büyük ve okunur tut; Play küçük önizlemeler gösterir.</li>
</ul>
${CTA_TR}`,
      en: `
<p>Google Play accepts more flexible sizes than the App Store, but there are still rules. Screenshot requirements:</p>
<table>
<thead><tr><th>Type</th><th>Rule</th></tr></thead>
<tbody>
<tr><td>Side length</td><td>Each side 320–3840 pixels</td></tr>
<tr><td>Aspect ratio</td><td>16:9 (landscape) or 9:16 (portrait)</td></tr>
<tr><td>Recommended</td><td>1080 × 1920 (phone); tall ratios like 1080 × 2340 are fine too</td></tr>
<tr><td>Count</td><td>At least 2, up to 8 for phone</td></tr>
<tr><td>Format</td><td>PNG (24-bit, no alpha) or JPEG</td></tr>
</tbody>
</table>
<h2>Tablet screenshots</h2>
<p>7" and 10" tablet tabs are separate; if you target tablets, fill these too — Play shows them to tablet users and may warn "not optimized for tablets" if missing.</p>
<h2>Tips</h2>
<ul>
<li>The first 2–3 images can also appear in search results; put your strongest first.</li>
<li>Keep text large and legible; Play shows small previews.</li>
</ul>
${CTA_EN}`,
    },
  },

  {
    slug: "app-icon-boyutlari",
    date: "2026-07-21",
    title: {
      tr: "App icon boyutları: iOS ve Android (tam liste)",
      en: "App icon sizes: iOS and Android (complete list)",
    },
    description: {
      tr: "App Store ve Google Play'e yüklenecek uygulama ikonu boyutları, alfa kanalı ve köşe yuvarlama kuralları.",
      en: "App icon sizes for App Store and Google Play uploads, plus alpha channel and corner-rounding rules.",
    },
    bodyHtml: {
      tr: `
<p>Mağazaya <strong>tek bir yüksek çözünürlüklü ikon</strong> yüklersin; sistem küçük boyutları kendi üretir.</p>
<table>
<thead><tr><th>Mağaza</th><th>Boyut</th><th>Format / kural</th></tr></thead>
<tbody>
<tr><td>App Store</td><td>1024 × 1024</td><td>Alfa YOK (24-bit), köşeleri sen yuvarlAMA — Apple otomatik yuvarlar</td></tr>
<tr><td>Google Play</td><td>512 × 512</td><td>32-bit PNG (alfa olabilir); Play maskeyi kendi uygular</td></tr>
</tbody>
</table>
<h2>Sık hatalar</h2>
<ul>
<li>App Store ikonuna şeffaflık koymak → reddedilir. Arka planı doldur.</li>
<li>Köşeleri elle yuvarlayıp göndermek → çift yuvarlama görünür. Kare gönder.</li>
<li>İkonun içine "indir", fiyat veya ödül rozeti koymak yasak.</li>
</ul>
<p>Vitrinshot, ikon hedefini seçtiğinde 1024 ve 512 çıktısını doğru boyut ve formatta üretir.</p>
${CTA_TR}`,
      en: `
<p>You upload a <strong>single high-resolution icon</strong> to the store; the system generates the smaller sizes.</p>
<table>
<thead><tr><th>Store</th><th>Size</th><th>Format / rule</th></tr></thead>
<tbody>
<tr><td>App Store</td><td>1024 × 1024</td><td>NO alpha (24-bit); don't round the corners — Apple rounds automatically</td></tr>
<tr><td>Google Play</td><td>512 × 512</td><td>32-bit PNG (alpha allowed); Play applies the mask itself</td></tr>
</tbody>
</table>
<h2>Common mistakes</h2>
<ul>
<li>Transparency in the App Store icon → rejected. Fill the background.</li>
<li>Pre-rounding the corners → double-rounding shows. Submit a square.</li>
<li>Putting "download", a price, or an award badge inside the icon is not allowed.</li>
</ul>
<p>When you select the icon target, Vitrinshot outputs the 1024 and 512 files at the correct size and format.</p>
${CTA_EN}`,
    },
  },

  {
    slug: "app-store-preview-video-boyutlari",
    date: "2026-07-21",
    title: {
      tr: "App Store app preview (tanıtım videosu) boyutları",
      en: "App Store app preview (video) sizes",
    },
    description: {
      tr: "iOS app preview videolarının çözünürlüğü, süresi, sayısı ve kabul edilen formatları.",
      en: "Resolution, duration, count and accepted formats for iOS app preview videos.",
    },
    bodyHtml: {
      tr: `
<p>App preview, App Store'da ekran görüntülerinin başında oynayan kısa videodur (Google Play'de ise promo video bir YouTube bağlantısıdır, yüklenmez).</p>
<h2>iOS app preview kuralları</h2>
<ul>
<li><strong>Süre:</strong> 15–30 saniye.</li>
<li><strong>Adet:</strong> Her cihaz boyutu için en fazla 3.</li>
<li><strong>Çözünürlük:</strong> Hedef cihazın ekran görüntüsü boyutuyla eşleşir (ör. 6.9"/6.5" için 1080 × 1920 veya 886 × 1920 dikey).</li>
<li><strong>Format:</strong> .mov, .mp4 veya .m4v; H.264 veya ProRes.</li>
<li>Yalnız uygulama içi görüntü kullan; gerçek cihaz eli/çevre çekimi olmaz.</li>
</ul>
<h2>İpucu</h2>
<p>İlk 3 saniye kritik — otomatik oynatmada sesli değil, o yüzden mesajı görselle ver.</p>
${CTA_TR}`,
      en: `
<p>An app preview is the short video that plays before your screenshots on the App Store (on Google Play the promo video is a YouTube link, not uploaded).</p>
<h2>iOS app preview rules</h2>
<ul>
<li><strong>Duration:</strong> 15–30 seconds.</li>
<li><strong>Count:</strong> up to 3 per device size.</li>
<li><strong>Resolution:</strong> matches the device's screenshot size (e.g. 1080 × 1920 or 886 × 1920 portrait for 6.9"/6.5").</li>
<li><strong>Format:</strong> .mov, .mp4 or .m4v; H.264 or ProRes.</li>
<li>Use in-app footage only; no real-world device/hands shots.</li>
</ul>
<h2>Tip</h2>
<p>The first 3 seconds matter most — autoplay is muted, so carry the message visually.</p>
${CTA_EN}`,
    },
  },

  {
    slug: "app-store-vs-play-gorsel-gereksinimleri",
    date: "2026-07-21",
    title: {
      tr: "App Store vs Google Play: görsel gereksinimleri karşılaştırması",
      en: "App Store vs Google Play: store asset requirements compared",
    },
    description: {
      tr: "İki mağazanın ekran görüntüsü, ikon ve grafik gereksinimlerini tek tabloda karşılaştıran hızlı başvuru.",
      en: "A quick reference comparing screenshot, icon and graphic requirements across both stores in one table.",
    },
    bodyHtml: {
      tr: `
<p>İki mağaza da farklı boyut ve kurallar ister. Tek bakışta karşılaştırma:</p>
<table>
<thead><tr><th>Varlık</th><th>App Store</th><th>Google Play</th></tr></thead>
<tbody>
<tr><td>Ekran görüntüsü</td><td>1290×2796 (6.9"), 1242×2688 (6.5"), 2048×2732 (iPad)</td><td>320–3840 kenar, 16:9/9:16; öneri 1080×1920</td></tr>
<tr><td>Adet</td><td>Boyut başına 1–10</td><td>2–8 (telefon)</td></tr>
<tr><td>İkon</td><td>1024×1024, alfasız</td><td>512×512, 32-bit</td></tr>
<tr><td>Öne çıkan grafik</td><td>—</td><td>Feature graphic 1024×500 (zorunlu)</td></tr>
<tr><td>Tanıtım videosu</td><td>App preview (yüklenir, 15–30 sn)</td><td>YouTube bağlantısı</td></tr>
<tr><td>Format</td><td>PNG/JPG, alfasız</td><td>PNG (24-bit)/JPEG</td></tr>
</tbody>
</table>
<p>Vitrinshot her iki mağazanın boyutlarını tek projede üretir; hedefleri işaretle, tek zip'te birebir ölçülerde indir.</p>
${CTA_TR}`,
      en: `
<p>Both stores ask for different sizes and rules. Compared at a glance:</p>
<table>
<thead><tr><th>Asset</th><th>App Store</th><th>Google Play</th></tr></thead>
<tbody>
<tr><td>Screenshot</td><td>1290×2796 (6.9"), 1242×2688 (6.5"), 2048×2732 (iPad)</td><td>320–3840 side, 16:9/9:16; rec. 1080×1920</td></tr>
<tr><td>Count</td><td>1–10 per size</td><td>2–8 (phone)</td></tr>
<tr><td>Icon</td><td>1024×1024, no alpha</td><td>512×512, 32-bit</td></tr>
<tr><td>Feature graphic</td><td>—</td><td>1024×500 (required)</td></tr>
<tr><td>Promo video</td><td>App preview (uploaded, 15–30s)</td><td>YouTube link</td></tr>
<tr><td>Format</td><td>PNG/JPG, no alpha</td><td>PNG (24-bit)/JPEG</td></tr>
</tbody>
</table>
<p>Vitrinshot produces both stores' sizes in one project; check the targets and download exact-size assets in a single zip.</p>
${CTA_EN}`,
    },
  },

  {
    slug: "app-store-gorsel-reddi-sebepleri",
    date: "2026-07-21",
    title: {
      tr: "App Store ekran görüntüsü reddi: sık sebepler ve çözümleri",
      en: "App Store screenshot rejection: common reasons and fixes",
    },
    description: {
      tr: "App Store Connect'in ekran görüntülerini neden reddettiği ve her biri için pratik çözümler.",
      en: "Why App Store Connect rejects screenshots and a practical fix for each.",
    },
    bodyHtml: {
      tr: `
<p>Ekran görüntüsü reddi genelde şu sebeplerden olur:</p>
<ul>
<li><strong>Yanlış boyut / alfa kanalı:</strong> Birebir piksel ölçüsü tutmuyor veya PNG şeffaflık içeriyor → doğru boyutta, 24-bit alfasız PNG gönder.</li>
<li><strong>Uygulama dışı içerik:</strong> Görsel gerçek uygulama ekranını göstermiyor (sadece pazarlama görseli) → en az bir gerçek ekran göster.</li>
<li><strong>Placeholder / beta içerik:</strong> "Lorem ipsum", geliştirme metni, hata ekranı → son hâli göster.</li>
<li><strong>Fiyat/promosyon iddiası:</strong> "%50 indirim", "1 numara" gibi ifadeler → görselden çıkar.</li>
<li><strong>Yanıltıcı:</strong> Uygulamada olmayan özelliği gösterme.</li>
<li><strong>Düşük kalite:</strong> Bulanık, bozuk, ölçeklenmiş görsel → keskin, tam çözünürlük.</li>
</ul>
<p>Vitrinshot çıktıları birebir mağaza ölçüsünde ve <strong>alfasız RGB</strong> olduğundan boyut/şeffaflık kaynaklı redleri baştan önler.</p>
${CTA_TR}`,
      en: `
<p>Screenshot rejections usually come from these causes:</p>
<ul>
<li><strong>Wrong size / alpha channel:</strong> Dimensions don't match exactly or the PNG has transparency → submit an exact-size, 24-bit alpha-free PNG.</li>
<li><strong>Non-app content:</strong> The image doesn't show the actual app (marketing-only art) → include at least one real screen.</li>
<li><strong>Placeholder / beta content:</strong> "Lorem ipsum", dev text, an error screen → show the finished state.</li>
<li><strong>Price/promo claims:</strong> phrases like "50% off", "#1" → remove them from the image.</li>
<li><strong>Misleading:</strong> don't show a feature the app doesn't have.</li>
<li><strong>Low quality:</strong> blurry, distorted, upscaled → crisp, full resolution.</li>
</ul>
<p>Because Vitrinshot output is exact store size and <strong>alpha-free RGB</strong>, it prevents size/transparency rejections up front.</p>
${CTA_EN}`,
    },
  },

  {
    slug: "play-grafik-politikasi-alfa",
    date: "2026-07-21",
    title: {
      tr: "Google Play grafik politikası ve alfa/şeffaflık sorunu",
      en: "Google Play graphics policy and the alpha/transparency issue",
    },
    description: {
      tr: "Play Store görsellerinde metin, yanıltıcı öğe ve alfa kanalı kuralları — reddi önlemek için bilmen gerekenler.",
      en: "Text, misleading-element and alpha-channel rules for Play Store graphics — what to know to avoid rejection.",
    },
    bodyHtml: {
      tr: `
<h2>Grafik politikası özeti</h2>
<ul>
<li>Yanıltıcı öğe yok: sahte "indir/oynat" düğmesi, gerçek dışı ödül/"Editörün Seçimi" rozeti kullanma.</li>
<li>Metin okunur ve abartısız olmalı; feature graphic'i metinle doldurma.</li>
<li>Başka platform/marka logosu veya izinsiz içerik koyma.</li>
</ul>
<h2>Alfa / şeffaflık</h2>
<p>Ekran görüntülerini ve feature graphic'i <strong>24-bit (alfasız)</strong> gönder. Şeffaf zeminli PNG, bazı yüklemelerde siyah/bozuk arka planla görünebilir veya reddedilir. İkon ise 32-bit (alfa) olabilir çünkü Play maskeyi kendi uygular.</p>
<p>Vitrinshot ekran görüntüsü ve feature graphic çıktılarını otomatik olarak alfasız RGB'ye düzleştirir; bu sorunu hiç yaşamazsın.</p>
${CTA_TR}`,
      en: `
<h2>Graphics policy in brief</h2>
<ul>
<li>No misleading elements: don't use fake "download/play" buttons or fake award/"Editors' Choice" badges.</li>
<li>Text must be legible and not overstated; don't fill the feature graphic with text.</li>
<li>Don't include other platforms'/brands' logos or unlicensed content.</li>
</ul>
<h2>Alpha / transparency</h2>
<p>Submit screenshots and the feature graphic as <strong>24-bit (no alpha)</strong>. A transparent-background PNG can render with a black/broken background on some uploads or get rejected. The icon may be 32-bit (alpha) because Play applies the mask itself.</p>
<p>Vitrinshot automatically flattens screenshot and feature-graphic output to alpha-free RGB, so you never hit this.</p>
${CTA_EN}`,
    },
  },

  {
    slug: "temiz-ekran-goruntusu-cekme",
    date: "2026-07-21",
    title: {
      tr: "Temiz ekran görüntüsü çekme (simulator + status bar)",
      en: "Capturing clean screenshots (simulator + status bar)",
    },
    description: {
      tr: "Mağaza için profesyonel görünen, temiz status bar'lı ekran görüntüleri nasıl çekilir — iOS ve Android.",
      en: "How to capture store-ready screenshots with a clean status bar — iOS and Android.",
    },
    bodyHtml: {
      tr: `
<p>Mağaza görselinde saat, pil, bildirim gibi dağınık öğeler amatör durur. Temiz çekim:</p>
<h2>iOS (Simulator)</h2>
<ul>
<li>Status bar'ı sabitle: <code>xcrun simctl status_bar &lt;UDID&gt; override --time "9:41" --batteryLevel 100 --cellularBars 4 --wifiBars 3</code></li>
<li>Görüntü al: <code>xcrun simctl io &lt;UDID&gt; screenshot cikti.png</code> (tam çözünürlük).</li>
<li>Apple'ın klasik saati <strong>9:41</strong>'dir.</li>
</ul>
<h2>Android (Emulator)</h2>
<ul>
<li>Demo modunu aç (adb): bildirimleri gizle, saati sabitle, pili tam göster.</li>
<li>Örn: <code>adb shell settings put global sysui_demo_allowed 1</code> ardından demo <code>exit/enter</code> komutları.</li>
</ul>
<h2>Sonra</h2>
<p>Temiz ham ekran görüntülerini Vitrinshot'a sürükle; çerçeve, açı, arka plan ve başlığı ekleyip mağaza boyutlarında dışa aktar.</p>
${CTA_TR}`,
      en: `
<p>Clutter like the clock, battery or notifications looks amateur in a store image. For a clean capture:</p>
<h2>iOS (Simulator)</h2>
<ul>
<li>Freeze the status bar: <code>xcrun simctl status_bar &lt;UDID&gt; override --time "9:41" --batteryLevel 100 --cellularBars 4 --wifiBars 3</code></li>
<li>Capture: <code>xcrun simctl io &lt;UDID&gt; screenshot out.png</code> (full resolution).</li>
<li>Apple's classic time is <strong>9:41</strong>.</li>
</ul>
<h2>Android (Emulator)</h2>
<ul>
<li>Enable demo mode (adb): hide notifications, freeze the clock, show a full battery.</li>
<li>E.g. <code>adb shell settings put global sysui_demo_allowed 1</code> then the demo <code>exit/enter</code> commands.</li>
</ul>
<h2>Then</h2>
<p>Drag the clean raw screenshots into Vitrinshot; add a frame, angle, background and caption, then export at store sizes.</p>
${CTA_EN}`,
    },
  },

  {
    slug: "fastlane-ekran-goruntusu-otomasyonu",
    date: "2026-07-21",
    title: {
      tr: "Fastlane ile ekran görüntüsü otomasyonu",
      en: "Automating screenshots with fastlane",
    },
    description: {
      tr: "fastlane snapshot (iOS) ve screengrab (Android) ile çoklu cihaz/dil ekran görüntülerini otomatik üretmek.",
      en: "Auto-generating multi-device/language screenshots with fastlane snapshot (iOS) and screengrab (Android).",
    },
    bodyHtml: {
      tr: `
<p>Onlarca cihaz × dil kombinasyonunu elle çekmek zaman kaybıdır. fastlane bunu UI testleriyle otomatikleştirir.</p>
<h2>iOS — snapshot</h2>
<ul>
<li>UI testine <code>snapshot()</code> çağrıları ekle; her ekranda görüntü alır.</li>
<li><code>fastlane snapshot</code> tüm cihaz ve dillerde ham ekran görüntülerini üretir.</li>
</ul>
<h2>Android — screengrab</h2>
<ul>
<li>Espresso testleriyle <code>Screengrab.screenshot()</code> çağır; <code>fastlane screengrab</code> çalıştır.</li>
</ul>
<h2>Çerçeve & tasarım</h2>
<p>fastlane'in <code>frameit</code>'i basit çerçeve ekler ama panorama düzen, açı, tema ve tasarım kontrolü sınırlıdır. Ham görüntüleri fastlane ile toplu üret, sonra Vitrinshot'ta profesyonel set hâline getir ve mağaza boyutlarında dışa aktar.</p>
${CTA_TR}`,
      en: `
<p>Capturing dozens of device × language combinations by hand wastes time. fastlane automates it via UI tests.</p>
<h2>iOS — snapshot</h2>
<ul>
<li>Add <code>snapshot()</code> calls to a UI test; it captures each screen.</li>
<li><code>fastlane snapshot</code> generates raw screenshots across all devices and languages.</li>
</ul>
<h2>Android — screengrab</h2>
<ul>
<li>Call <code>Screengrab.screenshot()</code> from Espresso tests; run <code>fastlane screengrab</code>.</li>
</ul>
<h2>Framing & design</h2>
<p>fastlane's <code>frameit</code> adds a basic frame, but panorama layout, angle, theme and design control are limited. Batch-generate raw shots with fastlane, then turn them into a polished set in Vitrinshot and export at store sizes.</p>
${CTA_EN}`,
    },
  },

  {
    slug: "lokalize-magaza-gorselleri",
    date: "2026-07-21",
    title: {
      tr: "Çoklu dilde (lokalize) mağaza görselleri hazırlama",
      en: "Preparing localized store screenshots",
    },
    description: {
      tr: "Farklı diller için ekran görüntüsü başlıklarını yerelleştirerek dönüşümü artırma ve süreç ipuçları.",
      en: "Lifting conversion by localizing screenshot captions per language, plus workflow tips.",
    },
    bodyHtml: {
      tr: `
<p>Mağaza görsellerini hedef pazarın dilinde sunmak indirme oranını belirgin artırır — çünkü kullanıcı değer önermesini kendi dilinde anında anlar.</p>
<h2>Neyi yerelleştirmeli</h2>
<ul>
<li><strong>Başlıklar (caption):</strong> En önemli kısım; her dile çevir.</li>
<li>Ekran görüntüsündeki uygulama içeriği (mümkünse o dilde).</li>
<li>Feature graphic üzerindeki metin.</li>
</ul>
<h2>Pratik süreç</h2>
<ul>
<li>Tasarımı bir kez kur; yalnız metinleri dile göre değiştir (düzen sabit kalsın).</li>
<li>Play dil kodları bölgeli olabilir (tr → tr-TR); klasör adlarını buna göre düzenle.</li>
</ul>
<p>Vitrinshot'ta dil sekmeleri vardır: her panel başlığını dil bazında yazarsın ve export "dil × hedef" olarak tek zip'e çıkar — düzeni tekrar kurmana gerek kalmaz.</p>
${CTA_TR}`,
      en: `
<p>Presenting store images in the target market's language noticeably lifts installs — the user grasps the value proposition instantly in their own language.</p>
<h2>What to localize</h2>
<ul>
<li><strong>Captions:</strong> the most important part; translate for each language.</li>
<li>The app content in the screenshot (in that language where possible).</li>
<li>Text on the feature graphic.</li>
</ul>
<h2>Practical workflow</h2>
<ul>
<li>Build the design once; only swap the text per language (keep the layout fixed).</li>
<li>Play language codes can be regional (tr → tr-TR); name folders accordingly.</li>
</ul>
<p>Vitrinshot has language tabs: you write each panel's caption per language and export goes out as "language × target" in one zip — no need to rebuild the layout.</p>
${CTA_EN}`,
    },
  },
];

export const getPost = (slug: string): Post | undefined => POSTS.find((p) => p.slug === slug);
