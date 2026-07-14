# Render servisi — Cloud Run için (Playwright + Chromium)
# Repo kökünde durur: `gcloud run deploy --source .` bunu otomatik kullanır
# (monorepo paketlerini kopyalayabilmesi için bağlam kök olmalı).
FROM node:22-bookworm-slim

RUN corepack enable

WORKDIR /app

# Workspace manifestleri (katman önbelleği için önce bunlar)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json tsconfig.json ./
COPY packages ./packages
COPY apps/render-service ./apps/render-service

# Sadece render-service ve bağımlılıkları
RUN pnpm install --frozen-lockfile --filter @sas/render-service...

# Chromium + sistem bağımlılıkları
RUN pnpm --filter @sas/render-service exec playwright install --with-deps chromium

ENV NODE_ENV=production
# Cloud Run PORT env'ini verir; yerelde 8080
ENV PORT=8080
EXPOSE 8080

CMD ["pnpm", "--filter", "@sas/render-service", "serve"]
