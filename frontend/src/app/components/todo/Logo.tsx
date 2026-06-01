export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="relative">
        <div className="size-9 rounded-[10px] bg-primary text-primary-foreground grid place-items-center shadow-soft-md">
          <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden>
            <path d="M5 12.5L9.5 17L19 7.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span
          className="absolute -bottom-1 -right-1 size-3 rounded-full ring-2 ring-background"
          style={{ background: "var(--gb-aqua)" }}
          aria-hidden
        />
      </div>
      <div className="leading-tight">
        <div className="font-display text-[1.05rem] tracking-tight">Cairn</div>
        <div className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">Todo · Gruvbox</div>
      </div>
    </div>
  );
}
