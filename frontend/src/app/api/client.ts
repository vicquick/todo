// API client. All endpoints below are real backend endpoints from the
// OpenAPI spec at src/imports/pasted_text/api-spec-1.json.
// Mock endpoints live in ./aiMock and ./mock — they are clearly isolated so
// real backends can replace them later without touching call sites.

const BASE_URL: string =
  (import.meta as any).env?.VITE_API_BASE_URL ?? "http://localhost:8888";

const TOKEN_KEY = "cairn.auth.token";

export const tokenStore = {
  get(): string | null {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  },
  set(t: string) {
    try { localStorage.setItem(TOKEN_KEY, t); } catch {}
  },
  clear() {
    try { localStorage.removeItem(TOKEN_KEY); } catch {}
  },
};

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;
export function setUnauthorizedHandler(fn: UnauthorizedHandler | null) { onUnauthorized = fn; }

export class ApiError extends Error {
  status: number;
  detail?: any;
  constructor(status: number, message: string, detail?: any) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

type RequestOpts = RequestInit & { auth?: boolean; form?: boolean };

async function request<T>(path: string, opts: RequestOpts = {}): Promise<T> {
  const { auth = true, form = false, headers, ...init } = opts;
  const finalHeaders: Record<string, string> = { ...(headers as any) };
  if (!form && init.body) finalHeaders["Content-Type"] = "application/json";
  if (auth) {
    const t = tokenStore.get();
    if (t) finalHeaders["Authorization"] = `Bearer ${t}`;
  }
  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers: finalHeaders });
  if (res.status === 401) {
    tokenStore.clear();
    onUnauthorized?.();
    throw new ApiError(401, "Unauthorized");
  }
  if (!res.ok) {
    let detail: any = undefined;
    try { detail = await res.json(); } catch {}
    const msg = detail?.detail?.[0]?.msg ?? detail?.detail ?? `${res.status} ${res.statusText}`;
    throw new ApiError(res.status, typeof msg === "string" ? msg : "Request failed", detail);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ───── Types (server shapes + UI shapes) ───────────────────

export type AuthUser = { id: string; username: string; email: string };

export type Workspace = {
  id: string;
  name: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
};

export type ServerItem = {
  item_id: string;
  label: string;
  checked: boolean;
  priority?: number | null; // 1=Low, 2=Medium, 3=High
  tags?: string[];
  description?: string | null;
};

export type ServerList = {
  id: string;
  name: string;
  items?: ServerItem[];
  created_at?: string;
  updated_at?: string;
};

// Re-exported UI types so existing imports keep working.
import type { TodoList } from "../components/todo/Sidebar";
import type { TodoItem } from "../components/todo/MainPanel";

const ACCENTS: TodoList["accent"][] = ["orange", "aqua", "purple", "blue", "yellow", "green"];
function accentFor(id: string): TodoList["accent"] {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return ACCENTS[h % ACCENTS.length];
}

export function toTodoItem(i: ServerItem): TodoItem {
  return {
    id: i.item_id,
    label: i.label,
    checked: !!i.checked,
    priority: (i.priority ?? null) as TodoItem["priority"],
    tags: i.tags ?? [],
    description: i.description ?? null,
  };
}

export function toTodoList(l: ServerList): TodoList {
  const items = l.items ?? [];
  return {
    id: l.id,
    name: l.name,
    itemCount: items.length,
    completedCount: items.filter((x) => x.checked).length,
    accent: accentFor(l.id),
  };
}

// ───── Auth ────────────────────────────────────────────────

export async function login(username: string, password: string): Promise<string> {
  const body = new URLSearchParams();
  body.set("username", username);
  body.set("password", password);
  body.set("grant_type", "password");
  const res = await fetch(`${BASE_URL}/api/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    let detail: any; try { detail = await res.json(); } catch {}
    const msg = detail?.detail ?? `${res.status} ${res.statusText}`;
    throw new ApiError(res.status, typeof msg === "string" ? msg : "Login failed", detail);
  }
  const json = await res.json() as { access_token: string; token_type: string };
  tokenStore.set(json.access_token);
  return json.access_token;
}

export async function signup(username: string, email: string, password: string): Promise<void> {
  await request<void>("/api/user", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ username, email, password }),
  });
}

export async function getMe(): Promise<AuthUser> {
  return request<AuthUser>("/api/auth/me");
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/health`);
    return res.ok;
  } catch { return false; }
}

// ───── User ────────────────────────────────────────────────

