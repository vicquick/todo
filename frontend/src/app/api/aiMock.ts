// Mock AI + MCP service layer. Persisted in localStorage.
// Designed so a real backend (LiteLLM / PydanticAI / MCP) can replace each
// `*Api` namespace below without touching the UI.

const KEY = {
  settings: "cairn.ai.settings",
  privacy: "cairn.ai.privacy",
  conversations: "cairn.ai.conversations",
  mcp: "cairn.mcp.config",
};

const delay = (ms = 280) => new Promise((r) => setTimeout(r, ms));
const uid = () => Math.random().toString(36).slice(2, 10);

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, value: T) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ---------- Providers / models ----------

export type ProviderId = "openai" | "anthropic" | "gemini" | "ollama" | "openrouter" | "custom";

export type ProviderInfo = {
  id: ProviderId;
  name: string;
  defaultBaseUrl: string;
  models: string[];
};

export const PROVIDERS: ProviderInfo[] = [
  { id: "openai",     name: "OpenAI",        defaultBaseUrl: "https://api.openai.com/v1",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"] },
  { id: "anthropic",  name: "Anthropic",     defaultBaseUrl: "https://api.anthropic.com/v1",
    models: ["claude-opus-4-7", "claude-sonnet-4-6", "claude-haiku-4-5"] },
  { id: "gemini",     name: "Google Gemini", defaultBaseUrl: "https://generativelanguage.googleapis.com/v1",
    models: ["gemini-1.5-pro", "gemini-1.5-flash"] },
  { id: "ollama",     name: "Ollama",        defaultBaseUrl: "http://localhost:11434/v1",
    models: ["llama3.1", "mistral", "qwen2.5"] },
  { id: "openrouter", name: "OpenRouter",    defaultBaseUrl: "https://openrouter.ai/api/v1",
    models: ["openrouter/auto", "anthropic/claude-3.5-sonnet"] },
  { id: "custom",     name: "Custom",        defaultBaseUrl: "",
    models: [] },
];

// ---------- AI settings ----------

export type AISettings = {
  enabled: boolean;
  providerId: ProviderId;
  baseUrl: string;
  model: string;
  apiKey: string;
  lastConnectedAt: string | null;
  connectionStatus: "unknown" | "ok" | "failed";
};

const DEFAULT_AI_SETTINGS: AISettings = {
  enabled: false,
  providerId: "anthropic",
  baseUrl: "https://api.anthropic.com/v1",
  model: "claude-sonnet-4-6",
  apiKey: "",
  lastConnectedAt: null,
  connectionStatus: "unknown",
};

export const aiSettingsApi = {
  async get(): Promise<AISettings> {
    await delay(80);
    return read<AISettings>(KEY.settings, DEFAULT_AI_SETTINGS);
  },
  async update(patch: Partial<AISettings>): Promise<AISettings> {
    await delay(120);
    const next = { ...read<AISettings>(KEY.settings, DEFAULT_AI_SETTINGS), ...patch };
    write(KEY.settings, next);
    return next;
  },
  async testConnection(): Promise<{ ok: boolean; message: string; at: string }> {
    await delay(900);
    const cur = read<AISettings>(KEY.settings, DEFAULT_AI_SETTINGS);
    const ok = cur.apiKey.trim().length >= 6 && cur.baseUrl.trim().length > 0;
    const at = new Date().toISOString();
    const next: AISettings = {
      ...cur,
      lastConnectedAt: ok ? at : cur.lastConnectedAt,
      connectionStatus: ok ? "ok" : "failed",
    };
    write(KEY.settings, next);
    return {
      ok,
      message: ok
        ? `Connected to ${cur.providerId} · ${cur.model}`
        : "Connection failed — check your API key and base URL.",
      at,
    };
  },
};

// ---------- Privacy controls ----------

export type PrivacySettings = {
  saveHistory: boolean;
  allowDataModification: boolean;
  allowExternalMcp: boolean;
};

const DEFAULT_PRIVACY: PrivacySettings = {
  saveHistory: false,
  allowDataModification: false,
  allowExternalMcp: false,
};

export const privacyApi = {
  async get(): Promise<PrivacySettings> {
    await delay(60);
    return read<PrivacySettings>(KEY.privacy, DEFAULT_PRIVACY);
  },
  async update(patch: Partial<PrivacySettings>): Promise<PrivacySettings> {
    await delay(100);
    const next = { ...read<PrivacySettings>(KEY.privacy, DEFAULT_PRIVACY), ...patch };
    write(KEY.privacy, next);
    return next;
  },
};

// ---------- Conversations ----------

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  generated?: GeneratedListPayload;
};

