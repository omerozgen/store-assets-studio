<div align="center">

# 📱 Store Assets Studio (Vitrinshot)

**Open-Source Screenshot-Studio und Export-Engine mit kontinuierlichem Panorama für App Store & Google Play.**

[![License: MIT](https://img.shields.io/badge/Lizenz-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Playwright](https://img.shields.io/badge/Engine-Playwright%20Chromium-green.svg)](https://playwright.dev/)
[![Docker Ready](https://img.shields.io/badge/Docker-Bereit-2496ED.svg)](docker-compose.yml)
[![Null Telemetrie](https://img.shields.io/badge/Datenschutz-Keine%20Telemetrie-success.svg)](#-datenschutz--sicherheit)
[![Fastlane Ready](https://img.shields.io/badge/Fastlane-Kompatibel-orange.svg)](#-fastlane--cicd-automatisierung)
[![PRs Welcome](https://img.shields.io/badge/PRs-willkommen-brightgreen.svg)](https://github.com)

<br />

<p align="center">
  🌐 <a href="README.md">English</a> • <a href="README.tr.md">Türkçe</a> • <b>Deutsch</b>
</p>

<br />

<p align="center">
  <img src="assets/preview.png" alt="Store Assets Studio Benutzeroberfläche" width="94%" style="border-radius: 12px; box-shadow: 0 20px 50px rgba(0,0,0,0.35);" />
</p>

<p align="center">
  <b>Erstelle pixelgenaue, mehrsprachige Screenshot-Sequenzen mit 3D-Geräterahmen, Vektor-Statusleisten und nahtlosen Panoramen — direkt im Browser oder headless in CI/CD.</b>
</p>

<p align="center">
  <a href="#-schnellstart">Schnellstart</a> •
  <a href="#-warum-store-assets-studio">Warum dieses Studio?</a> •
  <a href="#-hauptfunktionen">Funktionen</a> •
  <a href="#-store-spezifikationen">Store-Spezifikationen</a> •
  <a href="#-rest-api--automatisierung">REST-API</a> •
  <a href="#-monorepo-architektur">Architektur</a>
</p>

</div>

---

## 💡 Warum Store Assets Studio?

Die Erstellung von App-Store-Screenshots ist oft zeitraubend und teuer:
- **Kommerzielle SaaS-Dienste** verlangen 20–50 € pro Monat, limitieren Auflösungen und binden Nutzer an Abonnements.
- **Figma-Vorlagen** sind unflexibel, erfordern manuelle Lokalisierung und erzeugen oft **32-Bit-RGBA-PNGs**, die von Apple abgelehnt werden.
- **Echte Bildschirmfotos** von Testgeräten zeigen leere Akkus (14%), Netzbetreiber-Namen und Benachrichtigungen.

**Store Assets Studio** ist eine **100% kostenlose, MIT-lizenzierte und selbst-hostbare** Komplettlösung:

| Funktion | Kommerzielle SaaS-Tools | Figma-Vorlagen | Store Assets Studio |
|---|:---:|:---:|:---:|
| **Kosten** | 19–49 € / Monat | Einmalig oder DIY | **100% Kostenlos & Open Source** |
| **Store-Ablehnungsschutz** | ⚠️ Variiert | ❌ Manuelle Konvertierung | **✅ Automatische 24-Bit-RGB-Glättung** |
| **Nahtloses Panorama** | ⚠️ Kompliziert | ⚠️ Manuelle Ausrichtung | **✅ Native $N \times W$ Panorama-Canvas** |
| **Saubere Statusleiste** | ⚠️ Generisch / Keine | ⚠️ Statische Masken | **✅ Native iOS (9:41) & Android SVG** |
| **Headless CI/CD / API** | ❌ Keine | ❌ Nur manueller Export | **✅ Node.js + Playwright REST API** |
| **Fastlane-Ordnerstruktur** | ❌ Nur kostenpflichtig | ❌ Manuelles Umbenennen | **✅ Native Fastlane-Struktur** |
| **Datenschutz & Self-Hosting**| ❌ Closed-Cloud | Nur lokal | **✅ 100% In-Memory / Null Tracking** |

---

## 🚀 Schnellstart

### Mit Docker (Empfohlen)

```bash
git clone https://github.com/your-username/store-assets-studio.git
cd store-assets-studio

docker compose up --build
```

Öffne **[http://localhost:8080](http://localhost:8080)** im Browser.

---

### Lokale Entwicklung (Node.js & pnpm)

**Voraussetzungen:** Node.js 20+ und pnpm 9+.

```bash
# 1. Abhängigkeiten installieren
pnpm install

# 2. Playwright Chromium installieren (einmalig)
pnpm --filter @sas/render-service exec playwright install chromium

# 3. Entwicklungsserver starten (Editor: 5173, Render-Service: 8787)
pnpm dev
```

Öffne **[http://localhost:5173](http://localhost:5173)** im Browser.

---

## 📐 Store-Spezifikationen

| Plattform | Ziel-ID | Auflösung (Pixel) | Seitenverhältnis | Gerät / Verwendung |
|---|---|:---:|:---:|---|
| **Apple App Store** | `ios-6.9` | **1290 × 2796** | 19.5:9 | iPhone 16 Pro Max, 15 Pro Max |
| **Apple App Store** | `ios-6.5` | **1242 × 2688** | 19.5:9 | iPhone 14 Plus, 13 Pro Max |
| **Apple App Store** | `ios-ipad-13` | **2064 × 2752** | 4:3 | iPad Pro 13-Zoll (M4) |
| **Google Play** | `android-phone` | **1080 × 2400** | 20:9 | Moderne Android-Smartphones |
| **Google Play** | `android-feature-graphic` | **1024 × 500** | ~2:1 | Google Play Store Banner |
| **Google Play** | `android-app-icon` | **512 × 512** | 1:1 | Hochauflösendes App-Icon |

---

## 🌐 Übersetzungen

Diese Dokumentation ist in mehreren Sprachen verfügbar:
- 🇬🇧 [English](README.md)
- 🇹🇷 [Türkçe](README.tr.md)
- 🇩🇪 [Deutsch](README.de.md)

---

## 📄 Lizenz

Veröffentlicht unter der **MIT-Lizenz**. Frei für private, kommerzielle und unternehmerische Nutzung. Siehe [`LICENSE`](LICENSE) für Details.
