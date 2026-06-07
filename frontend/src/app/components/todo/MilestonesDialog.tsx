/**
 * Milestones — name + date + gruvbox color per project. Shown as vertical
 * stripes in the gantt view. Opened from the flag button in the project header.
 */
import { useState } from "react";
import { Flag, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import * as api from "../../api/client";
import type { Milestone } from "../../api/client";

const COLORS = ["orange", "aqua", "purple", "blue", "yellow", "green"] as const;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wsId: string;
  listId: string;
  milestones: Milestone[];
  onChanged: () => void;
};

export function MilestonesDialog({ open, onOpenChange, wsId, listId, milestones, onChanged }: Props) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [color, setColor] = useState<(typeof COLORS)[number]>("purple");
  const [busy, setBusy] = useState(false);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !date) return;
    setBusy(true);
    try {
      await api.createMilestone(wsId, listId, {
        name: name.trim(),
        date: new Date(`${date}T12:00:00`).toISOString(),
        color,
      });
      setName(""); setDate("");
      onChanged();
      toast.success("Milestone added");
    } catch (err: any) {
      toast.error("Couldn't add milestone", { description: err?.message });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (m: Milestone) => {
    try {
      await api.deleteMilestone(wsId, listId, m.id);
      onChanged();
      toast(`Removed “${m.name}”`);
    } catch (err: any) {
      toast.error("Couldn't remove milestone", { description: err?.message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="size-4 text-primary" /> Milestones
          </DialogTitle>
          <DialogDescription>
            Named dates for this project — they appear as stripes in the timeline view.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5 max-h-56 overflow-y-auto">
          {milestones.length === 0 && (
            <p className="text-sm text-muted-foreground py-2">No milestones yet.</p>
          )}
          {milestones.map((m) => (
            <div key={m.id} className="group flex items-center gap-2.5 rounded-lg border border-border px-3 py-2">
              <span aria-hidden className="size-2.5 rounded-full shrink-0"
                style={{ background: `var(--gb-${m.color ?? "purple"})` }} />
              <span className="flex-1 truncate text-sm">{m.name}</span>
              <span className="font-mono text-[0.7rem] text-muted-foreground tabular-nums">
                {new Date(m.date).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
              </span>
              <button onClick={() => remove(m)} aria-label={`Delete ${m.name}`}
                className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded-md text-muted-foreground hover:text-destructive transition-opacity">
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={add} className="space-y-3 border-t border-border pt-3">
          <div className="flex gap-2">
            <Input value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Milestone name…" maxLength={100}
              className="flex-1 h-9 bg-input-background border-border" />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required
              className="h-9 rounded-md border border-border bg-input-background px-2 text-sm text-foreground" />
          </div>
          <div className="flex items-center gap-2">
            <span className="label">Color</span>
            {COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setColor(c)} aria-label={c}
                className={`size-5 rounded-full transition-transform ${color === c ? "scale-110 ring-2 ring-offset-2 ring-offset-card" : "opacity-70 hover:opacity-100"}`}
                style={{ background: `var(--gb-${c})`, ...(color === c ? { ["--tw-ring-color" as any]: `var(--gb-${c})` } : {}) }} />
            ))}
            <div className="flex-1" />
            <Button type="submit" size="sm" disabled={busy || !name.trim() || !date} className="gap-1.5">
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} Add
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
