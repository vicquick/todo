/**
 * Gantt / timeline view — horizontal day axis, one row per root task.
 * Bars run from creation (clamped to view start) to deadline; tasks without
 * a deadline appear as a marker on today. Milestones render as vertical
 * stripes with flags. Pure CSS/absolute positioning, no chart dependency.
 */
import { Flag } from "lucide-react";
import type { TodoItem } from "./MainPanel";
import type { Milestone } from "../../api/client";
import { useIsMobile } from "../ui/use-mobile";

const ROW_H = 36;

const MS_DAY = 86400000;

function day(d: Date): number {
  return Math.floor(d.getTime() / MS_DAY);
}

const COLOR: Record<string, string> = {
  orange: "var(--gb-orange)", aqua: "var(--gb-aqua)", purple: "var(--gb-purple)",
  blue: "var(--gb-blue)", yellow: "var(--gb-yellow)", green: "var(--gb-green)",
};

type Props = {
  items: TodoItem[]; // root tasks
  milestones: Milestone[];
  accent: string;
};

export function Gantt({ items, milestones, accent }: Props) {
  const isMobile = useIsMobile();
  const DAY_W = isMobile ? 26 : 34;
  const LABEL_W = isMobile ? 116 : 220;
  const today = day(new Date());
  const dates: number[] = [today];
  for (const i of items) if (i.deadline) dates.push(day(new Date(i.deadline)));
  for (const m of milestones) dates.push(day(new Date(m.date)));

  let start = Math.min(...dates) - 2;
  let end = Math.max(...dates) + 3;
  if (end - start < 14) end = start + 14;
  if (end - start > 180) start = end - 180; // sanity cap

  const days: number[] = [];
  for (let d = start; d <= end; d++) days.push(d);
  const width = days.length * DAY_W;

  const x = (d: number) => (d - start) * DAY_W;

  const rows = [...items].sort((a, b) => {
    const da = a.deadline ? day(new Date(a.deadline)) : today;
    const db = b.deadline ? day(new Date(b.deadline)) : today;
    return da - db;
  });

  const fmtDay = (d: number) => new Date(d * MS_DAY);

  // month spans for the header
  const months: { label: string; span: number }[] = [];
  for (const d of days) {
    const label = fmtDay(d).toLocaleDateString(undefined, { month: "short", year: "2-digit" });
    if (months.length && months[months.length - 1].label === label) months[months.length - 1].span++;
    else months.push({ label, span: 1 });
  }

  return (
    <div className="rounded-xl border border-border bg-card/50 overflow-x-auto">
      <div style={{ width: LABEL_W + width, minWidth: "100%" }}>
        {/* month header */}
        <div className="flex border-b border-border sticky top-0">
          <div className="shrink-0 sticky left-0 z-20 bg-card border-r border-border" style={{ width: LABEL_W }} />
          {months.map((m, i) => (
            <div key={i} className="text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground px-2 py-1 border-r border-border/50"
              style={{ width: m.span * DAY_W, flexShrink: 0 }}>
              {m.label}
            </div>
          ))}
        </div>
        {/* day header */}
        <div className="flex border-b border-border">
          <div className="shrink-0 sticky left-0 z-20 bg-card border-r border-border px-3 py-1 text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground"
            style={{ width: LABEL_W }}>
            Task
          </div>
          {days.map((d) => {
            const date = fmtDay(d);
            const isToday = d === today;
            const weekend = [0, 6].includes(date.getUTCDay());
            return (
              <div key={d}
                className={`shrink-0 text-center py-1 font-mono text-[0.65rem] tabular-nums border-r border-border/30 ${
                  isToday ? "text-primary font-bold" : weekend ? "text-muted-foreground/50" : "text-muted-foreground"
                }`}
                style={{ width: DAY_W, background: weekend ? "color-mix(in oklab, var(--muted) 55%, transparent)" : undefined }}>
                {date.getUTCDate()}
              </div>
            );
          })}
        </div>

        {/* rows */}
        <div className="relative">
          {/* today line */}
          <div aria-hidden className="absolute top-0 bottom-0 w-[2px] z-10 pointer-events-none"
            style={{ left: LABEL_W + x(today) + DAY_W / 2, background: "var(--primary)" }} />
          {/* milestone stripes */}
          {milestones.map((m) => {
            const md = day(new Date(m.date));
            if (md < start || md > end) return null;
            const c = COLOR[m.color ?? ""] ?? "var(--gb-purple)";
            return (
              <div key={m.id} aria-hidden className="absolute top-0 bottom-0 z-10 pointer-events-none"
                style={{ left: LABEL_W + x(md) + DAY_W / 2 - 1 }}>
                <div className="h-full w-[3px] opacity-60" style={{ background: c }} />
                <div className="absolute top-1 left-1.5 flex items-center gap-1 rounded px-1 py-0.5 text-[0.6rem] font-medium whitespace-nowrap"
                  style={{ background: `color-mix(in oklab, ${c} 18%, var(--card))`, color: c }}>
                  <Flag className="size-2.5" /> {m.name}
                </div>
              </div>
            );
          })}

          {rows.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">No tasks yet.</div>
          )}
          {rows.map((it, idx) => {
            const to = it.deadline ? day(new Date(it.deadline)) : today;
            const createdDay = it.createdAt ? day(new Date(it.createdAt)) : to;
            const from = it.deadline ? Math.max(start, Math.min(createdDay, to)) : today;
            const overdue = !it.checked && it.deadline && to < today;
            const barColor = it.checked
              ? "color-mix(in oklab, var(--gb-green) 55%, var(--muted))"
              : overdue
                ? "color-mix(in oklab, var(--gb-red) 70%, var(--card))"
                : accent;
            const left = LABEL_W + x(Math.min(from, to));
            const w = (Math.abs(to - from) + 1) * DAY_W - 6;
            return (
              <div key={it.id} className={`flex items-center border-b border-border/40 ${idx % 2 ? "bg-muted/20" : ""}`}
                style={{ height: ROW_H }}>
                <div className="shrink-0 sticky left-0 z-20 h-full flex items-center gap-2 bg-card border-r border-border px-3"
                  style={{ width: LABEL_W }}>
                  <span aria-hidden className="size-1.5 rounded-full shrink-0" style={{ background: it.checked ? "var(--gb-green)" : accent }} />
                  <span className={`truncate text-xs ${it.checked ? "text-muted-foreground line-through" : ""}`}>{it.label}</span>
                </div>
                <div className="absolute h-[18px] rounded-md shadow-soft-sm"
                  style={{ left: left + 3, width: Math.max(w, it.deadline ? DAY_W - 6 : 12), background: barColor,
                    ...(it.deadline ? {} : { borderRadius: "9999px", width: 12, height: 12 }) }}
                  title={`${it.label}${it.deadline ? " — due " + new Date(it.deadline).toLocaleDateString() : " — no deadline (today)"}`} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
