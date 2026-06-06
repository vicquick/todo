import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus, Trash2, Loader2, Check, MoreHorizontal, Calendar,
  Filter as FilterIcon, Pencil, X, ChevronDown, ChevronRight,
  CheckCheck, CircleDashed, ListChecks, Eraser, Square, CheckSquare, Tag as TagIcon, Flag,
  AlignLeft, Image as ImageIcon,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from "../ui/dropdown-menu";
import { TodoList } from "./Sidebar";
import { LoadingPanel, EmptyItems, ErrorPanel } from "./States";
import { Priority, PRIORITY_META, Tag, tagColorVar, tagFromName } from "../../api/mock";
import { PriorityChip, PrioritySelect, TagChip, TagSelect } from "./Chips";

export type TodoItem = {
  id: string;
  label: string;
  checked: boolean;
  priority?: Priority | null;
  tags?: string[];
  description?: string | null;
  pending?: boolean;
};

export type ItemPatch = {
  label?: string;
  checked?: boolean;
  priority?: Priority | null;
  tags?: string[];
  description?: string | null;
};

type Filter = "all" | "active" | "done";

type Props = {
  list: TodoList;
  items: TodoItem[];
  tags: Tag[];
  loading?: boolean;
  error?: string | null;
  adding?: boolean;

  onAdd: (label: string, opts: { priority?: Priority; tags?: string[]; description?: string }) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onRenameItem: (id: string, label: string) => void;
  onRenameList: (name: string) => void;
  onUpdateDescription: (description: string) => void;
  onPatchItem: (itemId: string, patch: ItemPatch) => void;

  onBulkSetChecked: (ids: string[], checked: boolean) => void;
  onBulkDelete: (ids: string[]) => void;

  onCheckAll: () => void;
  onUncheckAll: () => void;
  onDeleteCompleted: () => void;

  onRetry?: () => void;
  onDeleteList: () => void;
  onCreateTag?: (name: string) => Promise<any>;
};

const accentVar: Record<TodoList["accent"], string> = {
  orange: "var(--gb-orange)", aqua: "var(--gb-aqua)", purple: "var(--gb-purple)",
  blue: "var(--gb-blue)", yellow: "var(--gb-yellow)", green: "var(--gb-green)",
};

