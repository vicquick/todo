import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import * as api from "../api/client";
import { Workspace } from "../api/client";
import { Tag, tagFromName, tagsLocalStore } from "../api/mock";
import { useAuth } from "../auth/AuthContext";

const ACTIVE_WS_KEY = "cairn.activeWorkspace";

type Ctx = {
  ready: boolean;

  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  setActiveWorkspace: (id: string) => void;
  refreshWorkspaces: () => Promise<Workspace[]>;
  createWorkspace: (name: string) => Promise<Workspace>;
  renameWorkspace: (id: string, name: string) => Promise<Workspace>;
  deleteWorkspace: (id: string) => Promise<void>;

  tags: Tag[];
  refreshTags: () => Promise<void>;
  createTag: (name: string) => Promise<Tag>;
  renameTag: (oldName: string, newName: string) => Promise<void>;
  deleteTag: (name: string) => Promise<void>;
};

const AppDataCtx = createContext<Ctx | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const [ready, setReady] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState<string | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const loadedFor = useRef<string | null>(null);

  const refreshWorkspaces = useCallback(async () => {
    const ws = await api.fetchWorkspaces();
    setWorkspaces(ws);
    return ws;
  }, []);

  const refreshTags = useCallback(async () => {
    try {
      const remote = await api.fetchUserTags();
      const local = tagsLocalStore.list();
      const merged = Array.from(new Set([...remote, ...local]));
      setTags(merged.map(tagFromName));
    } catch {
      setTags(tagsLocalStore.list().map(tagFromName));
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated") {
      setReady(false);
      setWorkspaces([]);
      setTags([]);
      setActiveWorkspaceIdState(null);
      loadedFor.current = null;
      return;
    }
    if (loadedFor.current === "loaded") return;
    loadedFor.current = "loaded";
    (async () => {
      let ws = await refreshWorkspaces();

      // Auto-create a Default Workspace if the user has none yet
      if (ws.length === 0) {
        try {
          const defaultWs = await api.createWorkspace("Default Workspace");
          ws = [defaultWs];
          setWorkspaces([defaultWs]);
          setActiveWorkspaceIdState(defaultWs.id);
          try { localStorage.setItem(ACTIVE_WS_KEY, defaultWs.id); } catch {}
          await refreshTags();
          setReady(true);
          return;
        } catch {
          // If auto-creation fails, fall through so the CTA is shown
        }
      }

      const stored = (() => { try { return localStorage.getItem(ACTIVE_WS_KEY); } catch { return null; } })();
      const active = stored && ws.some((w) => w.id === stored) ? stored : (ws[0]?.id ?? null);
      setActiveWorkspaceIdState(active);
      await refreshTags();
      setReady(true);
    })().catch(() => setReady(true));
  }, [status, refreshWorkspaces, refreshTags]);

  const setActiveWorkspace = useCallback((id: string) => {
    setActiveWorkspaceIdState(id);
    try { localStorage.setItem(ACTIVE_WS_KEY, id); } catch {}
  }, []);

  const createWorkspace = useCallback(async (name: string) => {
    const w = await api.createWorkspace(name);
    setWorkspaces((arr) => [w, ...arr]);
    return w;
  }, []);

  const renameWorkspace = useCallback(async (id: string, name: string) => {
    const w = await api.updateWorkspace(id, name);
    setWorkspaces((arr) => arr.map((x) => x.id === id ? { ...x, ...w } : x));
    return w;
  }, []);

  const deleteWorkspace = useCallback(async (id: string) => {
    await api.deleteWorkspace(id);
    setWorkspaces((arr) => {
      const next = arr.filter((w) => w.id !== id);
      if (activeWorkspaceId === id) {
        const fallback = next[0]?.id ?? null;
        setActiveWorkspaceIdState(fallback);
        try { fallback ? localStorage.setItem(ACTIVE_WS_KEY, fallback) : localStorage.removeItem(ACTIVE_WS_KEY); } catch {}
      }
      return next;
    });
  }, [activeWorkspaceId]);

  const createTag = useCallback(async (name: string) => {
    tagsLocalStore.add(name);
    await refreshTags();
    return tagFromName(name);
  }, [refreshTags]);
  const renameTag = useCallback(async (oldName: string, newName: string) => {
    tagsLocalStore.rename(oldName, newName);
    await refreshTags();
  }, [refreshTags]);
  const deleteTag = useCallback(async (name: string) => {
    tagsLocalStore.remove(name);
    await refreshTags();
  }, [refreshTags]);

  const value = useMemo<Ctx>(() => ({
    ready,
    workspaces, activeWorkspaceId, setActiveWorkspace,
    refreshWorkspaces, createWorkspace, renameWorkspace, deleteWorkspace,
    tags, refreshTags, createTag, renameTag, deleteTag,
  }), [ready, workspaces, activeWorkspaceId, setActiveWorkspace,
       refreshWorkspaces, createWorkspace, renameWorkspace, deleteWorkspace,
       tags, refreshTags, createTag, renameTag, deleteTag]);

  return <AppDataCtx.Provider value={value}>{children}</AppDataCtx.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataCtx);
  if (!ctx) throw new Error("useAppData must be used inside AppDataProvider");
  return ctx;
}
