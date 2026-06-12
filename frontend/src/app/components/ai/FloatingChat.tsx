import { lazy, Suspense, useEffect, useState } from "react";
import { Sparkles, X, Minus, Maximize2, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { useAI } from "../../state/AIContext";
import { useIsMobile } from "../ui/use-mobile";

const ChatBody = lazy(() => import("./ChatBody").then((m) => ({ default: m.ChatBody })));

const SIZE_KEY = "cairn.ai.chatSize";
const OPEN_KEY = "cairn.ai.chatOpen";
const COLLAPSED_KEY = "cairn.ai.chatCollapsed";

type Size = { w: number; h: number };
const DEFAULT_SIZE: Size = { w: 400, h: 560 };

function readSize(): Size {
  try {
    const raw = localStorage.getItem(SIZE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (typeof s?.w === "number" && typeof s?.h === "number") return s;
    }
  } catch {}
  return DEFAULT_SIZE;
}

export function FloatingChat() {
  const { ai } = useAI();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(() => {
    try { return localStorage.getItem(OPEN_KEY) === "1"; } catch { return false; }
  });
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(COLLAPSED_KEY) === "1"; } catch { return false; }
  });
  const [size, setSize] = useState<Size>(readSize);

  useEffect(() => {
    try { localStorage.setItem(OPEN_KEY, open ? "1" : "0"); } catch {}
  }, [open]);
  useEffect(() => {
    try { localStorage.setItem(COLLAPSED_KEY, collapsed ? "1" : "0"); } catch {}
  }, [collapsed]);

  // Persist size after the user resizes (CSS resize via the panel ref).
  const onPanelMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    if (w !== size.w || h !== size.h) {
      const next = { w, h };
      setSize(next);
      try { localStorage.setItem(SIZE_KEY, JSON.stringify(next)); } catch {}
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open AI assistant"
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full border border-border bg-card shadow-soft-lg px-4 py-2.5 text-sm hover:bg-muted/60 transition-colors"
        style={{ backdropFilter: "blur(8px)" }}
      >
        <span aria-hidden className="size-2 rounded-full"
          style={{ background: ai.enabled ? "var(--success)" : "var(--muted-foreground)" }} />
        <Sparkles className="size-4" style={{ color: "var(--gb-aqua)" }} />
        <span className="font-medium">Assistant</span>
      </button>
    );
  }

  // On a phone the floating panel becomes a full-screen sheet.
  const mobileStyle: React.CSSProperties = {
    inset: 0,
    width: "100%",
    height: "100dvh",
    maxWidth: "100vw",
    maxHeight: "100dvh",
    borderRadius: 0,
    resize: "none",
    backdropFilter: "blur(10px)",
    background: "color-mix(in oklab, var(--popover) 94%, transparent)",
  };
  const desktopStyle: React.CSSProperties = {
    width: collapsed ? 320 : size.w,
    height: collapsed ? "auto" : size.h,
    minWidth: 300, minHeight: collapsed ? undefined : 320,
    maxWidth: "calc(100vw - 24px)", maxHeight: "calc(100vh - 24px)",
    resize: collapsed ? "none" : "both",
    backdropFilter: "blur(10px)",
    background: "color-mix(in oklab, var(--popover) 94%, transparent)",
  };

  return (
    <div
      className={`fixed z-40 flex flex-col border border-border bg-popover shadow-soft-lg overflow-hidden ${
        isMobile ? "" : "bottom-5 right-5 rounded-xl"
      }`}
      style={isMobile ? mobileStyle : desktopStyle}
      onMouseUp={collapsed || isMobile ? undefined : onPanelMouseUp}
      role="dialog"
      aria-label="AI assistant"
    >
      <header className="flex items-center gap-2 px-3 py-2 border-b border-border bg-card/60 select-none">
        <Sparkles className="size-4" style={{ color: "var(--gb-aqua)" }} />
        <span className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
          Assistant
        </span>
        <span aria-hidden className="size-1.5 rounded-full ml-1"
          style={{ background: ai.enabled ? "var(--success)" : "var(--muted-foreground)" }} />
        <span className="text-[0.7rem] text-muted-foreground truncate">
          {ai.enabled ? `${ai.providerId} · ${ai.model}` : "AI off"}
        </span>
        <div className="ml-auto flex items-center gap-0.5">
          <Button
            variant="ghost" size="icon" className="size-7 hidden md:inline-flex"
            aria-label={collapsed ? "Expand" : "Collapse"}
            onClick={() => setCollapsed((c) => !c)}
          >
            {collapsed ? <Maximize2 className="size-3.5" /> : <Minus className="size-3.5" />}
          </Button>
          <Button
            variant="ghost" size="icon" className="size-7"
            aria-label="Close" onClick={() => setOpen(false)}
          >
            <X className="size-3.5" />
          </Button>
        </div>
      </header>

      {(!collapsed || isMobile) && (
        <div className="flex-1 min-h-0 flex flex-col">
          <Suspense fallback={
            <div className="flex-1 grid place-items-center text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
            </div>
          }>
            <ChatBody />
          </Suspense>
        </div>
      )}
    </div>
  );
}
