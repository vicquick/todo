import { useState } from "react";
import { Layers, Plus, Pencil, Trash2, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "../ui/alert-dialog";
import { useAppData } from "../../state/AppDataContext";

export function WorkspacesSettingsTab() {
  const {
    workspaces, activeWorkspaceId, setActiveWorkspace,
    createWorkspace, renameWorkspace, deleteWorkspace,
  } = useAppData();

  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = newName.trim();
    if (!t) return;
    setCreating(true);
    try {
      const w = await createWorkspace(t);
      setActiveWorkspace(w.id);
      setNewName("");
      toast.success(`Workspace "${t}" created`);
    } catch (err: any) {
      toast.error("Couldn't create workspace", { description: err?.message });
    } finally { setCreating(false); }
  };

  const startEdit = (id: string, name: string) => { setEditing(id); setEditDraft(name); };
  const cancelEdit = () => { setEditing(null); setEditDraft(""); };
  const saveEdit = async (id: string) => {
    const t = editDraft.trim();
    if (!t) return;
    try {
      await renameWorkspace(id, t);
      toast.success("Workspace renamed");
      cancelEdit();
    } catch (err: any) {
      toast.error("Couldn't rename", { description: err?.message });
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const { id, name } = pendingDelete;
    setPendingDelete(null);
    try {
      await deleteWorkspace(id);
      toast(`Deleted "${name}"`);
    } catch (err: any) {
      toast.error("Couldn't delete", { description: err?.message });
    }
  };

  return (
    <>
      <div className="rounded-xl border border-border bg-card shadow-soft-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3>Workspaces</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Workspaces group your lists. Switch between them at any time.
          </p>
        </div>
        <div className="p-5">
          <form onSubmit={onCreate} className="flex items-center gap-2 mb-5">
            <Input value={newName} onChange={(e) => setNewName(e.target.value)}
              placeholder="New workspace name…" maxLength={50}
              className="h-10 bg-input-background border-border" />
            <Button type="submit" disabled={creating || !newName.trim()} className="gap-1.5">
              {creating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Create
            </Button>
          </form>

          {workspaces.length === 0 ? (
            <p className="text-sm text-muted-foreground">No workspaces yet.</p>
          ) : (
            <ul className="divide-y divide-border border border-border rounded-lg overflow-hidden">
              {workspaces.map((w) => {
                const isActive = w.id === activeWorkspaceId;
                const isEditing = editing === w.id;
                return (
                  <li key={w.id} className="flex items-center gap-3 px-3 py-2.5">
                    <Layers className="size-4 text-muted-foreground shrink-0" />
                    {isEditing ? (
                      <Input value={editDraft} onChange={(e) => setEditDraft(e.target.value)}
                        autoFocus maxLength={50}
                        className="h-8 flex-1 bg-input-background border-border" />
                    ) : (
                      <span className="flex-1 truncate">{w.name}</span>
                    )}
                    {isActive && !isEditing && (
                      <span className="text-[0.65rem] font-mono uppercase tracking-wider text-muted-foreground">
                        active
                      </span>
                    )}
                    {isEditing ? (
                      <>
                        <Button size="icon" variant="ghost" className="size-8" onClick={() => saveEdit(w.id)} aria-label="Save">
                          <Check className="size-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="size-8" onClick={cancelEdit} aria-label="Cancel">
                          <X className="size-3.5" />
                        </Button>
                      </>
                    ) : (
                      <>
                        {!isActive && (
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setActiveWorkspace(w.id)}>
                            Switch
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" className="size-8" onClick={() => startEdit(w.id, w.name)} aria-label="Rename">
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="size-8 text-destructive hover:text-destructive"
                          onClick={() => setPendingDelete({ id: w.id, name: w.name })}
                          aria-label="Delete"
                          disabled={workspaces.length === 1}>
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

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{pendingDelete?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              All lists and tasks inside this workspace will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete workspace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
