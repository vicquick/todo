/**
 * Kanban board view — three columns (To do / In progress / Done), cards are
 * the project's root tasks, drag between columns patches status + position.
 * Subtasks stay in the list view; parents carry an n/m chip here.
 */
import { useDrag, useDrop } from "react-dnd";
import { Calendar, CornerDownRight, Repeat } from "lucide-react";
import type { TodoItem, ItemPatch } from "./MainPanel";
import { PriorityChip } from "./Chips";

const DND_CARD = "kanban-card";

export type BoardStatus = "todo" | "doing" | "done";

const COLUMNS: { key: BoardStatus; title: string; tone: string }[] = [
  { key: "todo", title: "To do", tone: "var(--gb-blue)" },
  { key: "doing", title: "In progress", tone: "var(--gb-yellow)" },
  { key: "done", title: "Done", tone: "var(--gb-green)" },
];

type Props = {
  items: TodoItem[]; // root tasks only
  childrenByParent: Record<string, TodoItem[]>;
  accent: string;
  onMove: (id: string, status: BoardStatus, position: number) => void;
  onToggle: (id: string) => void;
};

export function Board({ items, childrenByParent, accent, onMove, onToggle }: Props) {
  const byCol: Record<BoardStatus, TodoItem[]> = { todo: [], doing: [], done: [] };
  for (const it of items) {
    const s = (it.status ?? (it.checked ? "done" : "todo")) as BoardStatus;
    (byCol[s] ?? byCol.todo).push(it);
  }
  for (const k of Object.keys(byCol) as BoardStatus[]) {
    byCol[k].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }

  // Tap-to-move: append to the end of the destination column.
  const setStatus = (id: string, status: BoardStatus) => {
    const maxPos = byCol[status].reduce((m, c) => Math.max(m, c.position ?? 0), 0);
    onMove(id, status, maxPos + 1);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
      {COLUMNS.map((col) => (
        <Column
          key={col.key}
          column={col}
          cards={byCol[col.key]}
          childrenByParent={childrenByParent}
          accent={accent}
          onMove={onMove}
          onToggle={onToggle}
          onSetStatus={setStatus}
        />
      ))}
    </div>
  );
}

function Column({ column, cards, childrenByParent, accent, onMove, onToggle, onSetStatus }: {
  column: { key: BoardStatus; title: string; tone: string };
  cards: TodoItem[];
  childrenByParent: Record<string, TodoItem[]>;
  accent: string;
  onMove: Props["onMove"];
  onToggle: Props["onToggle"];
  onSetStatus: (id: string, status: BoardStatus) => void;
}) {
  const [{ isOver, canDrop }, dropRef] = useDrop(
    () => ({
      accept: DND_CARD,
      drop: (dragged: { id: string }) => {
        const maxPos = cards.reduce((m, c) => Math.max(m, c.position ?? 0), 0);
        onMove(dragged.id, column.key, maxPos + 1);
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [cards, column.key, onMove],
  );

  return (
    <div
      ref={dropRef as any}
      className={`rounded-xl border p-2.5 min-h-[180px] transition-colors ${
        isOver && canDrop ? "border-ring/70 bg-accent/40" : "border-border bg-card/50"
      }`}
    >
      <div className="px-1.5 pb-2 flex items-center gap-2">
        <span aria-hidden className="size-2 rounded-full" style={{ background: column.tone }} />
        <span className="text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">{column.title}</span>
        <span className="ml-auto font-mono text-[0.7rem] text-muted-foreground tabular-nums">{cards.length}</span>
      </div>
      <div className="space-y-2">
        {cards.map((it) => (
          <Card key={it.id} item={it} kids={childrenByParent[it.id] ?? []} accent={accent}
            current={column.key} onToggle={onToggle} onSetStatus={onSetStatus} />
        ))}
        {cards.length === 0 && (
          <div className="rounded-lg border border-dashed border-border-strong/60 px-3 py-6 text-center text-xs text-muted-foreground">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ item, kids, accent, current, onToggle, onSetStatus }: {
  item: TodoItem;
  kids: TodoItem[];
  accent: string;
  current: BoardStatus;
  onToggle: (id: string) => void;
  onSetStatus: (id: string, status: BoardStatus) => void;
}) {
  const [{ isDragging }, dragRef] = useDrag(
    () => ({
      type: DND_CARD,
      item: { id: item.id },
      collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    }),
    [item.id],
  );

  const due = item.deadline ? new Date(item.deadline) : null;
  const overdue = !!due && !item.checked && due.getTime() < Date.now();

  return (
    <div
      ref={dragRef as any}
      className={`rounded-lg border border-border bg-card px-3 py-2.5 shadow-soft-sm cursor-grab active:cursor-grabbing touch-none select-none ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          onClick={() => onToggle(item.id)}
          aria-label={item.checked ? "Mark incomplete" : "Mark complete"}
          className="mt-0.5 size-3.5 rounded border shrink-0"
          style={{
            borderColor: item.checked ? accent : "var(--border-strong)",
            background: item.checked ? accent : "transparent",
          }}
        />
        <span className={`text-sm leading-snug ${item.checked ? "text-muted-foreground line-through" : ""}`}>
          {item.label}
        </span>
      </div>
      {(item.priority || due || kids.length > 0 || item.recurrence) && (
        <div className="mt-1.5 ml-5 flex items-center gap-1.5 flex-wrap">
          {kids.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[0.65rem] font-mono text-muted-foreground">
              <CornerDownRight className="size-3" /> {kids.filter((k) => k.checked).length}/{kids.length}
            </span>
          )}
          {due && (
            <span className={`inline-flex items-center gap-1 text-[0.65rem] font-mono ${overdue ? "text-destructive" : "text-muted-foreground"}`}>
              <Calendar className="size-3" /> {due.toLocaleDateString(undefined, { day: "numeric", month: "short" })}
            </span>
          )}
          {item.recurrence && <Repeat className="size-3 text-muted-foreground" />}
          {item.priority && <PriorityChip priority={item.priority} />}
        </div>
      )}

      {/* mobile: tap-to-move (dragging across stacked columns is awkward on a phone) */}
      <div className="mt-2 ml-5 flex items-center gap-1 sm:hidden" role="group" aria-label="Move to column">
        {COLUMNS.map((c) => {
          const active = c.key === current;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => !active && onSetStatus(item.id, c.key)}
              aria-pressed={active}
              aria-label={`Move to ${c.title}`}
              className={`flex-1 rounded-md px-1.5 py-1 text-[0.6rem] font-medium uppercase tracking-wide transition-colors ${
                active ? "text-foreground" : "text-muted-foreground/70 border border-transparent hover:bg-accent"
              }`}
              style={active ? { background: `color-mix(in oklab, ${c.tone} 16%, transparent)`, color: c.tone } : undefined}
            >
              {c.title}
            </button>
          );
        })}
      </div>
    </div>
  );
}