export type Conversation = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
};

export type GeneratedListPayload = {
  kind: "list";
  title: string;
  items: string[];
};

export const conversationsApi = {
  async list(): Promise<Conversation[]> {
    await delay(120);
    const all = read<Conversation[]>(KEY.conversations, []);
    return [...all].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },
  async get(id: string): Promise<Conversation | null> {
    await delay(80);
    return read<Conversation[]>(KEY.conversations, []).find((c) => c.id === id) ?? null;
  },
  async create(title: string): Promise<Conversation> {
    await delay(80);
    const now = new Date().toISOString();
    const c: Conversation = { id: uid(), title, createdAt: now, updatedAt: now, messages: [] };
    const all = read<Conversation[]>(KEY.conversations, []);
    write(KEY.conversations, [c, ...all]);
    return c;
  },
  async append(id: string, msg: ChatMessage): Promise<Conversation> {
    const all = read<Conversation[]>(KEY.conversations, []);
    const idx = all.findIndex((c) => c.id === id);
    if (idx < 0) throw new Error("Conversation not found");
    const next = { ...all[idx], messages: [...all[idx].messages, msg], updatedAt: new Date().toISOString() };
    if (next.title === "New conversation" && msg.role === "user") {
      next.title = msg.content.slice(0, 60);
    }
    all[idx] = next;
    write(KEY.conversations, all);
    return next;
  },
  async remove(id: string): Promise<void> {
    await delay(80);
    write(KEY.conversations, read<Conversation[]>(KEY.conversations, []).filter((c) => c.id !== id));
  },
  async clear(): Promise<void> {
    await delay(120);
    write(KEY.conversations, []);
  },
};

// ---------- Mock generation engine ----------

