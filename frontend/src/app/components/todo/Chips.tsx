import { Check, Flag, Loader2, Plus, Tag as TagIcon, X } from "lucide-react";
import { useState } from "react";
import { Priority, PRIORITY_META, Tag, tagColorVar } from "../../api/mock";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from "../ui/dropdown-menu";

export function PriorityChip({ priority, size = "sm" }: { priority?: Priority; size?: "sm" | "md" }) {
  if (!priority) return null;
  const meta = PRIORITY_META[priority];
  const cls = size === "md" ? "text-xs px-2 py-0.5" : "text-[0.65rem] px-1.5 py-0.5";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-medium ${cls}`}
      style={{
        color: meta.color,
        borderColor: `color-mix(in oklab, ${meta.color} 38%, transparent)`,
        background: `color-mix(in oklab, ${meta.color} 10%, transparent)`,
      }}>
      <span aria-hidden className="size-1.5 rounded-full" style={{ background: meta.color }} />
      {meta.label}
    </span>
  );
}

export function TagChip({ tag, onRemove, compact = false }: { tag: Tag; onRemove?: () => void; compact?: boolean }) {
  const c = tagColorVar(tag.color);
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-medium ${compact ? "text-[0.65rem] px-1.5 py-0.5" : "text-xs px-2 py-0.5"}`}
      style={{
        color: c,
        borderColor: `color-mix(in oklab, ${c} 35%, transparent)`,
        background: `color-mix(in oklab, ${c} 9%, transparent)`,
      }}>
      <span aria-hidden className="size-1.5 rounded-full" style={{ background: c }} />
      {tag.name}
      {onRemove && (
        <button onClick={onRemove} aria-label={`Remove ${tag.name}`}
          className="ml-0.5 rounded hover:bg-foreground/10 p-0.5">
          <X className="size-3" />
        </button>
      )}
    </span>
  );
}

export function PrioritySelect({
  value, onChange, trigger, align = "start",
}: { value?: Priority; onChange: (p: Priority | undefined) => void; trigger?: React.ReactNode; align?: "start" | "end" }) {
  const meta = value ? PRIORITY_META[value] : null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger ?? (
          <button type="button"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 text-xs hover:bg-muted/60 transition-colors"
            aria-label="Priority">
            <Flag className="size-3.5" style={{ color: meta?.color ?? "var(--muted-foreground)" }} />
            <span className={meta ? "" : "text-muted-foreground"}>{meta?.label ?? "Priority"}</span>
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align}>
        <DropdownMenuLabel className="font-mono text-[0.7rem] tracking-wider uppercase">Priority</DropdownMenuLabel>
        {([3, 2, 1] as Priority[]).map((p) => (
          <DropdownMenuItem key={p} onClick={() => onChange(p)}>
            <span aria-hidden className="size-2 rounded-full" style={{ background: PRIORITY_META[p].color }} />
            {PRIORITY_META[p].label}
            {value === p && <Check className="size-3.5 ml-auto" />}
          </DropdownMenuItem>
        ))}
        {value && <>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onChange(undefined)} className="text-muted-foreground">
            Clear priority
          </DropdownMenuItem>
        </>}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function TagSelect({
  tags, value, onChange, trigger, align = "start", onCreateTag,
}: {
  tags: Tag[];
  value: string[];
  onChange: (next: string[]) => void;
  trigger?: React.ReactNode;
  align?: "start" | "end";
  onCreateTag?: (name: string) => Promise<any>;
}) {
  const [newTag, setNewTag] = useState("");
  const [creating, setCreating] = useState(false);

  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  };

  const handleCreate = async () => {
    const t = newTag.trim();
    if (!t || !onCreateTag) return;
    setCreating(true);
    try {
      await onCreateTag(t);
      // tag id = name for local tags
      onChange([...value, t]);
      setNewTag("");
    } finally {
      setCreating(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger ?? (
          <button type="button"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 text-xs hover:bg-muted/60 transition-colors"
            aria-label="Tags">
            <TagIcon className="size-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Tags{value.length > 0 ? ` (${value.length})` : ""}</span>
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-56">
        <DropdownMenuLabel className="font-mono text-[0.7rem] tracking-wider uppercase">Tags</DropdownMenuLabel>
        {tags.length === 0 && !onCreateTag ? (
          <div className="px-2 py-2 text-xs text-muted-foreground">No tags yet — add some in Settings.</div>
        ) : (
          tags.map((t) => (
            <DropdownMenuCheckboxItem
              key={t.id}
              checked={value.includes(t.id)}
              onCheckedChange={() => toggle(t.id)}
            >
              <span aria-hidden className="size-2 rounded-full" style={{ background: tagColorVar(t.color) }} />
              {t.name}
            </DropdownMenuCheckboxItem>
          ))
        )}
        {onCreateTag && (
          <>
            {tags.length > 0 && <DropdownMenuSeparator />}
            <div className="px-2 py-1.5">
              <div className="flex items-center gap-1.5">
                <input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === "Enter") handleCreate();
                  }}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="New tag…"
                  maxLength={30}
                  className="flex-1 h-7 px-2 text-xs rounded-md bg-input-background border border-border outline-none focus:border-ring/60 transition-colors"
                />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleCreate(); }}
                  disabled={creating || !newTag.trim()}
                  aria-label="Create tag"
                  className="h-7 w-7 flex items-center justify-center rounded-md border border-border bg-card hover:bg-muted/60 text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
                >
                  {creating ? <Loader2 className="size-3 animate-spin" /> : <Plus className="size-3" />}
                </button>
              </div>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
