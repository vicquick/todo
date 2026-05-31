import type { TodoList } from "../components/todo/Sidebar";
import type { TodoItem } from "../components/todo/MainPanel";

const BASE_URL: string =
  (import.meta as any).env?.VITE_API_BASE_URL ?? "http://localhost:8888";

type ServerItem = { id: string; label: string; checked: boolean };
type ServerListSummary = { id: string; name: string; item_count: number };
type ServerListFull = { id: string; name: string; items: ServerItem[] };

const ACCENTS: TodoList["accent"][] = ["orange", "aqua", "purple", "blue", "yellow", "green"];
function accentFor(id: string): TodoList["accent"] {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return ACCENTS[h % ACCENTS.length];
}

function toItem(i: ServerItem): TodoItem {
  return { id: i.id, label: i.label, checked: !!i.checked };
}

export function toTodoListFromFull(l: ServerListFull): TodoList {
  const items = l.items ?? [];
  return {
    id: l.id,
    name: l.name,
    itemCount: items.length,
    completedCount: items.filter((x) => x.checked).length,
    accent: accentFor(l.id),
  };
}

export function toTodoListFromSummary(l: ServerListSummary): TodoList {
  return {
    id: l.id,
    name: l.name,
    itemCount: l.item_count ?? 0,
    completedCount: 0, 
    accent: accentFor(l.id),
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function fetchLists(): Promise<{ lists: TodoList[]; itemsByList: Record<string, TodoItem[]> }> {
  const data = await request<ServerListSummary[]>("/api/lists");
  const lists = data.map(toTodoListFromSummary);
  // remove pre-populating itemsByList here — we'll fetch items from /api/lists/{id} when needed
  const itemsByList: Record<string, TodoItem[]> = {};
  return { lists, itemsByList };
}

export async function fetchList(listId: string): Promise<{ list: TodoList; items: TodoItem[] }> {
  const data = await request<ServerListFull>(`/api/lists/${listId}`);
  return { list: toTodoListFromFull(data), items: (data.items ?? []).map(toItem) };
}

export async function createList(name: string): Promise<{ list: TodoList; items: TodoItem[] }> {
  const data = await request<ServerListFull>("/api/lists", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  return { list: toTodoListFromFull(data), items: (data.items ?? []).map(toItem) };
}

export async function deleteList(listId: string): Promise<void> {
  await request<void>(`/api/lists/${listId}`, { method: "DELETE" });
}

export async function createItem(listId: string, label: string): Promise<{ list: TodoList; items: TodoItem[] }> {
  const data = await request<ServerListFull>(`/api/lists/${listId}/items`, {
    method: "POST",
    body: JSON.stringify({ label, checked: false }),
  });
  return { list: toTodoListFromFull(data), items: (data.items ?? []).map(toItem) };
}

export async function toggleItem(listId: string, itemId: string, checked: boolean): Promise<{ list: TodoList; items: TodoItem[] }> {
  const data = await request<ServerListFull>(`/api/lists/${listId}/items`, {
    method: "PATCH",
    body: JSON.stringify({ item_id: itemId, checked }),
  });
  return { list: toTodoListFromFull(data), items: (data.items ?? []).map(toItem) };
}

export async function deleteItem(listId: string, itemId: string): Promise<void> {
  await request<void>(`/api/lists/${listId}/items/${itemId}`, { method: "DELETE" });
}
