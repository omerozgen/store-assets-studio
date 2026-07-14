# Yayına Alma

Giriş yok; koruma **IP başına günlük rate limit + render kuyruğu** ile.

## Yol A — Tamamen web arayüzüyle (önerilen, CLI gerekmez)

Tek Cloud Run servisi hem editörü (statik build, Dockerfile içinde derlenir)
hem `/api`'yi sunar. GitHub repo'su bağlanır → her push otomatik deploy.

1. **Faturalama:** [console.cloud.google.com](https://console.cloud.google.com)
   → proje seç/oluştur → Billing → hesap bağla (Firebase tarafında Blaze'e denk).
2. **Cloud Run → Create Service** → "Continuously deploy from a repository"
   → Set up with Cloud Build → GitHub'ı yetkilendir → `store-assets-studio`
   repo'su, branch `main`, Build type: **Dockerfile** (`/Dockerfile`).
3. Servis ayarları: Region `europe-west1` · Authentication: **Allow
   unauthenticated** · Container: Memory **2 GiB**, CPU **2** · Max instances
   **3** · Environment variables: `RATE_LIMIT_PER_DAY=20`,
   `MAX_CONCURRENT_RENDERS=2` → **Create**.
4. Build bitince (~5-8 dk) çıkan `https://…run.app` adresi = siten. Sonraki
   her `git push` otomatik yayınlanır.
5. Özel alan adı: Cloud Run → Manage custom domains (web arayüzünden).

## Yol B — CLI ile (Firebase Hosting + Cloud Run, ayrık)

Mimari: **Editör** (statik, Vite build) → Firebase Hosting. **Render servisi**
(Playwright/Chromium) → Cloud Run. Hosting, `/api/**` isteklerini Cloud Run'a
rewrite eder → editör ve API aynı origin'de çalışır (CORS derdi yok).

## Ön koşullar (bir kez)

```bash
npm i -g firebase-tools
brew install google-cloud-sdk        # gcloud
firebase login && gcloud auth login
gcloud config set project <PROJE_ID> # Firebase projesiyle aynı GCP projesi
```

> Cloud Run için projede faturalama (Blaze planı) açık olmalı.

## 1) Render servisini Cloud Run'a deploy et

Repo kökünden (Dockerfile monorepo paketlerini kopyalar):

```bash
gcloud run deploy sas-render \
  --source . \
  --region europe-west1 \
  --memory 2Gi --cpu 2 \
  --max-instances 3 --min-instances 0 \
  --allow-unauthenticated \
  --set-env-vars RATE_LIMIT_PER_DAY=20,MAX_CONCURRENT_RENDERS=2
```

> `--source .` repo kökündeki `Dockerfile`'ı otomatik kullanır (Cloud Build'de
> derlenir — yerelde Docker gerekmez).

Notlar:
- `min-instances 0` → boşta maliyet yok ama ilk istekte soğuk başlama (~10-20 sn).
  Trafik artınca `--min-instances 1` yap (aylık ~sabit küçük ücret).
- Rate limit bellek içi → `--max-instances 1` iken birebir doğru; birden çok
  instance'ta yaklaşık sayar. v2'de Firestore sayacına taşınabilir.
- `firebase.json` içindeki `serviceId: "sas-render"` ve `region` buradakiyle
  aynı olmalı.

## 2) Editörü build edip Hosting'e deploy et

```bash
pnpm --filter @sas/editor build      # apps/editor/dist üretir
firebase deploy --only hosting
```

## 3) Reklam (Google AdSense)

Web uygulaması olduğu için AdMob değil **AdSense** kullanılır (aynı Google
hesabı ekosistemi). `apps/editor/index.html` içinde hazır (yorumlu) script
bloğu var: AdSense'te site onaylanınca publisher ID'yi yazıp yorumu kaldır,
yeniden `firebase deploy --only hosting`.

## Ortam değişkenleri (render servisi)

| Değişken | Varsayılan | Açıklama |
|---|---|---|
| `PORT` | 8787 (Cloud Run: 8080) | Cloud Run otomatik verir |
| `RATE_LIMIT_PER_DAY` | 20 | IP başına günlük export (0 = kapalı) |
| `MAX_CONCURRENT_RENDERS` | 2 | Eşzamanlı render; fazlası kuyruğa girer |
| `ALLOWED_ORIGINS` | `*` | Virgüllü CORS allowlist (rewrite kullanılınca gerekmez) |

## Yerel doğrulama

```bash
# Docker imajını yerelde dene
docker build -f apps/render-service/Dockerfile -t sas-render .
docker run -p 8080:8080 -e RATE_LIMIT_PER_DAY=5 sas-render
curl http://localhost:8080/healthz   # → ok

# Editör prod build önizleme
pnpm --filter @sas/editor build && pnpm --filter @sas/editor preview
```
