/**
 * Quick Notes — a floating field notebook above the app.
 *
 * Capture meeting thoughts across many projects without leaving flow, then
 * sort afterwards: select a passage, send it to a project as one task or one
 * task per line. Notes persist in localStorage (backend sync is a later
 * tranche — see DESIGN.md).
 *
 * Toggle: notebook button in the top bar, or Ctrl/Cmd+J.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import {
  ListPlus,
  Loader2,
  NotebookPen,
  Paperclip,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "../ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import * as api from "../../api/client";
import type { TodoList } from "../todo/Sidebar";
import { useIsMobile } from "../ui/use-mobile";

// ───── persistence ─────────────────────────────────────────

type NoteTab = {
  id: string;
  body: string;
  createdAt: number;
  updatedAt: number;
};

type NotesState = {
  tabs: NoteTab[];
  activeId: string | null;
  pos: { x: number; y: number } | null;
  size: { w: number; h: number };
};

const STORE_KEY = "cairn.quicknotes.v1";

function loadState(): NotesState {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const s = JSON.parse(raw) as NotesState;
      if (Array.isArray(s.tabs)) return { size: { w: 540, h: 440 }, ...s };
    }
  } catch {}
  const first = newTab();
  return { tabs: [first], activeId: first.id, pos: null, size: { w: 540, h: 440 } };
}

function saveState(s: NotesState) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(s));
  } catch {}
}

function newTab(): NoteTab {
  const now = Date.now();
  return { id: Math.random().toString(36).slice(2, 10), body: "", createdAt: now, updatedAt: now };
}

function tabTitle(t: NoteTab): string {
  const line = t.body.split("\n").find((l) => l.trim());
  if (line) return line.trim().slice(0, 26);
  return new Date(t.createdAt).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

// ───── component ───────────────────────────────────────────

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wsId: string | null;
  projects: TodoList[];
  onTasksAdded: (projectId: string) => void;
};

export function QuickNotes({ open, onOpenChange, wsId, projects, onTasksAdded }: Props) {
  const isMobile = useIsMobile();
  const [state, setState] = useState<NotesState>(loadState);
  const [selRange, setSelRange] = useState<{ start: number; end: number } | null>(null);
  const [sendOpen, setSendOpen] = useState(false);
  const [perLine, setPerLine] = useState(true);
  const [sending, setSending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const winRef = useRef<HTMLDivElement | null>(null);

  const active = state.tabs.find((t) => t.id === state.activeId) ?? state.tabs[0] ?? null;

  // debounced persistence
  useEffect(() => {
    const h = setTimeout(() => saveState(state), 400);
    return () => clearTimeout(h);
  }, [state]);

  // Ctrl/Cmd+J toggles the notebook
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const updateActive = useCallback((body: string) => {
    setState((s) => ({
      ...s,
      tabs: s.tabs.map((t) =>
        t.id === s.activeId ? { ...t, body, updatedAt: Date.now() } : t,
      ),
    }));
  }, []);

  const addTab = () => {
    const t = newTab();
    setState((s) => ({ ...s, tabs: [...s.tabs, t], activeId: t.id }));
    setSelRange(null);
    setTimeout(() => taRef.current?.focus(), 50);
  };

  const removeActive = () => {
    setConfirmDelete(false);
    setState((s) => {
      const idx = s.tabs.findIndex((t) => t.id === s.activeId);
      const tabs = s.tabs.filter((t) => t.id !== s.activeId);
      const next = tabs.length ? tabs : [newTab()];
      const activeId = (next[Math.max(0, idx - 1)] ?? next[0]).id;
      return { ...s, tabs: next, activeId };
    });
    setSelRange(null);
  };

  // Keep the LAST real selection instead of clearing on collapse — tapping the
  // "To project…" button collapses the textarea selection before the click
  // lands (always on touch, sometimes on desktop), which used to wipe it
  // mid-tap. Stale offsets can't leak: edits clear selRange via onChange.
  const captureSelection = () => {
    const ta = taRef.current;
    if (!ta) return;
    const { selectionStart: start, selectionEnd: end } = ta;
    if (end > start) setSelRange({ start, end });
  };

  const selectionText = useMemo(() => {
    if (!active || !selRange) return "";
    return active.body.slice(selRange.start, selRange.end);
  }, [active, selRange]);

  // No selection → fall back to the whole note. Selecting in a textarea is
  // fiddly on a phone; the common case is "send everything I just captured".
  const sendText = selectionText.trim() ? selectionText : (active?.body ?? "");
  const usingWholeNote = !selectionText.trim();

  const sendToProject = async (project: TodoList) => {
    if (!wsId || !sendText.trim()) return;
    setSending(true);
    try {
      const labels = perLine
        ? sendText
            .split("\n")
            // strip list markers: "-", "*", "•", "1." / "1)", "[ ]" / "[x]" checkboxes
            .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])?\s*(?:\[[ xX]?\]\s*)?/, "").trim())
            .filter(Boolean)
        : [sendText.trim()];
      let created = 0;
      for (const raw of labels) {
        const label = raw.slice(0, 250);
        const description =
          !perLine && raw.length > 250 ? sendText.trim() : undefined;
        await api.createItem(wsId, project.id, { label, description: description ?? null });
        created++;
      }
      onTasksAdded(project.id);
      setSendOpen(false);
      toast.success(
        `${created} task${created === 1 ? "" : "s"} → “${project.name}”`,
        { description: "Captured from quick notes." },
      );
    } catch (e: any) {
      toast.error("Couldn't create tasks", { description: e?.message });
    } finally {
      setSending(false);
    }
  };

  // ── drag + resize ──
  const dragFrom = useRef<{ px: number; py: number; x: number; y: number } | null>(null);
  const sizeFrom = useRef<{ px: number; py: number; w: number; h: number } | null>(null);

  const startDrag = (e: React.PointerEvent) => {
    const el = winRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    dragFrom.current = { px: e.clientX, py: e.clientY, x: rect.left, y: rect.top };
    (e.target as Element).setPointerCapture(e.pointerId);
  };
  const onDrag = (e: React.PointerEvent) => {
    const d = dragFrom.current;
    if (!d) return;
    const x = Math.min(Math.max(8, d.x + e.clientX - d.px), window.innerWidth - 120);
    const y = Math.min(Math.max(8, d.y + e.clientY - d.py), window.innerHeight - 64);
    setState((s) => ({ ...s, pos: { x, y } }));
  };
  const endDrag = () => (dragFrom.current = null);

  const startResize = (e: React.PointerEvent) => {
    e.preventDefault();
    sizeFrom.current = { px: e.clientX, py: e.clientY, w: state.size.w, h: state.size.h };
    (e.target as Element).setPointerCapture(e.pointerId);
  };
  const onResize = (e: React.PointerEvent) => {
    const d = sizeFrom.current;
    if (!d) return;
    setState((s) => ({
      ...s,
      size: {
        w: Math.min(Math.max(380, d.w + e.clientX - d.px), window.innerWidth - 24),
        h: Math.min(Math.max(300, d.h + e.clientY - d.py), window.innerHeight - 24),
      },
    }));
  };
  const endResize = () => (sizeFrom.current = null);

  const pos = state.pos;
  const style: React.CSSProperties = isMobile
    ? { inset: 0, width: "100%", height: "100dvh", borderRadius: 0 }
    : pos
      ? { left: pos.x, top: pos.y, width: state.size.w, height: state.size.h }
      : { right: 24, bottom: 88, width: state.size.w, height: state.size.h };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={winRef}
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className="fixed z-40 flex flex-col rounded-xl border border-border-strong overflow-hidden shadow-soft-lg"
          style={{ ...style, background: "var(--card)" }}
          role="dialog"
          aria-label="Quick notes"
        >
          {/* header — drag handle */}
          <div
            className={`flex items-center gap-2.5 px-3.5 h-11 shrink-0 select-none border-b border-border ${isMobile ? "" : "cursor-grab active:cursor-grabbing"}`}
            style={{ background: "color-mix(in oklab, var(--gb-yellow) 9%, var(--card))" }}
            onPointerDown={isMobile ? undefined : startDrag}
            onPointerMove={isMobile ? undefined : onDrag}
            onPointerUp={isMobile ? undefined : endDrag}
          >
            <NotebookPen className="size-4" style={{ color: "var(--gb-yellow-s, var(--warning))" }} />
            <span className="font-display text-[0.95rem] leading-none">Quick notes</span>
            <span className="font-mono text-[0.65rem] text-muted-foreground mt-0.5">
              {active ? new Date(active.updatedAt).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }) : ""}
            </span>
            <div className="flex-1" />
            <span className="hidden sm:block font-mono text-[0.62rem] text-muted-foreground">⌘J</span>
            <button
              onClick={() => onOpenChange(false)}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label="Close quick notes"
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="flex flex-1 min-h-0">
            {/* editor */}
            <div className="flex-1 min-w-0 flex flex-col">
              <textarea
                ref={taRef}
                value={active?.body ?? ""}
                onChange={(e) => { updateActive(e.target.value); setSelRange(null); }}
                onSelect={captureSelection}
                placeholder={"Capture now, sort later…\nSelect a passage to turn it into tasks."}
                spellCheck={false}
                className="flex-1 w-full resize-none outline-none bg-transparent text-[0.92rem] text-foreground placeholder:text-muted-foreground/70"
                style={{
                  lineHeight: "28px",
                  padding: "6px 16px 16px 56px",
                  caretColor: "var(--primary)",
                  backgroundImage: [
                    // red margin line, classic notebook
                    "linear-gradient(to right, transparent 43px, color-mix(in oklab, var(--gb-red) 26%, transparent) 43px, color-mix(in oklab, var(--gb-red) 26%, transparent) 44.5px, transparent 44.5px)",
                    // ruled lines that scroll with the text
                    "repeating-linear-gradient(to bottom, transparent 0px, transparent 27px, var(--border) 27px, var(--border) 28px)",
                  ].join(", "),
                  backgroundAttachment: "local, local",
                  backgroundOrigin: "padding-box",
                }}
              />

              {/* toolbar */}
              <div className="flex items-center gap-1.5 px-2.5 h-11 shrink-0 border-t border-border bg-background/40">
                <Popover open={sendOpen} onOpenChange={(o) => { if (o) captureSelection(); setSendOpen(o); }}>
                  <PopoverTrigger asChild>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="gap-1.5 h-8"
                      disabled={!sendText.trim() || !wsId}
                      title={
                        !sendText.trim()
                          ? "Write something first"
                          : usingWholeNote
                            ? "Send the whole note to a project"
                            : "Send selection to a project"
                      }
                    >
                      <ListPlus className="size-3.5" />
                      To project…
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent side="top" align="start" className="w-64 p-2">
                    <div className="px-1.5 pb-2 flex items-center justify-between">
                      <span className="text-[0.65rem] tracking-[0.18em] uppercase text-muted-foreground">
                        {usingWholeNote ? "Send whole note" : "Send selection"}
                      </span>
                      <button
                        className="font-mono text-[0.66rem] px-1.5 py-0.5 rounded border border-border hover:bg-accent"
                        onClick={() => setPerLine((p) => !p)}
                        title="Toggle how the selection becomes tasks"
                      >
                        {perLine ? "task per line" : "single task"}
                      </button>
                    </div>
                    <div className="max-h-52 overflow-y-auto space-y-0.5">
                      {projects.length === 0 && (
                        <p className="px-2 py-3 text-sm text-muted-foreground">No projects yet.</p>
                      )}
                      {projects.map((p) => (
                        <button
                          key={p.id}
                          disabled={sending}
                          onClick={() => sendToProject(p)}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-sm hover:bg-accent disabled:opacity-50"
                        >
                          <span className="size-2.5 rounded-full shrink-0" style={{ background: `var(--gb-${p.accent})` }} />
                          <span className="truncate flex-1">{p.name}</span>
                          {sending && <Loader2 className="size-3 animate-spin" />}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                <Button size="sm" variant="ghost" className="h-8 px-2 text-muted-foreground" disabled
                  title="Files & scribbles — coming soon">
                  <Paperclip className="size-3.5" />
                </Button>

                <div className="flex-1" />

                {confirmDelete ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">Delete note?</span>
                    <Button size="sm" variant="destructive" className="h-7 px-2 text-xs" onClick={removeActive}>Yes</Button>
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setConfirmDelete(false)}>No</Button>
                  </div>
                ) : (
                  <Button size="sm" variant="ghost" className="h-8 px-2 text-muted-foreground hover:text-destructive"
                    onClick={() => setConfirmDelete(true)} aria-label="Delete this note">
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
            </div>

            {/* vertical register tabs */}
            <nav
              className="w-10 shrink-0 flex flex-col items-stretch gap-1 py-2 px-1 border-l border-border overflow-y-auto"
              style={{ background: "color-mix(in oklab, var(--gb-bg1, var(--secondary)) 55%, var(--card))" }}
              aria-label="Note tabs"
            >
              <button
                onClick={addTab}
                aria-label="New note"
                className="grid place-items-center h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent shrink-0"
              >
                <Plus className="size-4" />
              </button>
              {state.tabs.map((t) => {
                const isActive = t.id === active?.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => { setState((s) => ({ ...s, activeId: t.id })); setSelRange(null); }}
                    className={[
                      "rounded-md px-0.5 py-2 min-h-[64px] max-h-36 flex items-start justify-center shrink-0 transition-colors",
                      isActive
                        ? "bg-card text-foreground border border-border-strong shadow-soft-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent",
                    ].join(" ")}
                    title={tabTitle(t)}
                  >
                    <span
                      className="text-[0.7rem] font-medium truncate"
                      style={{ writingMode: "vertical-rl", maxHeight: "8.2rem", letterSpacing: "0.02em" }}
                    >
                      {tabTitle(t)}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* resize handle */}
          <div
            onPointerDown={startResize}
            onPointerMove={onResize}
            onPointerUp={endResize}
            className="absolute bottom-0 right-0 size-4 cursor-nwse-resize hidden md:block"
            style={{
              background:
                "linear-gradient(135deg, transparent 50%, var(--border-strong, rgba(0,0,0,0.25)) 50%)",
              borderBottomRightRadius: "0.7rem",
            }}
            aria-hidden
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