// Heuristic, deterministic, content-shaped responses so the demo feels real
// without a backend. Replace with a real LLM call later.
function generateListFromPrompt(prompt: string): GeneratedListPayload {
  const p = prompt.toLowerCase();
  if (p.includes("kubernetes") || p.includes("k8s") || p.includes("deployment checklist")) {
    return {
      kind: "list",
      title: "Kubernetes deployment checklist",
      items: [
        "Configure ingress and DNS",
        "Configure TLS certificates",
        "Set resource requests and limits",
        "Set up readiness and liveness probes",
        "Set up monitoring and alerting",
        "Configure backups and disaster recovery",
        "Verify rollout strategy and rollback plan",
        "Run a smoke test against staging",
      ],
    };
  }
  if (p.includes("fastapi") || p.includes("api deployment")) {
    return {
      kind: "list",
      title: "FastAPI deployment checklist",
      items: [
        "Pin Python and dependency versions",
        "Containerize with a slim base image",
        "Set up Uvicorn/Gunicorn with workers",
        "Configure environment variables and secrets",
        "Wire up structured logging",
        "Add /health and /readiness endpoints",
        "Run migrations as a release step",
        "Enable rate limiting and CORS",
      ],
    };
  }
  if (p.includes("goa") || p.includes("trip") || p.includes("travel")) {
    return {
      kind: "list",
      title: "Goa trip plan",
      items: [
        "Book flights and confirm seats",
        "Reserve accommodation in North Goa",
        "Plan beach itinerary (Baga, Anjuna, Vagator)",
        "Shortlist restaurants and shacks",
        "Arrange airport pickup or scooter rental",
        "Pack sunscreen, swimwear, light cottons",
        "Organize travel insurance and IDs",
      ],
    };
  }
  if (p.includes("grocery") || p.includes("groceries")) {
    return {
      kind: "list",
      title: "Weekly grocery list (family of four)",
      items: [
        "Milk, yogurt, butter",
        "Eggs (dozen)",
        "Bread and oats",
        "Chicken, paneer, tofu",
        "Seasonal vegetables",
        "Fruits — bananas, apples, berries",
        "Rice, lentils, pasta",
        "Cooking oil, salt, spices",
      ],
    };
  }
  if (p.includes("onboard")) {
    return {
      kind: "list",
      title: "New hire onboarding",
      items: [
        "Create accounts and assign hardware",
        "Share team handbook and goals",
        "Schedule 1:1s with key collaborators",
        "Pair on a starter task",
        "Walk through the deployment process",
        "30-day check-in",
      ],
    };
  }
  // Generic fallback: turn the prompt into a 5-item plan.
  const seed = prompt.replace(/[^\p{L}\p{N}\s]/gu, "").trim() || "your idea";
  const stem = seed.length > 60 ? `${seed.slice(0, 60)}…` : seed;
  return {
    kind: "list",
    title: `Plan: ${stem}`,
    items: [
      "Define the goal and success criteria",
      "Break the work into small steps",
      "Identify blockers and dependencies",
      "Schedule the first action this week",
      "Review progress and adjust",
    ],
  };
}

function generateExpansionFor(listName: string, existing: string[]): string[] {
  const have = new Set(existing.map((s) => s.toLowerCase().trim()));
  const candidate = generateListFromPrompt(listName).items;
  const extra = candidate.filter((c) => !have.has(c.toLowerCase().trim()));
  return extra.length ? extra : [
    "Document acceptance criteria",
    "Add a follow-up review",
    "Capture lessons learned",
  ];
}

function plainAnswer(prompt: string): string {
  const p = prompt.toLowerCase().trim();
  if (!p) return "How can I help?";
  if (p.startsWith("what") || p.startsWith("how") || p.endsWith("?")) {
    return `Here's a concise take on "${prompt.slice(0, 80)}":\n\n• Start by clarifying the goal.\n• Identify the smallest first step.\n• Iterate with short feedback loops.\n\nLet me know if you'd like a checklist for this.`;
  }
  return `Got it. I can turn that into a list, expand an existing list, or just answer questions. Try "Create a checklist for ${prompt.slice(0, 40)}".`;
}

export type GenerationRequest =
  | { mode: "answer"; prompt: string }
  | { mode: "list"; prompt: string }
  | { mode: "expand"; listName: string; existing: string[] };

export type StreamChunk =
  | { type: "text"; delta: string }
  | { type: "payload"; payload: GeneratedListPayload }
  | { type: "done" }
  | { type: "error"; message: string };

