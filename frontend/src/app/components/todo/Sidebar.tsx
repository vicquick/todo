import { Plus, Trash2, ListChecks, Loader2, AlertCircle, Pencil, MoreHorizontal, Settings, LogOut, Check, X, Plug } from "lucide-react";
import { useAI } from "../../state/AIContext";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../../auth/AuthContext";

export type TodoList = {
  id: string;
  name: string;
  description?: string | null;
  itemCount: number;
  completedCount: number;
  accent: "orange" | "aqua" | "purple" | "blue" | "yellow" | "green";
};

const accentVar: Record<TodoList["accent"], string> = {
  orange: "var(--gb-orange)",
  aqua: "var(--gb-aqua)",
  purple: "var(--gb-purple)",
  blue: "var(--gb-blue)",
  yellow: "var(--gb-yellow)",
  green: "var(--gb-green)",
};

type Props = {
  lists: TodoList[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onCreate: (name: string) => void;
  onRename: (id: string, name: string) => void;
  loading?: boolean;
  creating?: boolean;
  error?: string | null;
  onLogout: () => void;
  disabled?: boolean;
};

export function Sidebar({ lists, selectedId, onSelect, onDelete, onCreate, onRename, loading, creating, error, onLogout, disabled }: Props) {
  const { user } = useAuth();
  const { mcp, privacy } = useAI();
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const trimmed = name.trim();
  const invalid = touched && trimmed.length === 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!trimmed || disabled) return;
    onCreate(trimmed);
    setName("");
    setTouched(false);
  };

  const initial = user?.username?.[0]?.toUpperCase() ?? "?";

  return (
    <aside className="h-full flex flex-col bg-sidebar border-r border-sidebar-border">
      {/* User header (non-interactive) */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-2.5">
        <div
          className="size-9 rounded-[10px] grid place-items-center text-primary-foreground font-display shadow-soft-sm shrink-0"
          style={{ background: "linear-gradient(135deg, var(--gb-orange) 0%, var(--gb-purple) 100%)" }}
        >
          {initial}
        </div>
        <div className="leading-tight min-w-0 flex-1">
          <div className="truncate text-[0.95rem]">{user?.username ?? "—"}</div>
          <div className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground truncate">
            Cairn workspace
          </div>
        </div>
      </div>

      <form onSubmit={submit} className="px-4 pb-3">
        <label htmlFor="new-list" className="sr-only">New project name</label>
        <div
          className={`group flex items-center gap-2 rounded-lg bg-input-background border transition-colors ${
            invalid ? "border-destructive/60" : "border-transparent focus-within:border-ring/60"
          } ${disabled ? "opacity-50" : ""}`}
        >
          <Input
            id="new-list"
            placeholder={disabled ? "Create a workspace first…" : "New project…"}
            value={name}
            onChange={(e) => { setName(e.target.value); if (touched) setTouched(false); }}
            disabled={creating || disabled}
            className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-3"
            maxLength={50}
          />
          <Button type="submit" size="sm" disabled={creating || !trimmed || disabled}
            className="m-1 h-8 px-2.5" aria-label="Create list">
            {creating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          </Button>
        </div>
        {invalid && (
          <p className="mt-1.5 text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="size-3.5" /> List name can&apos;t be empty.
          </p>
        )}
      </form>

      <div className="px-4 pb-3">
        <WorkspaceSwitcher />
      </div>

      {mcp.enabled && privacy.allowExternalMcp && (
        <div className="px-2.5 pb-2 space-y-0.5">
          <Link to="/mcp"
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent/60 transition-colors">
            <Plug className="size-4 text-muted-foreground" />
            <span className="flex-1 truncate">MCP Tools</span>
          </Link>
        </div>
      )}

      <div className="px-5 pt-2 pb-1.5 flex items-center justify-between">
        <span className="text-[0.65rem] tracking-[0.2em] uppercase text-muted-foreground">Projects</span>
        <span className="font-mono text-[0.7rem] text-muted-foreground">{lists.length}</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-2.5 pb-4">
        {loading && lists.length === 0 ? (
          <SidebarSkeleton />
        ) : error ? (
          <div className="m-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <div className="flex items-center gap-1.5 text-destructive font-medium">
              <AlertCircle className="size-4" /> Couldn&apos;t load projects
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{error}</p>
          </div>
        ) : lists.length === 0 ? (
          <div className="m-3 rounded-lg border border-dashed border-sidebar-border p-4 text-center">
            <ListChecks className="mx-auto size-5 text-muted-foreground" />
            <p className="mt-2 text-sm">No projects yet</p>
            <p className="text-xs text-muted-foreground">Create your first project above.</p>
          </div>
        ) : (
          <ul className="space-y-0.5">
            <AnimatePresence initial={false}>
              {lists.map((l) => {
                const active = l.id === selectedId;
                const isRenaming = renamingId === l.id;
                return (
                  <motion.li
                    key={l.id}
                    layout
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                  >
                    {isRenaming ? (
                      <RenameRow
                        accent={accentVar[l.accent]}
                        initial={l.name}
                        onCancel={() => setRenamingId(null)}
                        onSave={(name) => { onRename(l.id, name); setRenamingId(null); }}
                      />
                    ) : (
                      <div
                        className={`group relative w-full rounded-lg pl-3.5 pr-1.5 py-2.5 flex items-center gap-3 transition-colors cursor-pointer ${
                          active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/60 text-sidebar-foreground"
                        }`}
                        onClick={() => onSelect(l.id)}
                      >
                        <span aria-hidden
                          className={`absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full transition-opacity ${active ? "opacity-100" : "opacity-0"}`}
                          style={{ background: accentVar[l.accent] }} />
                        <span aria-hidden className="size-2 rounded-full shrink-0"
                          style={{ background: accentVar[l.accent], boxShadow: active ? `0 0 0 3px color-mix(in oklab, ${accentVar[l.accent]} 22%, transparent)` : "none" }} />
                        <span className="flex-1 truncate text-[0.92rem]">{l.name}</span>
                        <span className="font-mono text-[0.7rem] text-muted-foreground tabular-nums">
                          {l.completedCount}/{l.itemCount}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button onClick={(e) => e.stopPropagation()} aria-label={`More for ${l.name}`}
                              className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted/60">
                              <MoreHorizontal className="size-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem onClick={() => setRenamingId(l.id)}>
                              <Pencil className="size-4" /> Rename
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onDelete(l.id)} className="text-destructive focus:text-destructive">
                              <Trash2 className="size-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </nav>

      <Footer onLogout={onLogout} />
    </aside>
  );
}

function RenameRow({ accent, initial, onSave, onCancel }: {
  accent: string; initial: string; onSave: (name: string) => void; onCancel: () => void;
}) {
  const [val, setVal] = useState(initial);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.select(); }, []);
  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const t = val.trim();
    if (!t || t === initial) { onCancel(); return; }
    onSave(t);
  };
  return (
    <form onSubmit={submit} className="flex items-center gap-2 rounded-lg pl-3.5 pr-1.5 py-1.5 bg-sidebar-accent">
      <span aria-hidden className="size-2 rounded-full shrink-0" style={{ background: accent }} />
      <Input ref={ref} value={val} onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Escape") onCancel(); }}
        maxLength={50}
        className="h-7 px-2 bg-input-background border-border" />
      <Button type="submit" size="icon" variant="ghost" className="size-7" aria-label="Save"><Check className="size-3.5" /></Button>
      <Button type="button" size="icon" variant="ghost" className="size-7" aria-label="Cancel" onClick={onCancel}><X className="size-3.5" /></Button>
    </form>
  );
}

function SidebarSkeleton() {
  return (
    <ul className="space-y-1 px-1.5 pt-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 rounded-lg px-3 py-2.5">
          <span className="size-2 rounded-full bg-muted animate-pulse" />
          <span className="h-3 flex-1 rounded bg-muted animate-pulse" style={{ width: `${50 + (i * 13) % 40}%` }} />
          <span className="h-3 w-8 rounded bg-muted animate-pulse" />
        </li>
      ))}
    </ul>
  );
}

function Footer({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="mt-auto border-t border-sidebar-border px-3 py-2 flex items-center justify-between">
      <span className="font-mono text-[0.7rem] text-muted-foreground px-1">v0.1.0</span>
      <div className="flex items-center gap-0.5">
        <Link
          to="/settings"
          className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60 transition-colors"
          aria-label="Settings"
          title="Settings"
        >
          <Settings className="size-4" />
        </Link>
        <button
          onClick={onLogout}
          className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-sidebar-accent/60 transition-colors"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </div>
  );
}
