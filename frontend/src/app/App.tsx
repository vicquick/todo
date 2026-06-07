import { useEffect, useMemo, useRef, useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./components/ui/alert-dialog";
import { Sidebar, TodoList } from "./components/todo/Sidebar";
import { MainPanel, TodoItem, ItemPatch } from "./components/todo/MainPanel";
import { TopBar } from "./components/todo/TopBar";
import { NotFound } from "./components/todo/NotFound";
import {
  NoListsEmpty,
  NoSelection,
  ErrorPanel,
} from "./components/todo/States";
import { LoginPage } from "./components/auth/LoginPage";
import { SignupPage } from "./components/auth/SignupPage";
import { ForgotPasswordPage } from "./components/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "./components/auth/ResetPasswordPage";
import {
  ProtectedRoute,
  PublicOnlyRoute,
} from "./components/auth/ProtectedRoute";
import { SettingsPage } from "./components/settings/SettingsPage";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { AppDataProvider, useAppData } from "./state/AppDataContext";
import { AIProvider } from "./state/AIContext";
import { AIHistoryPage } from "./components/ai/AIHistoryPage";
import { MCPExplorerPage } from "./components/ai/MCPExplorerPage";
import { FloatingChat } from "./components/ai/FloatingChat";
import { QuickNotes } from "./components/notes/QuickNotes";
import { Button } from "./components/ui/button";
import { FolderPlus, Loader2 } from "lucide-react";
import { Priority } from "./api/mock";
import * as api from "./api/client";
import { ThemeProvider, useTheme } from "./state/ThemeContext";

export default function App() {
  return (
    <ThemeProvider>
      <AppRoutes />
    </ThemeProvider>
  );
}

function AppRoutes() {
  const { dark, toggle } = useTheme();

  const healthChecked = useRef(false);
  useEffect(() => {
    if (healthChecked.current) return;
    healthChecked.current = true;
    api.checkHealth().then((ok) => {
      if (!ok)
        toast("Backend looks unreachable", {
          description: "Some actions may fail until it comes back.",
        });
    });
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <AppDataProvider>
          <AIProvider>
            <Routes>
              <Route
                path="/login"
                element={
                  <PublicOnlyRoute>
                    <LoginPage />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/signup"
                element={
                  <PublicOnlyRoute>
                    <SignupPage />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/forgot-password"
                element={
                  <PublicOnlyRoute>
                    <ForgotPasswordPage />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/reset-password"
                element={
                  <PublicOnlyRoute>
                    <ResetPasswordPage />
                  </PublicOnlyRoute>
                }
              />

              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <SettingsPage
                      dark={dark}
                      onToggleDark={toggle}
                    />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/ai/history"
                element={
                  <ProtectedRoute>
                    <AIHistoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mcp"
                element={
                  <ProtectedRoute>
                    <MCPExplorerPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard
                      dark={dark}
                      onToggleDark={toggle}
                    />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<NotFoundRoute />} />
            </Routes>
            <Toaster richColors position="bottom-right" />
          </AIProvider>
        </AppDataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

function NotFoundRoute() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col">
      <NotFound onBack={() => navigate("/")} />
    </div>
  );
}

function Dashboard({
  dark,
  onToggleDark,
}: {
  dark: boolean;
  onToggleDark: () => void;
}) {
  const { logout } = useAuth();
  const {
    ready,
    workspaces,
    activeWorkspaceId,
    createWorkspace,
    tags,
    createTag,
  } = useAppData();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [lists, setLists] = useState<TodoList[]>([]);
  const [itemsByList, setItemsByList] = useState<Record<string, TodoItem[]>>(
    {},
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [creatingList, setCreatingList] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [creatingDefaultWs, setCreatingDefaultWs] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const wsId = activeWorkspaceId;

  const loadLists = async (workspaceId: string) => {
    setInitialLoading(true);
    setLoadError(null);
    try {
      const { lists, itemsByList } = await api.fetchLists(workspaceId);
      setLists(lists);
      setItemsByList(itemsByList);
    } catch (e: any) {
      if (e?.status === 401) return;
      setLoadError(e?.message ?? "Failed to load projects");
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (!ready) return;
    if (!wsId) {
      setLists([]);
      setItemsByList({});
      setSelectedId(null);
      setInitialLoading(false);
      return;
    }
    loadLists(wsId);
    // eslint-disable-next-line
  }, [ready, wsId]);

  useEffect(() => {
    if (!lists.length) {
      if (selectedId !== null) setSelectedId(null);
      return;
    }
    if (!selectedId || !lists.some((l) => l.id === selectedId)) {
      const firstId = lists[0].id;
      setSelectedId(firstId);
      if (wsId) {
        api
          .fetchListDetails(wsId, firstId)
          .then(({ list, items }) => {
            setLists((ls) => ls.map((l) => (l.id === list.id ? list : l)));
            setItemsByList((m) => ({ ...m, [list.id]: items }));
          })
          .catch(() => {});
      }
    }
  }, [lists, selectedId, wsId]);

  const selectedList = lists.find((l) => l.id === selectedId) ?? null;
  const items = useMemo(
    () => (selectedId ? (itemsByList[selectedId] ?? []) : []),
    [selectedId, itemsByList],
  );

  const onCreateDefaultWorkspace = async () => {
    setCreatingDefaultWs(true);
    try {
      await createWorkspace("Default Workspace");
      toast.success("Workspace created");
    } catch (e: any) {
      toast.error("Couldn't create workspace", { description: e?.message });
    } finally {
      setCreatingDefaultWs(false);
    }
  };

  const onCreateList = async (name: string) => {
    if (!wsId) return;
    setCreatingList(true);
    try {
      const { list, items } = await api.createList(wsId, name);
      setLists((ls) => [list, ...ls]);
      setItemsByList((m) => ({ ...m, [list.id]: items }));
      setSelectedId(list.id);
      toast.success(`Created "${name}"`);
    } catch (e: any) {
      toast.error("Couldn't create project", { description: e?.message });
    } finally {
      setCreatingList(false);
    }
  };

  const onRenameList = async (id: string, name: string) => {
    if (!wsId) return;
    try {
      const { list, items } = await api.renameList(wsId, id, name);
      setLists((ls) => ls.map((l) => (l.id === list.id ? list : l)));
      setItemsByList((m) => ({ ...m, [list.id]: items }));
      toast.success("Project renamed");
    } catch (e: any) {
      toast.error("Couldn't rename project", { description: e?.message });
    }
  };

  const onUpdateDescription = async (description: string) => {
    if (!selectedId || !wsId) return;
    try {
      const { list, items } = await api.updateList(wsId, selectedId, {
        description: description || null,
      });
      setLists((ls) => ls.map((l) => (l.id === list.id ? list : l)));
      setItemsByList((m) => ({ ...m, [list.id]: items }));
      toast.success(description ? "Subtitle saved" : "Subtitle removed");
    } catch (e: any) {
      toast.error("Couldn't update subtitle", { description: e?.message });
    }
  };

  const onUploadImage = async (file: File) => {
    if (!selectedId || !wsId) return;
    try {
      const { list, items } = await api.uploadListImage(wsId, selectedId, file);
      setLists((ls) => ls.map((l) => (l.id === list.id ? list : l)));
      setItemsByList((m) => ({ ...m, [list.id]: items }));
      toast.success("Picture updated");
    } catch (e: any) {
      toast.error("Couldn't upload picture", { description: e?.message });
    }
  };

  const onRemoveImage = async () => {
    if (!selectedId || !wsId) return;
    try {
      const { list, items } = await api.removeListImage(wsId, selectedId);
      setLists((ls) => ls.map((l) => (l.id === list.id ? list : l)));
      setItemsByList((m) => ({ ...m, [list.id]: items }));
      toast.success("Picture removed");
    } catch (e: any) {
      toast.error("Couldn't remove picture", { description: e?.message });
    }
  };

  const requestDeleteList = (id: string) => {
    const l = lists.find((x) => x.id === id);
    if (!l) return;
    setPendingDelete({ id, name: l.name });
  };

  const confirmDelete = async () => {
    if (!pendingDelete || !wsId) return;
    const { id, name } = pendingDelete;
    setPendingDelete(null);
    try {
      await api.deleteList(wsId, id);
      setLists((ls) => ls.filter((l) => l.id !== id));
      setItemsByList((m) => {
        const n = { ...m };
        delete n[id];
        return n;
      });
      if (selectedId === id) {
        const remaining = lists.filter((l) => l.id !== id);
        const nextId = remaining[0]?.id ?? null;
        setSelectedId(nextId);
        if (wsId && nextId) {
          api
            .fetchListDetails(wsId, nextId)
            .then(({ list, items }) => {
              setLists((ls) => ls.map((l) => (l.id === list.id ? list : l)));
              setItemsByList((m) => ({ ...m, [list.id]: items }));
            })
            .catch(() => {});
        }
      }
      toast(`Deleted "${name}"`, { description: "Project removed." });
    } catch (e: any) {
      toast.error("Couldn't delete project", { description: e?.message });
    }
  };

  const onAddItem = async (
    label: string,
    opts: { priority?: Priority; tags?: string[]; description?: string; parentId?: string; deadline?: string } = {},
  ) => {
    if (!selectedId || !wsId) return;
    setAddingItem(true);
    try {
      const { list, items } = await api.createItem(wsId, selectedId, {
        label,
        priority: opts.priority ?? null,
        tags: opts.tags,
        description: opts.description ?? null,
        parent_id: opts.parentId ?? null,
        deadline: opts.deadline ?? null,
      });
      setItemsByList((m) => ({ ...m, [list.id]: items }));
      setLists((ls) => ls.map((l) => (l.id === list.id ? list : l)));
      toast.success(opts.parentId ? "Subtask added" : "Task added");
    } catch (e: any) {
      toast.error("Couldn't add task", { description: e?.message });
    } finally {
      setAddingItem(false);
    }
  };

  const onToggleItem = async (id: string) => {
    if (!selectedId || !wsId) return;
    const before = (itemsByList[selectedId] ?? []).find((i) => i.id === id);
    if (!before) return;
    const nextChecked = !before.checked;
    setItemsByList((m) => ({
      ...m,
      [selectedId]: (m[selectedId] ?? []).map((it) =>
        it.id === id ? { ...it, checked: nextChecked } : it,
      ),
    }));
    try {
      const { list, items } = await api.patchItem(wsId, selectedId, {
        item_id: id,
        checked: nextChecked,
      });
      setItemsByList((m) => ({ ...m, [list.id]: items }));
      setLists((ls) => ls.map((l) => (l.id === list.id ? list : l)));
    } catch (e: any) {
      setItemsByList((m) => ({
        ...m,
        [selectedId]: (m[selectedId] ?? []).map((it) =>
          it.id === id ? { ...it, checked: before.checked } : it,
        ),
      }));
      toast.error("Couldn't update task", { description: e?.message });
    }
  };

  const onRenameItem = async (id: string, label: string) => {
    if (!selectedId || !wsId) return;
    try {
      const { list, items } = await api.patchItem(wsId, selectedId, {
        item_id: id,
        label,
      });
      setItemsByList((m) => ({ ...m, [list.id]: items }));
      setLists((ls) => ls.map((l) => (l.id === list.id ? list : l)));
      toast.success("Task renamed");
    } catch (e: any) {
      toast.error("Couldn't rename task", { description: e?.message });
    }
  };

  const onDeleteItem = async (id: string) => {
    if (!selectedId || !wsId) return;
    const it = (itemsByList[selectedId] ?? []).find((i) => i.id === id);
    try {
      await api.deleteItem(wsId, selectedId, id);
      setItemsByList((m) => ({
        ...m,
        // subtasks cascade at the DB level — drop them locally too
        [selectedId]: (m[selectedId] ?? []).filter(
          (i) => i.id !== id && i.parentId !== id,
        ),
      }));
      setLists((ls) =>
        ls.map((l) => {
          if (l.id !== selectedId) return l;
          return {
            ...l,
            itemCount: Math.max(0, l.itemCount - 1),
            completedCount: Math.max(
              0,
              l.completedCount - (it?.checked ? 1 : 0),
            ),
          };
        }),
      );
      toast("Removed task", { description: it?.label });
    } catch (e: any) {
      toast.error("Couldn't delete task", { description: e?.message });
    }
  };

  const onPatchItem = async (itemId: string, patch: ItemPatch) => {
    if (!selectedId || !wsId) return;
    try {
      const { list, items } = await api.patchItem(wsId, selectedId, {
        item_id: itemId,
        ...patch,
      });
      setItemsByList((m) => ({ ...m, [list.id]: items }));
      setLists((ls) => ls.map((l) => (l.id === list.id ? list : l)));
    } catch (e: any) {
      toast.error("Couldn't update task", { description: e?.message });
    }
  };

  const onBulkSetChecked = async (ids: string[], checked: boolean) => {
    if (!selectedId || !wsId || !ids.length) return;
    const current = itemsByList[selectedId] ?? [];
    const targets = current.filter(
      (i) => ids.includes(i.id) && i.checked !== checked,
    );
    if (!targets.length) return;
    setItemsByList((m) => ({
      ...m,
      [selectedId]: (m[selectedId] ?? []).map((it) =>
        ids.includes(it.id) ? { ...it, checked } : it,
      ),
    }));
    try {
      let lastList: TodoList | null = null;
      let lastItems: TodoItem[] | null = null;
      for (const t of targets) {
        const { list, items } = await api.patchItem(wsId, selectedId, {
          item_id: t.id,
          checked,
        });
        lastList = list;
        lastItems = items;
      }
      if (lastList && lastItems) {
        setItemsByList((m) => ({ ...m, [lastList!.id]: lastItems! }));
        setLists((ls) =>
          ls.map((l) => (l.id === lastList!.id ? lastList! : l)),
        );
      }
      toast.success(
        checked
          ? `Marked ${targets.length} complete`
          : `Marked ${targets.length} active`,
      );
    } catch (e: any) {
      toast.error("Bulk update failed", { description: e?.message });
      if (wsId) loadLists(wsId);
    }
  };

  const onBulkDelete = async (ids: string[]) => {
    if (!selectedId || !wsId || !ids.length) return;
    try {
      for (const id of ids) {
        try {
          await api.deleteItem(wsId, selectedId, id);
        } catch (e: any) {
          // 404 = already cascade-deleted with its parent; anything else rethrows
          if (e?.status !== 404) throw e;
        }
      }
      setItemsByList((m) => ({
        ...m,
        [selectedId]: (m[selectedId] ?? []).filter((i) => !ids.includes(i.id)),
      }));
      const refreshed = await api.fetchLists(wsId);
      setLists(refreshed.lists);
      setItemsByList(refreshed.itemsByList);
      toast.success(`Deleted ${ids.length} task${ids.length === 1 ? "" : "s"}`);
    } catch (e: any) {
      toast.error("Bulk delete failed", { description: e?.message });
      if (wsId) loadLists(wsId);
    }
  };

  const onCheckAll = () => {
    if (!selectedId) return;
    const ids = (itemsByList[selectedId] ?? [])
      .filter((i) => !i.checked)
      .map((i) => i.id);
    onBulkSetChecked(ids, true);
  };
  const onUncheckAll = () => {
    if (!selectedId) return;
    const ids = (itemsByList[selectedId] ?? [])
      .filter((i) => i.checked)
      .map((i) => i.id);
    onBulkSetChecked(ids, false);
  };
  const onDeleteCompleted = () => {
    if (!selectedId) return;
    const ids = (itemsByList[selectedId] ?? [])
      .filter((i) => i.checked)
      .map((i) => i.id);
    if (!ids.length) {
      toast("Nothing to clear", {
        description: "No completed tasks in this list.",
      });
      return;
    }
    onBulkDelete(ids);
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleSelectList = async (id: string) => {
    setSelectedId(id);
    setSidebarOpen(false);
    if (!wsId) return;
    try {
      const { list, items } = await api.fetchListDetails(wsId, id);
      setLists((ls) => ls.map((l) => (l.id === list.id ? list : l)));
      setItemsByList((m) => ({ ...m, [list.id]: items }));
    } catch (e: any) {
      toast.error("Failed to fetch list items", { description: e?.message });
    }
  };

  const showLoading = !ready || initialLoading;
  const showError = !!loadError;
  const showEmptyWorkspace = ready && workspaces.length === 0;

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      <TopBar
        dark={dark}
        onToggleDark={onToggleDark}
        onMenuToggle={() => setSidebarOpen((o) => !o)}
        notesOpen={notesOpen}
        onNotesToggle={() => setNotesOpen((o) => !o)}
      />

      <div className="flex-1 relative min-h-0">
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 top-14 z-20 md:hidden bg-background/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div className="h-full grid grid-cols-1 md:grid-cols-[300px_1fr]">
          {/* Sidebar: fixed overlay on mobile, grid item on desktop */}
          <div
            className={[
              "fixed top-14 bottom-0 left-0 w-[280px] z-30",
              "md:static md:top-auto md:bottom-auto md:left-auto md:w-auto md:z-auto",
              "transition-transform duration-200 ease-in-out",
              sidebarOpen
                ? "translate-x-0"
                : "-translate-x-full md:translate-x-0",
            ].join(" ")}
          >
            <Sidebar
              lists={lists}
              selectedId={selectedId}
              onSelect={handleSelectList}
              onDelete={requestDeleteList}
              onCreate={onCreateList}
              onRename={onRenameList}
              loading={showLoading}
              creating={creatingList}
              error={
                showError ? (loadError ?? "Server returned an error.") : null
              }
              onLogout={handleLogout}
              disabled={!wsId}
            />
          </div>

          <main className="min-w-0 paper overflow-hidden">
            {showEmptyWorkspace ? (
              <EmptyWorkspaceCTA
                loading={creatingDefaultWs}
                onCreate={onCreateDefaultWorkspace}
              />
            ) : showError ? (
              <div className="max-w-3xl mx-auto px-6 md:px-10 py-10">
                <ErrorPanel
                  title="We couldn&apos;t load your projects"
                  message={
                    loadError ??
                    "The backend responded with an unexpected error."
                  }
                  onRetry={() => wsId && loadLists(wsId)}
                />
              </div>
            ) : lists.length === 0 ? (
              <NoListsEmpty
                onFocusCreate={() => {
                  setSidebarOpen(true);
                  setTimeout(() => {
                    const el = document.getElementById("new-list");
                    (el as HTMLInputElement | null)?.focus();
                  }, 250);
                }}
              />
            ) : !selectedList ? (
              <NoSelection />
            ) : (
              <MainPanel
                list={selectedList}
                wsId={wsId!}
                items={items}
                tags={tags}
                loading={showLoading}
                onAdd={onAddItem}
                onToggle={onToggleItem}
                onDelete={onDeleteItem}
                onRenameItem={onRenameItem}
                onRenameList={(name) => onRenameList(selectedList.id, name)}
                onUpdateDescription={onUpdateDescription}
                onUploadImage={onUploadImage}
                onRemoveImage={onRemoveImage}
                onPatchItem={onPatchItem}
                onBulkSetChecked={onBulkSetChecked}
                onBulkDelete={onBulkDelete}
                onCheckAll={onCheckAll}
                onUncheckAll={onUncheckAll}
                onDeleteCompleted={onDeleteCompleted}
                onDeleteList={() => requestDeleteList(selectedList.id)}
                adding={addingItem}
                onCreateTag={createTag}
              />
            )}
          </main>
        </div>
      </div>

      <FloatingChat />

      <QuickNotes
        open={notesOpen}
        onOpenChange={setNotesOpen}
        wsId={wsId}
        projects={lists}
        onTasksAdded={(projectId) => {
          if (!wsId) return;
          api
            .fetchListDetails(wsId, projectId)
            .then(({ list, items }) => {
              setLists((ls) => ls.map((l) => (l.id === list.id ? list : l)));
              setItemsByList((m) => ({ ...m, [list.id]: items }));
            })
            .catch(() => {});
        }}
      />

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{pendingDelete?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the list and all of its tasks. This
              action can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete list
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EmptyWorkspaceCTA({
  loading,
  onCreate,
}: {
  loading: boolean;
  onCreate: () => void;
}) {
  return (
    <div className="grid place-items-center min-h-[60vh] px-6">
      <div className="text-center max-w-md">
        <div
          className="mx-auto size-16 rounded-2xl grid place-items-center shadow-soft-md"
          style={{
            background: "color-mix(in oklab, var(--gb-aqua) 18%, var(--card))",
          }}
        >
          <FolderPlus className="size-7" style={{ color: "var(--gb-aqua)" }} />
        </div>
        <h2 className="mt-5">No workspace yet.</h2>
        <p className="mt-2 text-muted-foreground">
          Workspaces keep your projects organized. Create one to get started.
        </p>
        <Button onClick={onCreate} disabled={loading} className="mt-5 gap-2">
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <FolderPlus className="size-4" />
          )}
          Create Default Workspace
        </Button>
      </div>
    </div>
  );
}
