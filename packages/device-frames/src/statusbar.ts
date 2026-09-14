/**
 * statusbar.ts — Temiz, mağaza uyumlu SVG Status Bar bindiricileri (iOS & Android).
 *
 * Mobil geliştiricilerin ham ekran görüntülerindeki düşük pil, dağınık bildirimler
 * ve operatör yazılarını gizleyip, yerine Apple/Google standartlarında
 * (9:41, tam sinyal, tam Wi-Fi, dolu pil) tertemiz durum çubuğu bindirir.
 */

export type StatusBarMode = "none" | "ios-light" | "ios-dark" | "android-light" | "android-dark";

export type StatusBarOptions = {
  mode: StatusBarMode;
  /** Görselin arkasında hafif karartma/aydınlatma bandı olsun mu (kontrast için). Varsayılan true. */
  scrim?: boolean;
};

/**
 * iOS Status Bar SVG parçası (iPhone Dynamic Island koordinatlarına tam uyumlu).
 * phoneFrameSvg koordinat uzayında: sx=20, sy=20, sw=960, sh=2000.
 */
export function iosStatusBarSvg(color = "#ffffff", scrim = false): string {
  const scrimHtml = scrim
    ? `<rect x="20" y="20" width="960" height="190" fill="${
        color === "#ffffff" ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.45)"
      }" />`
    : "";

  return `<g class="status-bar-ios" pointer-events="none">
    ${scrimHtml}
    <!-- Saat: 9:41 -->
    <text x="145" y="132" fill="${color}" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', Roboto, sans-serif" font-size="44" font-weight="600" letter-spacing="-0.5" text-anchor="middle">9:41</text>
    
    <!-- Sağ Bölüm: Hücresel Sinyal + Wi-Fi + Pil -->
    <g transform="translate(735, 96)" fill="${color}">
      <!-- 4 Çubuk Hücresel Sinyal (Tam çekim) -->
      <g transform="translate(0, 8)">
        <rect x="0" y="24" width="7" height="12" rx="3.5" />
        <rect x="11" y="16" width="7" height="20" rx="3.5" />
        <rect x="22" y="8" width="7" height="28" rx="3.5" />
        <rect x="33" y="0" width="7" height="36" rx="3.5" />
      </g>

      <!-- Wi-Fi İkonu (Tam Çekim) -->
      <g transform="translate(54, 4)">
        <path d="M 23 34 A 4 4 0 1 1 23 33.9 Z" />
        <path d="M 13 25 C 19 19, 27 19, 33 25" fill="none" stroke="${color}" stroke-width="4.5" stroke-linecap="round" />
        <path d="M 5 17 C 15 7, 31 7, 41 17" fill="none" stroke="${color}" stroke-width="4.5" stroke-linecap="round" />
        <path d="M -3 9 C 11 -5, 35 -5, 49 9" fill="none" stroke="${color}" stroke-width="4.5" stroke-linecap="round" />
      </g>

      <!-- Pil İkonu (100% Dolu) -->
      <g transform="translate(122, 6)">
        <!-- Gövde -->
        <rect x="0" y="2" width="62" height="32" rx="9" fill="none" stroke="${color}" stroke-width="4" opacity="0.85" />
        <!-- Kutup/Uç -->
        <path d="M 64 12 C 66.5 12, 66.5 24, 64 24" fill="${color}" opacity="0.6" />
        <!-- Dolgu -->
        <rect x="5" y="7" width="52" height="22" rx="5" fill="${color}" />
      </g>
    </g>
  </g>`;
}

/**
 * Android Status Bar SVG parçası.
 */
export function androidStatusBarSvg(color = "#ffffff", scrim = false): string {
  const scrimHtml = scrim
    ? `<rect x="20" y="20" width="960" height="140" fill="${
        color === "#ffffff" ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.45)"
      }" />`
    : "";

  return `<g class="status-bar-android" pointer-events="none">
    ${scrimHtml}
    <!-- Saat: 10:00 / 9:41 -->
    <text x="110" y="105" fill="${color}" font-family="Roboto, sans-serif" font-size="38" font-weight="500">9:41</text>

    <!-- Sağ Bölüm -->
    <g transform="translate(770, 74)" fill="${color}">
      <!-- Wi-Fi -->
      <path d="M12 4C7.31 4 3.07 5.9 0 8.98L12 21L24 8.98C20.93 5.9 16.69 4 12 4Z" transform="scale(1.4) translate(-2, 0)" />
      <!-- Sinyal -->
      <path d="M2 22H22V2L2 22Z" transform="scale(1.4) translate(22, -1)" />
      <!-- Pil -->
      <path d="M15.67 4H14V2H10V4H8.33C7.6 4 7 4.6 7 5.33V20.67C7 21.4 7.6 22 8.33 22H15.67C16.4 22 17 21.4 17 20.67V5.33C17 4.6 16.4 4 15.67 4Z" transform="scale(1.4) translate(44, -1)" />
    </g>
  </g>`;
}

export function renderStatusBarSvg(mode: StatusBarMode, scrim = false): string {
  switch (mode) {
    case "ios-light":
      return iosStatusBarSvg("#ffffff", scrim);
    case "ios-dark":
      return iosStatusBarSvg("#111111", scrim);
    case "android-light":
      return androidStatusBarSvg("#ffffff", scrim);
    case "android-dark":
      return androidStatusBarSvg("#111111", scrim);
    case "none":
    default:
      return "";
  }
}