export function MainPanel({
  list, items, tags, loading, error, adding,
  onAdd, onToggle, onDelete, onRenameItem, onRenameList, onUpdateDescription, onPatchItem,
  onBulkSetChecked, onBulkDelete, onCheckAll, onUncheckAll, onDeleteCompleted,
  onRetry, onDeleteList, onCreateTag,
}: Props) {
  const [label, setLabel] = useState("");
  const [touched, setTouched] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(list.name);
  const titleRef = useRef<HTMLInputElement>(null);
  const [editingSubtitle, setEditingSubtitle] = useState(false);
  const [subtitleDraft, setSubtitleDraft] = useState(list.description ?? "");
  const subtitleRef = useRef<HTMLInputElement>(null);

  // new-item options
  const [newPriority, setNewPriority] = useState<Priority | undefined>(undefined);
  const [newTags, setNewTags] = useState<string[]>([]);
  const [newDescOpen, setNewDescOpen] = useState(false);
  const [newDesc, setNewDesc] = useState("");

  // selection
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const trimmed = label.trim();
  const invalid = touched && trimmed.length === 0;

  useEffect(() => {
    setTitleDraft(list.name); setEditingTitle(false);
    setSubtitleDraft(list.description ?? ""); setEditingSubtitle(false);
    setSelected(new Set()); setTagFilter([]);
  }, [list.id, list.name, list.description]);
  useEffect(() => { if (editingTitle) titleRef.current?.select(); }, [editingTitle]);
  useEffect(() => { if (editingSubtitle) subtitleRef.current?.focus(); }, [editingSubtitle]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!trimmed) return;
    onAdd(trimmed, {
      priority: newPriority,
      tags: newTags.length ? newTags : undefined,
      description: newDesc.trim() ? newDesc.trim() : undefined,
    });
    setLabel(""); setTouched(false);
    setNewPriority(undefined); setNewTags([]); setNewDesc(""); setNewDescOpen(false);
  };

  const submitTitle = (e?: React.FormEvent) => {
    e?.preventDefault();
    const t = titleDraft.trim();
    if (!t || t === list.name) { setEditingTitle(false); setTitleDraft(list.name); return; }
    onRenameList(t);
    setEditingTitle(false);
  };

  const submitSubtitle = (e?: React.FormEvent) => {
    e?.preventDefault();
    const t = subtitleDraft.trim();
    if (t === (list.description ?? "")) { setEditingSubtitle(false); return; }
    onUpdateDescription(t);
    setEditingSubtitle(false);
  };

  const filtered = useMemo(() => {
    let arr = items;
    if (filter === "active") arr = arr.filter((i) => !i.checked);
    if (filter === "done") arr = arr.filter((i) => i.checked);
    if (tagFilter.length > 0) {
      arr = arr.filter((i) => {
        const t = i.tags ?? [];
        return tagFilter.every((name) => t.includes(name));
      });
    }
    // Sort: unchecked first, then by priority descending (High=3 → Med=2 → Low=1 → none)
    arr = [...arr].sort((a, b) => {
      if (a.checked !== b.checked) return a.checked ? 1 : -1;
      const pa = a.priority ?? 0;
      const pb = b.priority ?? 0;
      return pb - pa;
    });
    return arr;
  }, [items, filter, tagFilter]);

  const completed = items.filter((i) => i.checked).length;
  const progress = items.length === 0 ? 0 : Math.round((completed / items.length) * 100);

  // selection helpers
  const allVisibleSelected = filtered.length > 0 && filtered.every((i) => selected.has(i.id));
  const toggleSelect = (id: string) => {
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };
  const selectAllVisible = () => setSelected(new Set(filtered.map((i) => i.id)));
  const clearSelection = () => setSelected(new Set());

  const selectedIds = Array.from(selected);
  const selectedCount = selected.size;
  const anySelected = selectedCount > 0;

  return (
    <section className="h-full overflow-y-auto relative">
      <div className="max-w-3xl mx-auto px-6 md:px-10 py-8 md:py-12 pb-32">
        {/* Header */}
        <header className="flex items-start gap-4 flex-wrap">
          <div aria-hidden className="size-11 rounded-xl shrink-0 shadow-soft-sm"
            style={{
              background: `linear-gradient(135deg, ${accentVar[list.accent]} 0%, color-mix(in oklab, ${accentVar[list.accent]} 60%, var(--gb-bg2)) 100%)`,
            }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <span>Project</span>
            </div>

            {editingTitle ? (
              <form onSubmit={submitTitle} className="mt-1 flex items-center gap-2">
                <Input ref={titleRef} value={titleDraft} onChange={(e) => setTitleDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Escape") { setEditingTitle(false); setTitleDraft(list.name); } }}
                  maxLength={50} className="h-10 font-display text-[1.5rem] px-2 bg-input-background border-border" />
                <Button type="submit" size="icon" variant="ghost" className="size-9" aria-label="Save title">
                  <Check className="size-4" />
                </Button>
                <Button type="button" size="icon" variant="ghost" className="size-9" aria-label="Cancel"
                  onClick={() => { setEditingTitle(false); setTitleDraft(list.name); }}>
                  <X className="size-4" />
                </Button>
              </form>
            ) : (
              <button
                className="group mt-1 inline-flex items-center gap-2 text-left rounded-md hover:bg-muted/40 -mx-1 px-1 transition-colors"
                onClick={() => setEditingTitle(true)} title="Rename project">
                <h1 className="truncate">{list.name}</h1>
                <Pencil className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}

            {editingSubtitle ? (
              <form onSubmit={submitSubtitle} className="mt-1.5 flex items-center gap-2">
                <Input ref={subtitleRef} value={subtitleDraft} onChange={(e) => setSubtitleDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Escape") { setEditingSubtitle(false); setSubtitleDraft(list.description ?? ""); } }}
                  maxLength={200} placeholder="A short subtitle for this project…"
                  className="h-9 text-sm px-2 bg-input-background border-border" />
                <Button type="submit" size="icon" variant="ghost" className="size-8" aria-label="Save subtitle">
                  <Check className="size-4" />
                </Button>
                <Button type="button" size="icon" variant="ghost" className="size-8" aria-label="Cancel"
                  onClick={() => { setEditingSubtitle(false); setSubtitleDraft(list.description ?? ""); }}>
                  <X className="size-4" />
                </Button>
              </form>
            ) : list.description ? (
              <p className="mt-1 text-sm text-muted-foreground italic truncate cursor-text"
                onDoubleClick={() => setEditingSubtitle(true)} title="Double-click to edit subtitle">
                {list.description}
              </p>
            ) : null}

            <div className="mt-1 text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
              <span>
                <span className="font-mono tabular-nums text-foreground">{completed}</span> of{" "}
                <span className="font-mono tabular-nums text-foreground">{items.length}</span> complete
              </span>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="size-3.5" /> updated just now
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setEditingTitle(true)} className="text-muted-foreground hover:text-foreground gap-1.5">
              <Pencil className="size-4" /> Rename
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Project actions" className="text-muted-foreground">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-mono text-[0.7rem] tracking-wider uppercase">Project</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => { setSubtitleDraft(list.description ?? ""); setEditingSubtitle(true); }}>
                  <AlignLeft className="size-4" /> {list.description ? "Edit subtitle" : "Add subtitle"}
                </DropdownMenuItem>
                <DropdownMenuItem disabled title="Project pictures arrive with the media tranche">
                  <ImageIcon className="size-4" /> Change picture… <span className="ml-auto font-mono text-[0.6rem] text-muted-foreground">soon</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="font-mono text-[0.7rem] tracking-wider uppercase">Quick actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={onCheckAll}><CheckCheck className="size-4" /> Check all tasks</DropdownMenuItem>
                <DropdownMenuItem onClick={onUncheckAll}><CircleDashed className="size-4" /> Uncheck all tasks</DropdownMenuItem>
                <DropdownMenuItem onClick={selectAllVisible}><ListChecks className="size-4" /> Select all visible</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDeleteCompleted}><Eraser className="size-4" /> Delete completed</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDeleteList} className="text-destructive focus:text-destructive">
                  <Trash2 className="size-4" /> Delete project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Progress */}
        <div className="mt-5">
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <motion.div className="h-full rounded-full" style={{ background: accentVar[list.accent] }}
              initial={false} animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 140, damping: 22 }} />
          </div>
          <div className="mt-1.5 flex justify-between text-[0.7rem] font-mono text-muted-foreground tabular-nums">
            <span>{progress}% done</span>
            <span>{items.length - completed} remaining</span>
          </div>
        </div>

        {/* Add item */}
        <form onSubmit={submit} className="mt-7">
          <div
            className={`rounded-xl bg-card border shadow-soft-sm transition-colors ${
              invalid ? "border-destructive/60" : "border-border focus-within:border-ring/60"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="pl-4 text-muted-foreground"><Plus className="size-4" /></span>
              <Input
                placeholder="Add a task and press Enter…"
                value={label}
                onChange={(e) => { setLabel(e.target.value); if (touched) setTouched(false); }}
                disabled={adding}
                maxLength={50}
                className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-2 h-12"
              />
              <Button type="submit" disabled={adding || !trimmed} className="m-1.5 h-9 gap-1.5">
                {adding ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                Add
              </Button>
            </div>
            <div className="border-t border-border px-3 py-2 flex items-center gap-2 flex-wrap">
              <PrioritySelect value={newPriority} onChange={setNewPriority} />
              <TagSelect tags={tags} value={newTags} onChange={setNewTags} onCreateTag={onCreateTag} />
              <button type="button"
                onClick={() => setNewDescOpen((o) => !o)}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 text-xs hover:bg-muted/60 transition-colors text-muted-foreground"
              >
                {newDescOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                {newDesc.trim() ? "Description added" : "Add description"}
              </button>
              {/* live preview chips */}
              {newPriority && <PriorityChip priority={newPriority} />}
              {newTags.map((name) => {
                const t = tags.find((x) => x.id === name) ?? tagFromName(name);
                return <TagChip key={name} tag={t} compact onRemove={() => setNewTags(newTags.filter((x) => x !== name))} />;
              })}
            </div>
            {newDescOpen && (
              <div className="px-3 pb-3">
                <Textarea
                  placeholder="Notes, context, links…"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={3}
                  className="bg-input-background border-border"
                />
              </div>
            )}
          </div>
          {invalid && <p className="mt-2 text-xs text-destructive">Task can&apos;t be empty.</p>}
        </form>

        {/* Filters */}
        <div className="mt-6 flex items-center gap-1 text-sm flex-wrap">
          <FilterIcon className="size-3.5 text-muted-foreground mr-1.5" />
          {(["all", "active", "done"] as Filter[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`capitalize px-2.5 py-1 rounded-md transition-colors font-medium ${
                filter === f ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}>
              {f}
              <span className="ml-1.5 font-mono text-[0.7rem] text-muted-foreground tabular-nums">
                {f === "all" ? items.length : f === "active" ? items.length - completed : completed}
              </span>
            </button>
          ))}

          {tags.length > 0 && (
            <>
              <span aria-hidden className="mx-2 h-4 w-px bg-border-strong" />
              <TagIcon className="size-3.5 text-muted-foreground mr-1" />
              <div className="flex items-center gap-1 flex-wrap">
                {tags.map((t) => {
                  const active = tagFilter.includes(t.id);
                  return (
                    <button key={t.id} type="button"
                      onClick={() => setTagFilter((tf) => active ? tf.filter((x) => x !== t.id) : [...tf, t.id])}
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border transition-colors ${
                        active
                          ? "text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      style={active ? {
                        color: tagColorVar(t.color),
                        borderColor: `color-mix(in oklab, ${tagColorVar(t.color)} 40%, transparent)`,
                        background: `color-mix(in oklab, ${tagColorVar(t.color)} 12%, transparent)`,
                      } : { borderColor: "transparent", background: "transparent" }}>
                      <span aria-hidden className="size-1.5 rounded-full" style={{ background: tagColorVar(t.color) }} />
                      {t.name}
                    </button>
                  );
                })}
                {tagFilter.length > 0 && (
                  <button onClick={() => setTagFilter([])}
                    className="text-[0.7rem] uppercase tracking-wider text-muted-foreground hover:text-foreground ml-1">
                    Clear
                  </button>
                )}
              </div>
            </>
          )}

          <div className="flex-1" />
          {filtered.length > 0 && (
            <button
              type="button"
              onClick={() => allVisibleSelected ? clearSelection() : selectAllVisible()}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              {allVisibleSelected ? <CheckSquare className="size-3.5" /> : <Square className="size-3.5" />}
              {allVisibleSelected ? "Unselect all" : "Select all"}
            </button>
          )}
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
              No tasks match these filters.
            </div>
          ) : (
            <ul className="space-y-1.5">
              <AnimatePresence initial={false}>
                {filtered.map((it) => (
                  <ItemRow
                    key={it.id}
                    item={it}
                    tags={tags}
                    accent={accentVar[list.accent]}
                    isSelected={selected.has(it.id)}
                    anySelected={anySelected}
                    onSelectToggle={() => toggleSelect(it.id)}
                    onToggle={() => onToggle(it.id)}
                    onDelete={() => onDelete(it.id)}
                    onRename={(label) => onRenameItem(it.id, label)}
                    onPatch={(patch) => onPatchItem(it.id, patch)}
                    onCreateTag={onCreateTag}
                  />
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </div>

      {/* Bulk action toolbar */}
      <AnimatePresence>
        {anySelected && (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
            className="sticky bottom-4 mx-auto max-w-2xl px-4"
          >
            <div className="rounded-xl border border-border bg-popover shadow-soft-lg flex items-center gap-1 px-2 py-1.5"
              style={{ backdropFilter: "blur(8px)", background: "color-mix(in oklab, var(--popover) 92%, transparent)" }}>
              <span className="px-2 py-1 text-sm font-medium">{selectedCount} selected</span>
              <span aria-hidden className="h-5 w-px bg-border-strong mx-1" />
              <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => { onBulkSetChecked(selectedIds, true); clearSelection(); }}>
                <Check className="size-4" /> Mark complete
              </Button>
              <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => { onBulkSetChecked(selectedIds, false); clearSelection(); }}>
                <CircleDashed className="size-4" /> Mark incomplete
              </Button>
              <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => { onBulkDelete(selectedIds); clearSelection(); }}>
                <Trash2 className="size-4" /> Delete
              </Button>
              <span aria-hidden className="h-5 w-px bg-border-strong mx-1" />
              <Button variant="ghost" size="icon" aria-label="Cancel selection" onClick={clearSelection}>
                <X className="size-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function ItemRow({
  item, tags, accent, isSelected, anySelected,
  onSelectToggle, onToggle, onDelete, onRename, onPatch, onCreateTag,
}: {
  item: TodoItem;
  tags: Tag[];
  accent: string;
  isSelected: boolean;
  anySelected: boolean;
  onSelectToggle: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onRename: (label: string) => void;
  onPatch: (patch: ItemPatch) => void;
  onCreateTag?: (name: string) => Promise<any>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.label);
  const [expanded, setExpanded] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState(item.description ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(item.label); }, [item.label]);
  useEffect(() => { setDescDraft(item.description ?? ""); }, [item.description]);
  useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);

  const save = (e?: React.FormEvent) => {
    e?.preventDefault();
    const t = draft.trim();
    if (!t || t === item.label) { setEditing(false); setDraft(item.label); return; }
    onRename(t);
    setEditing(false);
  };

  const itemTagNames = item.tags ?? [];
  const itemTags = itemTagNames.map((name) => tags.find((t) => t.id === name) ?? tagFromName(name));
  const hasDescription = !!(item.description && item.description.trim());
  const hasExtras = hasDescription || itemTags.length > 0 || !!item.priority;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 12, height: 0, marginTop: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
      className={`group rounded-xl border bg-card shadow-soft-sm hover:shadow-soft-md transition-all ${
        isSelected ? "border-ring/60 ring-1 ring-ring/30" : "border-border"
      }`}
    >
      <div className="px-4 py-3 flex items-center gap-3">
        {/* selection checkbox */}
        <button
          type="button"
          onClick={onSelectToggle}
          aria-pressed={isSelected}
          aria-label={isSelected ? "Unselect" : "Select"}
          className={`size-4 rounded border grid place-items-center transition-all shrink-0 ${
            anySelected || isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus:opacity-100"
          }`}
          style={{
            borderColor: isSelected ? "var(--ring)" : "var(--border-strong)",
            background: isSelected ? "var(--ring)" : "transparent",
            color: isSelected ? "var(--primary-foreground)" : "transparent",
          }}
        >
          {isSelected && <Check className="size-3" strokeWidth={3} />}
        </button>

        {/* completion toggle */}
        <button
          onClick={onToggle}
          aria-pressed={item.checked}
          aria-label={item.checked ? `Mark ${item.label} incomplete` : `Mark ${item.label} complete`}
          className="relative size-5 rounded-md border grid place-items-center transition-all shrink-0"
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

        {/* label */}
        {editing ? (
          <form onSubmit={save} className="flex-1 flex items-center gap-2">
            <Input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Escape") { setEditing(false); setDraft(item.label); } }}
              onBlur={() => save()}
              maxLength={50}
              className="h-8 px-2 bg-input-background border-border"
            />
            <Button type="submit" size="icon" variant="ghost" className="size-8" aria-label="Save"><Check className="size-3.5" /></Button>
          </form>
        ) : (
          <button
            onDoubleClick={() => setEditing(true)}
            className={`flex-1 text-left text-[0.95rem] truncate transition-all ${
              item.checked ? "text-muted-foreground line-through decoration-1" : "text-foreground"
            }`}
          >
            {item.label}
          </button>
        )}

        {/* inline meta (priority + tags) */}
        <div className="flex items-center gap-1 flex-wrap shrink-0">
          {item.priority && <PriorityChip priority={item.priority} />}
          {itemTags.slice(0, 3).map((t) => <TagChip key={t.id} tag={t} compact />)}
          {itemTags.length > 3 && (
            <span className="text-[0.65rem] text-muted-foreground font-mono">+{itemTags.length - 3}</span>
          )}
        </div>

        {item.pending && <Loader2 className="size-3.5 text-muted-foreground animate-spin" />}

        {hasExtras && (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            aria-label={expanded ? "Collapse details" : "Expand details"}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            {expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
          </button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label={`More for ${item.label}`}
              className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/60"
            >
              <MoreHorizontal className="size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={() => setEditing(true)}><Pencil className="size-4" /> Rename</DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setExpanded(true); setEditingDesc(true); }}>
              <ChevronDown className="size-4" /> {hasDescription ? "Edit description" : "Add description"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="font-mono text-[0.65rem] tracking-wider uppercase">Priority</DropdownMenuLabel>
            {([3, 2, 1] as Priority[]).map((p) => (
              <DropdownMenuItem key={p} onClick={() => onPatch({ priority: p })}>
                <span aria-hidden className="size-2 rounded-full" style={{ background: PRIORITY_META[p].color }} />
                {PRIORITY_META[p].label}
                {item.priority === p && <Check className="size-3.5 ml-auto" />}
              </DropdownMenuItem>
            ))}
            {item.priority && (
              <DropdownMenuItem onClick={() => onPatch({ priority: null })} className="text-muted-foreground">
                <Flag className="size-4" /> Clear priority
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
              <Trash2 className="size-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-border space-y-3">
              {/* tag editor */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="label">Tags</span>
                {itemTags.map((t) => (
                  <TagChip key={t.id} tag={t} onRemove={() => onPatch({ tags: itemTagNames.filter((x) => x !== t.id) })} compact />
                ))}
                <TagSelect
                  tags={tags}
                  value={itemTagNames}
                  onChange={(next) => onPatch({ tags: next })}
                  onCreateTag={onCreateTag}
                />
                <PrioritySelect value={item.priority ?? undefined} onChange={(p) => onPatch({ priority: p ?? null })} />
              </div>

              {/* description */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="label">Description</span>
                  {!editingDesc && (
                    <Button variant="ghost" size="sm" className="h-7 px-2 gap-1.5"
                      onClick={() => setEditingDesc(true)}>
                      <Pencil className="size-3.5" /> {hasDescription ? "Edit" : "Add"}
                    </Button>
                  )}
                </div>
                {editingDesc ? (
                  <div className="mt-1.5">
                    <Textarea
                      value={descDraft}
                      onChange={(e) => setDescDraft(e.target.value)}
                      rows={4}
                      placeholder="Notes, context, links…"
                      className="bg-input-background border-border"
                      autoFocus
                    />
                    <div className="mt-2 flex gap-2 justify-end">
                      <Button size="sm" variant="ghost" onClick={() => { setEditingDesc(false); setDescDraft(item.description ?? ""); }}>Cancel</Button>
                      <Button size="sm" onClick={() => { onPatch({ description: descDraft.trim() ? descDraft : null }); setEditingDesc(false); }}>Save</Button>
                    </div>
                  </div>
                ) : hasDescription ? (
                  <p className="mt-1.5 text-sm text-foreground/90 whitespace-pre-wrap">{item.description}</p>
                ) : (
                  <p className="mt-1.5 text-sm text-muted-foreground">No description yet.</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}
