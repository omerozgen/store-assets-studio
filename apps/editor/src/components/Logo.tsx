/** Vitrinshot marka işareti — panorama panelleri çağrıştıran üç eğik dikdörtgen. */
export function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="vlogo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="1" stopColor="#db2777" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#vlogo)" />
      <g fill="#fff">
        <rect x="7" y="9" width="5" height="14" rx="2" opacity="0.9" transform="rotate(-8 9.5 16)" />
        <rect x="13.5" y="7.5" width="5" height="17" rx="2" transform="rotate(-8 16 16)" />
        <rect x="20" y="9" width="5" height="14" rx="2" opacity="0.9" transform="rotate(-8 22.5 16)" />
      </g>
    </svg>
  );
}
