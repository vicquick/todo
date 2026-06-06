/**
 * Brand mark — the Phosphor "notebook" glyph (U+E34E) on a rounded tile.
 * Theme-aware: creamy tile + ink glyph in light mode, canvas-grey tile +
 * warm-white glyph in dark mode. The static favicon.svg uses the dark
 * variant so the tab icon reads on any browser chrome.
 */
const PHOSPHOR_NOTEBOOK =
  "M184,112a8,8,0,0,1-8,8H112a8,8,0,0,1,0-16h64A8,8,0,0,1,184,112Zm-8,24H112a8,8,0,0,0,0,16h64a8,8,0,0,0,0-16Zm48-88V208a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V48A16,16,0,0,1,48,32H208A16,16,0,0,1,224,48ZM48,208H72V48H48Zm160,0V48H88V208H208Z";

export function CairnMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect
        x="2" y="2" width="60" height="60" rx="15"
        style={{ fill: "var(--secondary)", stroke: "var(--border-strong)" }}
        strokeWidth="1"
      />
      <g transform="translate(13.2 13.2) scale(0.1469)">
        <path d={PHOSPHOR_NOTEBOOK} style={{ fill: "var(--foreground)" }} />
      </g>
    </svg>
  );
}
