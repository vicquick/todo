/**
 * Mock + helper service layer for features whose backend isn't ready yet,
 * plus presentation helpers (priority/tag colors) that ride alongside the
 * real backend data.
 *
 *   tagsApi        → GET is real (/api/user/tags). Local CRUD is mocked
 *                    (no write endpoint exists yet) but exposed through the
 *                    same shape, so a real /api/user/tags POST/PATCH/DELETE
 *                    can drop in here later.
 *   remindersApi   → fully mock (no backend yet)
 *
 * Tag colors are a presentation-only concept derived from the tag name.
 */

const KEYS = {
  tagColors: "cairn.mock.tagColors",       // tagName -> color (presentation only)
  localTags: "cairn.mock.localTags",       // names added locally (until backend write exists)
  reminders: "cairn.mock.reminders",
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}
function write<T>(key: string, val: T) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}
const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

// ─────────────── priority (server: 1|2|3) ───────────────
export type Priority = 1 | 2 | 3;

export const PRIORITY_META: Record<Priority, { label: string; color: string }> = {
  1: { label: "Low",    color: "var(--gb-aqua)"   },
  2: { label: "Medium", color: "var(--gb-yellow)" },
  3: { label: "High",   color: "var(--gb-red)"    },
};

export const PRIORITIES: Priority[] = [3, 2, 1];

// ─────────────── tags ───────────────────
export type TagColor = "orange" | "aqua" | "purple" | "blue" | "yellow" | "green" | "red";
export const TAG_COLORS: TagColor[] = ["orange", "aqua", "purple", "blue", "yellow", "green", "red"];
export const tagColorVar = (c: TagColor) => `var(--gb-${c})`;

/** Tags on the server are bare strings. We derive a presentation color
 *  from the name (overridable locally) so they render consistently. */
export type Tag = { id: string; name: string; color: TagColor };

function colorForName(name: string): TagColor {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return TAG_COLORS[h % TAG_COLORS.length];
}

export function tagFromName(name: string): Tag {
  const colors = read<Record<string, TagColor>>(KEYS.tagColors, {});
  const color = colors[name] ?? colorForName(name);
  return { id: name, name, color };
}

export function setTagColor(name: string, color: TagColor) {
  const colors = read<Record<string, TagColor>>(KEYS.tagColors, {});
  colors[name] = color;
  write(KEYS.tagColors, colors);
}

export const tagsLocalStore = {
  list(): string[] {
    return read<string[]>(KEYS.localTags, []);
  },
  add(name: string) {
    const cur = read<string[]>(KEYS.localTags, []);
    if (!cur.includes(name)) write(KEYS.localTags, [...cur, name]);
  },
  remove(name: string) {
    write(KEYS.localTags, read<string[]>(KEYS.localTags, []).filter((n) => n !== name));
  },
  rename(oldName: string, newName: string) {
    write(KEYS.localTags, read<string[]>(KEYS.localTags, []).map((n) => n === oldName ? newName : n));
    const colors = read<Record<string, TagColor>>(KEYS.tagColors, {});
    if (colors[oldName]) { colors[newName] = colors[oldName]; delete colors[oldName]; write(KEYS.tagColors, colors); }
  },
};

// ─────────────── reminders ──────────────
export type ReminderPrefs = {
  emailReminders: boolean;
  frequency: "daily" | "weekly" | "off";
  preferredTime: "morning" | "afternoon" | "evening";
  emailAddress: string;
};

const DEFAULT_REMINDERS: ReminderPrefs = {
  emailReminders: false,
  frequency: "daily",
  preferredTime: "morning",
  emailAddress: "",
};

export const remindersApi = {
  async get(): Promise<ReminderPrefs> {
    await delay();
    return read<ReminderPrefs>(KEYS.reminders, DEFAULT_REMINDERS);
  },
  async save(prefs: ReminderPrefs): Promise<ReminderPrefs> {
    await delay();
    write(KEYS.reminders, prefs);
    return prefs;
  },
};
