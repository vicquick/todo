import { useState } from "react";
import { Tag as TagIcon, Plus, Pencil, Trash2, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useAppData } from "../../state/AppDataContext";
import { TAG_COLORS, TagColor, setTagColor, tagColorVar } from "../../api/mock";

export function TagsSettingsTab() {
  const { tags, createTag, renameTag, deleteTag, refreshTags } = useAppData();
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = name.trim();
    if (!t) return;
    setCreating(true);
    try {
      await createTag(t);
      setName("");
      toast.success("Tag created");
    } catch (err: any) {
      toast.error("Couldn't create tag", { description: err?.message });
    } finally { setCreating(false); }
  };

  const startEdit = (n: string) => { setEditing(n); setDraft(n); };
  const cancelEdit = () => { setEditing(null); setDraft(""); };
  const saveEdit = async (oldName: string) => {
    const t = draft.trim();
    if (!t || t === oldName) { cancelEdit(); return; }
    try {
      await renameTag(oldName, t);
      toast.success("Tag renamed");
      cancelEdit();
    } catch (err: any) {
      toast.error("Couldn't rename", { description: err?.message });
    }
  };

  const onDelete = async (n: string) => {
    try { await deleteTag(n); toast(`Removed "${n}"`); }
    catch (err: any) { toast.error("Couldn't delete", { description: err?.message }); }
  };

  const onChangeColor = async (n: string, c: TagColor) => {
    setTagColor(n, c);
    await refreshTags();
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-soft-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-3">
        <div>
          <h3>Tags</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Reusable labels for your tasks. Tag CRUD is local until backend support lands.
          </p>
        </div>
      </div>
      <div className="p-5">
        <form onSubmit={onCreate} className="flex items-center gap-2 mb-5">
          <Input value={name} onChange={(e) => setName(e.target.value)}
            placeholder="New tag name…" maxLength={30}
            className="h-10 bg-input-background border-border" />
          <Button type="submit" disabled={creating || !name.trim()} className="gap-1.5">
            {creating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Create
          </Button>
        </form>

        {tags.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tags yet.</p>
        ) : (
          <ul className="divide-y divide-border border border-border rounded-lg overflow-hidden">
            {tags.map((t) => {
              const isEditing = editing === t.id;
              return (
                <li key={t.id} className="flex items-center gap-3 px-3 py-2.5">
                  <span aria-hidden className="size-2 rounded-full shrink-0" style={{ background: tagColorVar(t.color) }} />
                  <TagIcon className="size-3.5 text-muted-foreground shrink-0" />
                  {isEditing ? (
                    <Input value={draft} onChange={(e) => setDraft(e.target.value)}
                      autoFocus maxLength={30}
                      className="h-8 flex-1 bg-input-background border-border" />
                  ) : (
                    <span className="flex-1 truncate">{t.name}</span>
                  )}
                  {!isEditing && (
                    <div className="flex items-center gap-0.5">
                      {TAG_COLORS.map((c) => (
                        <button key={c} type="button" onClick={() => onChangeColor(t.name, c)}
                          aria-label={`Set color ${c}`}
                          className={`size-4 rounded-full border transition-transform ${
                            t.color === c ? "scale-110 border-foreground/40" : "border-transparent hover:scale-105"
                          }`}
                          style={{ background: tagColorVar(c) }} />
                      ))}
                    </div>
                  )}
                  {isEditing ? (
                    <>
                      <Button size="icon" variant="ghost" className="size-8" onClick={() => saveEdit(t.name)} aria-label="Save">
                        <Check className="size-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="size-8" onClick={cancelEdit} aria-label="Cancel">
                        <X className="size-3.5" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="icon" variant="ghost" className="size-8" onClick={() => startEdit(t.name)} aria-label="Rename">
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="size-8 text-destructive hover:text-destructive"
                        onClick={() => onDelete(t.name)} aria-label="Delete">
                        <Trash2 className="size-3.5" />
                      </Button>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