export async function updateUser(patch: { username?: string; email?: string }): Promise<AuthUser> {
  return request<AuthUser>("/api/user", {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteUser(): Promise<void> {
  await request<void>("/api/user", { method: "DELETE" });
}

export async function changePassword(current_password: string, new_password: string): Promise<void> {
  await request<void>("/api/user/change-password", {
    method: "PATCH",
    body: JSON.stringify({ current_password, new_password }),
  });
}

export async function fetchUserTags(): Promise<string[]> {
  // Backend returns an unspecified shape; tolerate both array and object.
  const data = await request<any>("/api/user/tags");
  if (Array.isArray(data)) return data.map(String);
  if (Array.isArray(data?.tags)) return data.tags.map(String);
  return [];
}

// ───── Workspaces ──────────────────────────────────────────

export async function fetchWorkspaces(): Promise<Workspace[]> {
  return request<Workspace[]>("/api/workspaces");
}

export async function createWorkspace(name: string): Promise<Workspace> {
  return request<Workspace>("/api/workspaces", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function getWorkspace(id: string): Promise<Workspace> {
  return request<Workspace>(`/api/workspaces/${id}`);
}

export async function updateWorkspace(id: string, name: string): Promise<Workspace> {
  return request<Workspace>(`/api/workspaces/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
}

export async function deleteWorkspace(id: string): Promise<void> {
  await request<void>(`/api/workspaces/${id}`, { method: "DELETE" });
}

// ───── Lists ───────────────────────────────────────────────

export async function fetchLists(workspaceId: string): Promise<{ lists: TodoList[]; itemsByList: Record<string, TodoItem[]> }> {
  const data = await request<ServerList[] | any>(`/api/workspaces/${workspaceId}/lists`);
  const arr: ServerList[] = Array.isArray(data) ? data : (data?.lists ?? []);
  const lists = arr.map(toTodoList);
  const itemsByList: Record<string, TodoItem[]> = {};
  for (const l of arr) itemsByList[l.id] = (l.items ?? []).map(toTodoItem);
  return { lists, itemsByList };
}

export async function fetchListDetails(workspaceId: string, listId: string): Promise<{ list: TodoList; items: TodoItem[] }> {
  const data = await request<ServerList>(`/api/workspaces/${workspaceId}/lists/${listId}`);
  return { list: toTodoList(data), items: (data.items ?? []).map(toTodoItem) };
}

export async function createList(workspaceId: string, name: string): Promise<{ list: TodoList; items: TodoItem[] }> {
  const data = await request<ServerList>(`/api/workspaces/${workspaceId}/lists`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  return { list: toTodoList(data), items: (data.items ?? []).map(toTodoItem) };
}

export async function renameList(workspaceId: string, listId: string, name: string): Promise<{ list: TodoList; items: TodoItem[] }> {
  const data = await request<ServerList>(`/api/workspaces/${workspaceId}/lists/${listId}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
  return { list: toTodoList(data), items: (data.items ?? []).map(toTodoItem) };
}

export async function deleteList(workspaceId: string, listId: string): Promise<void> {
  await request<void>(`/api/workspaces/${workspaceId}/lists/${listId}`, { method: "DELETE" });
}

// ───── Items ───────────────────────────────────────────────

export type ItemCreatePayload = {
  label: string;
  checked?: boolean;
  priority?: number | null;
  tags?: string[];
  description?: string | null;
};

export type ItemPatchPayload = {
  item_id: string;
  label?: string;
  checked?: boolean;
  priority?: number | null;
  tags?: string[];
  description?: string | null;
};

export async function createItem(
  workspaceId: string, listId: string, payload: ItemCreatePayload,
): Promise<{ list: TodoList; items: TodoItem[] }> {
  const body: any = { label: payload.label, checked: payload.checked ?? false };
  if (payload.priority != null) body.priority = payload.priority;
  if (payload.tags && payload.tags.length) body.tags = payload.tags;
  if (payload.description) body.description = payload.description;
  const data = await request<ServerList>(`/api/workspaces/${workspaceId}/lists/${listId}/items`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return { list: toTodoList(data), items: (data.items ?? []).map(toTodoItem) };
}

export async function patchItem(
  workspaceId: string, listId: string, payload: ItemPatchPayload,
): Promise<{ list: TodoList; items: TodoItem[] }> {
  const data = await request<ServerList>(`/api/workspaces/${workspaceId}/lists/${listId}/items`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return { list: toTodoList(data), items: (data.items ?? []).map(toTodoItem) };
}

export async function deleteItem(workspaceId: string, listId: string, itemId: string): Promise<void> {
  await request<void>(`/api/workspaces/${workspaceId}/lists/${listId}/items/${itemId}`, { method: "DELETE" });
}
