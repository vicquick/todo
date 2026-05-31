import { Plus, Trash2, ListChecks, Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
// import { Logo } from "./Logo";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useState } from "react";

export type TodoList = {
  id: string;
  name: string;
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
  loading?: boolean;
  creating?: boolean;
  error?: string | null;
};

export function Sidebar({
  lists,
  selectedId,
  onSelect,
  onDelete,
  onCreate,
  loading,
  creating,
  error,
}: Props) {
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);
  const trimmed = name.trim();
  const invalid = touched && trimmed.length === 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!trimmed) return;
    onCreate(trimmed);
    setName("");
    setTouched(false);
  };

  return (
    <aside className="h-full flex flex-col bg-sidebar border-r border-sidebar-border">
      <div className="px-5 pt-5 pb-4">{/* <Logo /> */}</div>

      <form onSubmit={submit} className="px-4 pb-3">
        <label htmlFor="new-list" className="sr-only">
          New list name
        </label>
        <div
          className={`group flex items-center gap-2 rounded-lg bg-input-background border transition-colors ${
            invalid
              ? "border-destructive/60"
              : "border-transparent focus-within:border-ring/60"
          }`}
        >
          <Input
            id="new-list"
            placeholder="New list…"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (touched) setTouched(false);
            }}
            disabled={creating}
            className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-3"
            maxLength={64}
          />
          <Button
            type="submit"
            size="sm"
            disabled={creating || !trimmed}
            className="m-1 h-8 px-2.5"
            aria-label="Create list"
          >
            {creating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
          </Button>
        </div>
        {invalid && (
          <p className="mt-1.5 text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="size-3.5" /> List name can&apos;t be empty.
          </p>
        )}
      </form>

      <div className="px-5 pt-2 pb-1.5 flex items-center justify-between">
        <span className="text-[0.65rem] tracking-[0.2em] uppercase text-muted-foreground">
          Your Lists
        </span>
        <span className="font-mono text-[0.7rem] text-muted-foreground">
          {lists.length}
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-2.5 pb-4">
        {loading && lists.length === 0 ? (
          <SidebarSkeleton />
        ) : error ? (
          <div className="m-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <div className="flex items-center gap-1.5 text-destructive font-medium">
              <AlertCircle className="size-4" /> Couldn&apos;t load lists
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{error}</p>
          </div>
        ) : lists.length === 0 ? (
          <div className="m-3 rounded-lg border border-dashed border-sidebar-border p-4 text-center">
            <ListChecks className="mx-auto size-5 text-muted-foreground" />
            <p className="mt-2 text-sm">No lists yet</p>
            <p className="text-xs text-muted-foreground">
              Create your first list above.
            </p>
          </div>
        ) : (
          <ul className="space-y-0.5">
            <AnimatePresence initial={false}>
              {lists.map((l) => {
                const active = l.id === selectedId;
                return (
                  <motion.li
                    key={l.id}
                    layout
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                  >
                    <button
                      onClick={() => onSelect(l.id)}
                      className={`group relative w-full text-left rounded-lg pl-3.5 pr-2 py-2.5 flex items-center gap-3 transition-colors ${
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "hover:bg-sidebar-accent/60 text-sidebar-foreground"
                      }`}
                    >
                      <span
                        aria-hidden
                        className={`absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full transition-opacity ${active ? "opacity-100" : "opacity-0"}`}
                        style={{ background: accentVar[l.accent] }}
                      />
                      <span
                        aria-hidden
                        className="size-2 rounded-full shrink-0"
                        style={{
                          background: accentVar[l.accent],
                          boxShadow: active
                            ? `0 0 0 3px color-mix(in oklab, ${accentVar[l.accent]} 22%, transparent)`
                            : "none",
                        }}
                      />
                      <span className="flex-1 truncate text-[0.92rem]">
                        {l.name}
                      </span>
                      <span className="font-mono text-[0.7rem] text-muted-foreground tabular-nums">
                        {l.completedCount}/{l.itemCount}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(l.id);
                        }}
                        aria-label={`Delete list ${l.name}`}
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity rounded-md p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </button>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </nav>

      <Footer />
    </aside>
  );
}

function SidebarSkeleton() {
  return (
    <ul className="space-y-1 px-1.5 pt-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 rounded-lg px-3 py-2.5">
          <span className="size-2 rounded-full bg-muted animate-pulse" />
          <span
            className="h-3 flex-1 rounded bg-muted animate-pulse"
            style={{ width: `${50 + ((i * 13) % 40)}%` }}
          />
          <span className="h-3 w-8 rounded bg-muted animate-pulse" />
        </li>
      ))}
    </ul>
  );
}

function Footer() {
  return (
    <div className="mt-auto border-t border-sidebar-border px-5 py-3 flex items-center justify-between text-[0.7rem] text-muted-foreground font-mono">
      <span>v0.0.0</span>
      <span className="flex items-center gap-1.5">
        {/* <span
          className="size-1.5 rounded-full"
          style={{ background: "var(--success)" }}
        />
        synced */}
      </span>
    </div>
  );
}
