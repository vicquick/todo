/**
 * The Cairn mark — three hand-stacked stones, white on warm creamy beige.
 * A cairn marks the path: each stone a finished task, the stack your progress.
 * Geometry follows Phosphor's rounded, friendly language.
 */
export function CairnMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="cairn-tile" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f7ecd2" />
          <stop offset="1" stopColor="#e9d5ae" />
        </linearGradient>
      </defs>
      <rect
        x="2" y="2" width="60" height="60" rx="15"
        fill="url(#cairn-tile)"
        stroke="rgba(124,111,100,0.35)"
        strokeWidth="1.5"
      />
      {/* ground shadows */}
      <ellipse cx="32" cy="52.5" rx="19" ry="2" fill="rgba(124,111,100,0.18)" />
      {/* stones, bottom to top — slightly askew, like they were placed by hand */}
      <rect x="14" y="41.5" width="36" height="10.5" rx="5.25" fill="#fffdf7"
        transform="rotate(-2 32 46.75)" />
      <rect x="19" y="30" width="26" height="10" rx="5" fill="#fffdf7"
        transform="rotate(1.7 32 35)" />
      <rect x="24.5" y="18.5" width="15" height="9.5" rx="4.75" fill="#fffdf7"
        transform="rotate(-1.4 32 23.25)" />
    </svg>
  );
}
