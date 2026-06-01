import { Layers, ChevronsUpDown, Plus, Check, Settings2 } from "lucide-react";
import { Link } from "react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useAppData } from "../../state/AppDataContext";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from "../ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

export function WorkspaceSwitcher() {
  const { workspaces, activeWorkspaceId, setActiveWorkspace, createWorkspace } = useAppData();
  const active = workspaces.find((w) => w.id === activeWorkspaceId);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = name.trim();
    if (!t) return;
    setBusy(true);
    try {
      const w = await createWorkspace(t);
      setActiveWorkspace(w.id);
      toast.success(`Workspace "${t}" created`);
      setName("");
      setShowCreate(false);
    } finally { setBusy(false); }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card/60 px-2.5 py-1.5 text-sm hover:bg-card transition-colors">
            <Layers className="size-3.5 text-muted-foreground" />
            <span className="font-medium truncate max-w-[140px]">{active?.name ?? "Workspace"}</span>
            <ChevronsUpDown className="size-3.5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-60">
          <DropdownMenuLabel className="font-mono text-[0.7rem] tracking-wider uppercase">Workspaces</DropdownMenuLabel>
          {workspaces.length === 0 ? (
            <div className="px-2 py-2 text-xs text-muted-foreground">No workspaces yet.</div>
          ) : workspaces.map((w) => (
            <DropdownMenuItem key={w.id} onClick={() => setActiveWorkspace(w.id)}>
              <Layers className="size-4 text-muted-foreground" />
              <span className="flex-1 truncate">{w.name}</span>
              {w.id === activeWorkspaceId && <Check className="size-3.5" />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowCreate(true)}>
            <Plus className="size-4" /> New workspace
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/settings?tab=workspaces"><Settings2 className="size-4" /> Manage workspaces</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create workspace</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label htmlFor="ws-name">Name</label>
              <Input id="ws-name" autoFocus value={name} onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Side Projects" maxLength={50}
                className="mt-1.5 h-10 bg-input-background border-border" />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" disabled={busy || !name.trim()}>Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