export const generationApi = {
  // Streamed generation. Returns a cancel function.
  stream(req: GenerationRequest, onChunk: (c: StreamChunk) => void): () => void {
    const settings = read<AISettings>(KEY.settings, DEFAULT_AI_SETTINGS);
    let cancelled = false;
    let timers: number[] = [];

    const fail = (message: string) => {
      timers.push(window.setTimeout(() => { if (!cancelled) onChunk({ type: "error", message }); }, 200));
    };

    if (!settings.enabled) { fail("AI is disabled. Enable AI in Settings to use the assistant."); return () => { cancelled = true; }; }
    if (!settings.apiKey.trim()) { fail("No API key configured. Add one in Settings → AI."); return () => { cancelled = true; }; }

    let text = "";
    let payload: GeneratedListPayload | undefined;

    if (req.mode === "list") {
      payload = generateListFromPrompt(req.prompt);
      text = `Here's a draft list based on "${req.prompt.slice(0, 60)}". Review and edit before saving.`;
    } else if (req.mode === "expand") {
      const items = generateExpansionFor(req.listName, req.existing);
      payload = { kind: "list", title: req.listName, items };
      text = `Suggested additions for "${req.listName}". Confirm before applying.`;
    } else {
      text = plainAnswer(req.prompt);
    }

    const tokens = text.split(/(\s+)/);
    let i = 0;
    const tick = () => {
      if (cancelled) return;
      if (i >= tokens.length) {
        if (payload) onChunk({ type: "payload", payload });
        onChunk({ type: "done" });
        return;
      }
      onChunk({ type: "text", delta: tokens[i] });
      i++;
      timers.push(window.setTimeout(tick, 18 + Math.random() * 32));
    };
    timers.push(window.setTimeout(tick, 220));

    return () => { cancelled = true; timers.forEach((t) => clearTimeout(t)); };
  },
};

// ---------- MCP ----------

export type MCPTool = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
};

export type MCPConfig = {
  enabled: boolean;
  serverUrl: string;
  serverStatus: "connected" | "disconnected" | "error";
  lastCheckedAt: string | null;
  tools: MCPTool[];
};

const DEFAULT_TOOLS: MCPTool[] = [
  { id: "create_list",      name: "create_list",      description: "Create a new list in the active workspace.",   enabled: true },
  { id: "update_list",      name: "update_list",      description: "Rename or modify an existing list.",           enabled: true },
  { id: "delete_list",      name: "delete_list",      description: "Permanently delete a list and its tasks.",     enabled: false },
  { id: "create_item",      name: "create_item",      description: "Add a task to a specific list.",               enabled: true },
  { id: "update_item",      name: "update_item",      description: "Update a task's label or completion state.",   enabled: true },
  { id: "delete_item",      name: "delete_item",      description: "Remove a task from a list.",                   enabled: false },
  { id: "create_workspace", name: "create_workspace", description: "Create a new workspace.",                      enabled: false },
  { id: "update_workspace", name: "update_workspace", description: "Rename or modify a workspace.",                enabled: false },
];

const DEFAULT_MCP: MCPConfig = {
  enabled: false,
  serverUrl: "http://localhost:8765/mcp",
  serverStatus: "disconnected",
  lastCheckedAt: null,
  tools: DEFAULT_TOOLS,
};

export const mcpApi = {
  async get(): Promise<MCPConfig> {
    await delay(100);
    return read<MCPConfig>(KEY.mcp, DEFAULT_MCP);
  },
  async update(patch: Partial<MCPConfig>): Promise<MCPConfig> {
    await delay(120);
    const cur = read<MCPConfig>(KEY.mcp, DEFAULT_MCP);
    const next = { ...cur, ...patch };
    write(KEY.mcp, next);
    return next;
  },
  async setToolEnabled(toolId: string, enabled: boolean): Promise<MCPConfig> {
    await delay(80);
    const cur = read<MCPConfig>(KEY.mcp, DEFAULT_MCP);
    const next: MCPConfig = {
      ...cur,
      tools: cur.tools.map((t) => t.id === toolId ? { ...t, enabled } : t),
    };
    write(KEY.mcp, next);
    return next;
  },
  async checkConnection(): Promise<MCPConfig> {
    await delay(700);
    const cur = read<MCPConfig>(KEY.mcp, DEFAULT_MCP);
    const ok = cur.enabled && cur.serverUrl.trim().length > 0;
    const next: MCPConfig = {
      ...cur,
      serverStatus: ok ? "connected" : "disconnected",
      lastCheckedAt: new Date().toISOString(),
    };
    write(KEY.mcp, next);
    return next;
  },
};
