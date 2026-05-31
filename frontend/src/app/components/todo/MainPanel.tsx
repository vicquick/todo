import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Trash2,
  Loader2,
  Check,
  // MoreHorizontal,
  // Calendar,
  Filter as FilterIcon,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import type { TodoList } from "./Sidebar";
import { LoadingPanel, EmptyItems, ErrorPanel } from "./States";

export type TodoItem = {
  id: string;
  label: string;
  checked: boolean;
  pending?: boolean;
};

type Filter = "all" | "active" | "done";

type Props = {
  list: TodoList;
  items: TodoItem[];
  loading?: boolean;
  error?: string | null;
  onAdd: (label: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onRetry?: () => void;
  onDeleteList: () => void;
  adding?: boolean;
};

const accentVar: Record<TodoList["accent"], string> = {
  orange: "var(--gb-orange)",
  aqua: "var(--gb-aqua)",
  purple: "var(--gb-purple)",
  blue: "var(--gb-blue)",
  yellow: "var(--gb-yellow)",
  green: "var(--gb-green)",
};

export function MainPanel({
  list,
  items,
  loading,
  error,
  onAdd,
  onToggle,
  onDelete,
  onRetry,
  onDeleteList,
  adding,
}: Props) {
  const [label, setLabel] = useState("");
  const [touched, setTouched] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const trimmed = label.trim();
  const invalid = touched && trimmed.length === 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!trimmed) return;
    onAdd(trimmed);
    setLabel("");
    setTouched(false);
  };

  const filtered = useMemo(() => {
    if (filter === "active") return items.filter((i) => !i.checked);
    if (filter === "done") return items.filter((i) => i.checked);
    return items;
  }, [items, filter]);

  const completed = items.filter((i) => i.checked).length;
  const progress =
    items.length === 0 ? 0 : Math.round((completed / items.length) * 100);

  return (
    <section className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 md:px-10 py-8 md:py-12">
        {/* Header */}
        <header className="flex items-start gap-4 flex-wrap">
          <div
            aria-hidden
            className="size-11 rounded-xl shrink-0 shadow-soft-sm"
            style={{
              background: `linear-gradient(135deg, ${accentVar[list.accent]} 0%, color-mix(in oklab, ${accentVar[list.accent]} 60%, var(--gb-bg2)) 100%)`,
            }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <span>List</span>
              <span className="font-mono normal-case tracking-normal">
                / {list.id.slice(0, 6)}
              </span>
            </div>
            <h1 className="mt-1 truncate">{list.name}</h1>
            <div className="mt-1 text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
              <span>
                <span className="font-mono tabular-nums text-foreground">
                  {completed}
                </span>{" "}
                of{" "}
                <span className="font-mono tabular-nums text-foreground">
                  {items.length}
                </span>{" "}
                complete
              </span>
              <span aria-hidden>·</span>
              {/* <span className="inline-flex items-center gap-1">
                <Calendar className="size-3.5" /> updated just now
              </span> */}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive"
              onClick={onDeleteList}
            >
              <Trash2 className="size-4" /> Delete list
            </Button>
            {/* <Button variant="ghost" size="icon" aria-label="More" className="text-muted-foreground">
              <MoreHorizontal className="size-4" />
            </Button> */}
          </div>
        </header>

        {/* Progress bar */}
        <div className="mt-5">
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: accentVar[list.accent] }}
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 140, damping: 22 }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[0.7rem] font-mono text-muted-foreground tabular-nums">
            <span>{progress}% done</span>
            <span>{items.length - completed} remaining</span>
          </div>
        </div>

        {/* Add item form */}
        <form onSubmit={submit} className="mt-7">
          <div
            className={`flex items-center gap-2 rounded-xl bg-card border shadow-soft-sm transition-colors ${
              invalid
                ? "border-destructive/60"
                : "border-border focus-within:border-ring/60"
            }`}
          >
            <span className="pl-4 text-muted-foreground">
              <Plus className="size-4" />
            </span>
            <Input
              placeholder="Add a task and press Enter…"
              value={label}
              onChange={(e) => {
                setLabel(e.target.value);
                if (touched) setTouched(false);
              }}
              disabled={adding}
              maxLength={140}
              className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-2 h-12"
            />
            <Button
              type="submit"
              disabled={adding || !trimmed}
              className="m-1.5 h-9 gap-1.5"
            >
              {adding ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              Add
            </Button>
          </div>
          {invalid && (
            <p className="mt-2 text-xs text-destructive">
              Task can&apos;t be empty.
            </p>
          )}
        </form>

        {/* Filter chips */}
        <div className="mt-6 flex items-center gap-1 text-sm">
          <FilterIcon className="size-3.5 text-muted-foreground mr-1.5" />
          {(["all", "active", "done"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`capitalize px-2.5 py-1 rounded-md transition-colors font-medium ${
                filter === f
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              {f}
              <span className="ml-1.5 font-mono text-[0.7rem] text-muted-foreground tabular-nums">
                {f === "all"
                  ? items.length
                  : f === "active"
                    ? items.length - completed
                    : completed}
              </span>
            </button>
          ))}
        </div>

        {/* Items */}
        <div className="mt-3">
          {loading ? (
            <LoadingPanel />
          ) : error ? (
            <ErrorPanel message={error} onRetry={onRetry} />
          ) : items.length === 0 ? (
            <EmptyItems listName={list.name} />
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border-strong bg-card/40 px-6 py-10 text-center text-sm text-muted-foreground">
              No tasks match this filter.
            </div>
          ) : (
            <ul className="space-y-1.5">
              <AnimatePresence initial={false}>
                {filtered.map((it) => (
                  <ItemRow
                    key={it.id}
                    item={it}
                    accent={accentVar[list.accent]}
                    onToggle={() => onToggle(it.id)}
                    onDelete={() => onDelete(it.id)}
                  />
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>

        {/* Footer hint */}
        {/* <p className="mt-10 text-center text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground/70 font-mono">
          ⌘K command · N new list · / focus search
        </p> */}
      </div>
    </section>
  );
}

function ItemRow({
  item,
  accent,
  onToggle,
  onDelete,
}: {
  item: TodoItem;
  accent: string;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{
        opacity: 0,
        x: 12,
        height: 0,
        marginTop: 0,
        paddingTop: 0,
        paddingBottom: 0,
      }}
      transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
      className="group rounded-xl border border-border bg-card px-4 py-3 flex items-center gap-3 shadow-soft-sm hover:shadow-soft-md transition-shadow"
    >
      <button
        onClick={onToggle}
        aria-pressed={item.checked}
        aria-label={
          item.checked
            ? `Mark ${item.label} incomplete`
            : `Mark ${item.label} complete`
        }
        className="relative size-5 rounded-md border grid place-items-center transition-all"
        style={{
          borderColor: item.checked ? accent : "var(--border-strong)",
          background: item.checked ? accent : "transparent",
        }}
      >
        <AnimatePresence>
          {item.checked && (
            <motion.span
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="text-primary-foreground"
            >
              <Check className="size-3.5" strokeWidth={3} />
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <span
        className={`flex-1 text-[0.95rem] truncate transition-all ${
          item.checked
            ? "text-muted-foreground line-through decoration-1"
            : "text-foreground"
        }`}
      >
        {item.label}
      </span>

      {item.pending && (
        <Loader2 className="size-3.5 text-muted-foreground animate-spin" />
      )}

      <button
        onClick={onDelete}
        aria-label={`Delete task ${item.label}`}
        className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="size-3.5" />
      </button>
    </motion.li>
  );
}
