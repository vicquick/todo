import { useEffect, useMemo, useState } from "react";
import { TopBar } from "./components/todo/TopBar";
import type { DemoState } from "./components/todo/TopBar";
import { Sidebar } from "./components/todo/Sidebar";
import type { TodoList } from "./components/todo/Sidebar";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import { MainPanel } from "./components/todo/MainPanel";
import type { TodoItem } from "./components/todo/MainPanel";
import {
  NoListsEmpty,
  NoSelection,
  ErrorPanel,
} from "./components/todo/States";
import * as api from "./api/client";
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

const demoEmptyList: TodoList = {
  id: "demo_empty",
  name: "Reading queue",
  itemCount: 0,
  completedCount: 0,
  accent: "blue",
};

function App() {
  // ------
  // Navbar
  // ------
  const [dark, setDark] = useState(false);
  const [demo, setDemo] = useState<DemoState>("ready");
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // ------
  // Sidebar
  // ------

  const [lists, setLists] = useState<TodoList[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [itemsByList, setItemsByList] = useState<Record<string, TodoItem[]>>(
    {},
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creatingList, setCreatingList] = useState(false);
  const [addingItem, setAddingItem] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const showLoading =
    demo === "loading" || (demo === "ready" && initialLoading);
  const showError = demo === "error" || (demo === "ready" && !!loadError);
  const showOffline = demo === "offline";

  const loadAll = async () => {
    setInitialLoading(true);
    setLoadError(null);
    try {
      const { lists, itemsByList } = await api.fetchLists();
      setLists(lists);
      setItemsByList(itemsByList);
      // compute selected id synchronously so we can fetch its items immediately
      const selected = (() =>
        (selectedId && lists.some((l) => l.id === selectedId) && selectedId) ||
        (lists[0]?.id ?? null))();
      setSelectedId(selected);
      // if we have a selected list, load its full data (items) on initial load
      if (selected) {
        try {
          const { list, items } = await api.fetchList(selected);
          setItemsByList((m) => ({ ...m, [list.id]: items }));
          setLists((ls) => ls.map((l) => (l.id === list.id ? list : l)));
        } catch (e: any) {
          // don't treat failure to fetch a single list as fatal for the whole loadAll
          console.warn("Failed to fetch selected list items:", e?.message ?? e);
        }
      }
    } catch (e: any) {
      setLoadError(e?.message ?? "Failed to load lists");
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadAll(); /* eslint-disable-next-line */
  }, []);

  // Demo overrides — visualize states without touching the API
  useEffect(() => {
    if (demo === "empty-lists") {
      setLists([]);
      setSelectedId(null);
    } else if (demo === "empty-items") {
      setLists([demoEmptyList]);
      setItemsByList({ [demoEmptyList.id]: [] });
      setSelectedId(demoEmptyList.id);
    } else if (demo === "ready") {
      loadAll();
    }
    // loading / error / offline / not-found are pure render overrides
    // eslint-disable-next-line
  }, [demo]);

  const selectedList = lists.find((l) => l.id === selectedId) ?? null;
  const items = useMemo(
    () => (selectedId ? (itemsByList[selectedId] ?? []) : []),
    [selectedId, itemsByList],
  );

  const onCreateList = async (name: string) => {
    setCreatingList(true);
    try {
      const { list, items } = await api.createList(name);
      setLists((ls) => [list, ...ls]);
      setItemsByList((m) => ({ ...m, [list.id]: items }));
      setSelectedId(list.id);
      toast.success(`Created "${name}"`, {
        description: "Ready to add tasks.",
      });
    } catch (e: any) {
      toast.error("Couldn't create list", { description: e?.message });
    } finally {
      setCreatingList(false);
    }
  };

  const requestDeleteList = (id: string) => {
    const l = lists.find((x) => x.id === id);
    if (!l) return;
    setPendingDelete({ id, name: l.name });
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const { id, name } = pendingDelete;
    setPendingDelete(null);
    try {
      await api.deleteList(id);
      setLists((ls) => ls.filter((l) => l.id !== id));
      setItemsByList((m) => {
        const n = { ...m };
        delete n[id];
        return n;
      });
      if (selectedId === id) {
        const remaining = lists.filter((l) => l.id !== id);
        setSelectedId(remaining[0]?.id ?? null);
      }
      toast(`Deleted "${name}"`, { description: "List removed." });
    } catch (e: any) {
      toast.error("Couldn't delete list", { description: e?.message });
    }
  };
  const onAddItem = async (label: string) => {
    if (!selectedId) return;
    setAddingItem(true);
    try {
      const { list, items } = await api.createItem(selectedId, label);
      setItemsByList((m) => ({ ...m, [list.id]: items }));
      setLists((ls) => ls.map((l) => (l.id === list.id ? list : l)));
      toast.success("Task added");
    } catch (e: any) {
      toast.error("Couldn't add task", { description: e?.message });
    } finally {
      setAddingItem(false);
    }
  };

  const onToggleItem = async (id: string) => {
    if (!selectedId) return;
    const before = (itemsByList[selectedId] ?? []).find((i) => i.id === id);
    if (!before) return;
    const nextChecked = !before.checked;
    // Optimistic-feel update kept identical to previous; refetched list replaces it
    setItemsByList((m) => ({
      ...m,
      [selectedId]: (m[selectedId] ?? []).map((it) =>
        it.id === id ? { ...it, checked: nextChecked } : it,
      ),
    }));
    try {
      const { list, items } = await api.toggleItem(selectedId, id, nextChecked);
      setItemsByList((m) => ({ ...m, [list.id]: items }));
      setLists((ls) => ls.map((l) => (l.id === list.id ? list : l)));
    } catch (e: any) {
      // revert
      setItemsByList((m) => ({
        ...m,
        [selectedId]: (m[selectedId] ?? []).map((it) =>
          it.id === id ? { ...it, checked: before.checked } : it,
        ),
      }));
      toast.error("Couldn't update task", { description: e?.message });
    }
  };

  const onDeleteItem = async (id: string) => {
    if (!selectedId) return;
    const it = (itemsByList[selectedId] ?? []).find((i) => i.id === id);
    try {
      await api.deleteItem(selectedId, id);
      setItemsByList((m) => ({
        ...m,
        [selectedId]: (m[selectedId] ?? []).filter((i) => i.id !== id),
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

  // populate itemsByList on-demand when a list is selected
  const handleSelect = async (id: string | null) => {
    setSelectedId(id);
    if (!id) return;
    // if we already have items cached for this list, skip refetch
    if (itemsByList[id] && itemsByList[id].length > 0) return;
    try {
      const { list, items } = await api.fetchList(id);
      setItemsByList((m) => ({ ...m, [list.id]: items }));
      setLists((ls) => ls.map((l) => (l.id === list.id ? list : l)));
    } catch (e: any) {
      toast.error("Couldn't load list", { description: e?.message });
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <TopBar
        dark={dark}
        onToggleDark={() => setDark((d) => !d)}
        demo={demo}
        onDemo={setDemo}
      />

      <div className="flex-1 grid grid-cols-1 md:grid-cols-[300px_1fr] min-h-0">
        <Sidebar
          lists={lists}
          selectedId={selectedId}
          onSelect={handleSelect}
          onDelete={requestDeleteList}
          onCreate={onCreateList}
          loading={showLoading}
          creating={creatingList}
          error={showError ? (loadError ?? "Server returned an error.") : null}
        />

        <main className="min-w-0 paper overflow-hidden">
          {showOffline ? (
            <div className="max-w-3xl mx-auto px-6 md:px-10 py-10">
              <ErrorPanel
                title="You're offline"
                message="Your changes are paused until the connection comes back. We'll sync automatically."
                onRetry={() => setDemo("ready")}
              />
            </div>
          ) : showError ? (
            <div className="max-w-3xl mx-auto px-6 md:px-10 py-10">
              <ErrorPanel
                title="We couldn't load your lists"
                message={
                  loadError ?? "The backend responded with an unexpected error."
                }
                onRetry={() => loadAll()}
              />
            </div>
          ) : lists.length === 0 ? (
            <NoListsEmpty
              onFocusCreate={() => {
                const el = document.getElementById("new-list");
                (el as HTMLInputElement | null)?.focus();
              }}
            />
          ) : !selectedList ? (
            <NoSelection />
          ) : (
            <MainPanel
              list={selectedList}
              items={items}
              loading={showLoading}
              onAdd={onAddItem}
              onToggle={onToggleItem}
              onDelete={onDeleteItem}
              onDeleteList={() => requestDeleteList(selectedList.id)}
              adding={addingItem}
            />
          )}
        </main>
      </div>

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

      <Toaster richColors position="bottom-right" />
    </div>
  );
}

export default App;
