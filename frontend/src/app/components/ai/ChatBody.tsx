import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import {
  Send, Sparkles, ListPlus, RotateCcw, Settings2,
  AlertCircle, Loader2, Check, X, Plus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  conversationsApi, generationApi, Conversation, ChatMessage, GeneratedListPayload,
} from "../../api/aiMock";
import { useAI } from "../../state/AIContext";
import { useAppData } from "../../state/AppDataContext";
import * as api from "../../api/client";

type Mode = "answer" | "list";

export function ChatBody() {
  const { ai, privacy } = useAI();
  const { activeWorkspaceId } = useAppData();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [draft, setDraft] = useState("");
  const [mode, setMode] = useState<Mode>("answer");
  const [streaming, setStreaming] = useState<string | null>(null);
  const [streamErr, setStreamErr] = useState<string | null>(null);
  const [pendingPayload, setPendingPayload] = useState<GeneratedListPayload | null>(null);
  const [savingList, setSavingList] = useState(false);
  const cancelRef = useRef<(() => void) | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastUserPromptRef = useRef<{ prompt: string; mode: Mode } | null>(null);
  const startedRef = useRef(false);

  // Start an ephemeral or persisted session once.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    let alive = true;
    (async () => {
      if (privacy.saveHistory) {
        const c = await conversationsApi.create("New conversation");
        if (alive) setConversation(c);
      } else {
        const now = new Date().toISOString();
        if (alive) setConversation({ id: "ephemeral", title: "New conversation", createdAt: now, updatedAt: now, messages: [] });
      }
    })();
    return () => { alive = false; };
  }, [privacy.saveHistory]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [conversation?.messages.length, streaming]);

  const persistMessage = async (msg: ChatMessage) => {
    if (!conversation) return;
    if (conversation.id === "ephemeral" || !privacy.saveHistory) {
      setConversation((c) => c ? {
        ...c,
        messages: [...c.messages, msg],
        updatedAt: new Date().toISOString(),
        title: c.title === "New conversation" && msg.role === "user" ? msg.content.slice(0, 60) : c.title,
      } : c);
      return;
    }
    const next = await conversationsApi.append(conversation.id, msg);
    setConversation(next);
  };

  const runGeneration = (prompt: string, m: Mode) => {
    setStreamErr(null);
    setPendingPayload(null);
    setStreaming("");
    cancelRef.current?.();
    let buffer = "";
    let payload: GeneratedListPayload | undefined;
    cancelRef.current = generationApi.stream(
      m === "list" ? { mode: "list", prompt } : { mode: "answer", prompt },
      (chunk) => {
        if (chunk.type === "text") {
          buffer += chunk.delta;
          setStreaming(buffer);
        } else if (chunk.type === "payload") {
          payload = chunk.payload;
          setPendingPayload(chunk.payload);
        } else if (chunk.type === "error") {
          setStreaming(null);
          setStreamErr(chunk.message);
        } else if (chunk.type === "done") {
          setStreaming(null);
          const msg: ChatMessage = {
            id: Math.random().toString(36).slice(2, 10),
            role: "assistant",
            content: buffer,
            createdAt: new Date().toISOString(),
            generated: payload,
          };
          persistMessage(msg);
        }
      },
    );
  };

  const onSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const prompt = draft.trim();
    if (!prompt || streaming !== null) return;
    if (!ai.enabled) { toast("AI is disabled", { description: "Enable AI in Settings → AI to use the assistant." }); return; }

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).slice(2, 10),
      role: "user", content: prompt, createdAt: new Date().toISOString(),
    };
    await persistMessage(userMsg);
    lastUserPromptRef.current = { prompt, mode };
    setDraft("");
    runGeneration(prompt, mode);
  };

  const onRetry = () => {
    if (!lastUserPromptRef.current) return;
    runGeneration(lastUserPromptRef.current.prompt, lastUserPromptRef.current.mode);
  };

  const saveGeneratedList = async (payload: GeneratedListPayload) => {
    if (!activeWorkspaceId) {
      toast.error("No active workspace", { description: "Create or select a workspace first." });
      return;
    }
    setSavingList(true);
    try {
      const { list } = await api.createList(activeWorkspaceId, payload.title);
      for (const label of payload.items) {
        await api.createItem(activeWorkspaceId, list.id, { label });
      }
      toast.success(`Saved "${payload.title}"`, { description: `${payload.items.length} tasks added.` });
      setPendingPayload(null);
    } catch (err: any) {
      toast.error("Couldn't save project", { description: err?.message });
    } finally {
      setSavingList(false);
    }
  };

  const messages = conversation?.messages ?? [];
  const empty = messages.length === 0 && streaming === null && !streamErr;

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
        {!ai.enabled && <DisabledBanner />}

        {empty && ai.enabled && <EmptyHints onPick={(p, m) => { setDraft(p); setMode(m); }} />}

        {messages.map((m) => (
          <MessageBubble key={m.id} msg={m} onSaveList={saveGeneratedList} savingList={savingList} />
        ))}

        {streaming !== null && (
          <div className="rounded-lg border border-border bg-card px-3 py-2.5">
            <div className="text-[0.6rem] font-mono uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1.5">
              <Sparkles className="size-3" /> Assistant
            </div>
            <p className="whitespace-pre-wrap text-sm">
              {streaming}
              <span className="inline-block w-1.5 h-3 align-[-1px] ml-0.5 bg-foreground/60 animate-pulse" />
            </p>
            {pendingPayload && (
              <GeneratedListPreview payload={pendingPayload} onSave={saveGeneratedList} saving={savingList} />
            )}
          </div>
        )}

        {streamErr && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm">
            <div className="flex items-center gap-1.5 text-destructive font-medium">
              <AlertCircle className="size-4" /> Generation failed
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{streamErr}</p>
            <Button variant="outline" size="sm" className="mt-2 gap-1.5" onClick={onRetry}>
              <RotateCcw className="size-3.5" /> Retry
            </Button>
          </div>
        )}
      </div>

      <form onSubmit={onSend} className="border-t border-border bg-card/60 p-2 space-y-2">
        <div className="flex items-center gap-1.5">
          <ModePill active={mode === "answer"} onClick={() => setMode("answer")} icon={<Sparkles className="size-3" />}>Ask</ModePill>
          <ModePill active={mode === "list"} onClick={() => setMode("list")} icon={<ListPlus className="size-3" />}>List</ModePill>
          <Link to="/settings?tab=ai" className="ml-auto inline-flex items-center gap-1 text-[0.65rem] font-mono text-muted-foreground hover:text-foreground">
            <Settings2 className="size-3" /> settings
          </Link>
        </div>
        <div className="flex items-end gap-2 rounded-lg border border-border bg-background focus-within:border-ring/60 transition-colors p-1">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={mode === "list"
              ? "Describe a project to generate…"
              : "Ask anything…"}
            className="min-h-[40px] max-h-32 border-0 shadow-none focus-visible:ring-0 resize-none bg-transparent text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); }
            }}
            disabled={!ai.enabled || streaming !== null}
          />
          <Button type="submit" size="sm" disabled={!ai.enabled || streaming !== null || !draft.trim()} className="gap-1.5">
            {streaming !== null ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
          </Button>
        </div>
      </form>
    </div>
  );
}

function ModePill({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.7rem] transition-colors ${
        active ? "border-foreground/30 bg-secondary" : "border-border bg-card hover:bg-muted/60 text-muted-foreground"
      }`}>
      {icon} {children}
    </button>
  );
}

function DisabledBanner() {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card p-3 text-center">
      <Sparkles className="mx-auto size-4 text-muted-foreground" />
      <h4 className="mt-1.5 text-sm">AI is disabled</h4>
      <p className="text-xs text-muted-foreground mt-1">Configure a provider to start.</p>
      <Button asChild size="sm" className="mt-2 gap-1.5 h-7 text-xs">
        <Link to="/settings?tab=ai"><Settings2 className="size-3" /> AI settings</Link>
      </Button>
    </div>
  );
}

function EmptyHints({ onPick }: { onPick: (prompt: string, mode: Mode) => void }) {
  const samples: { prompt: string; mode: Mode }[] = [
    { prompt: "Create a deployment checklist for FastAPI.", mode: "list" },
    { prompt: "Plan a Goa trip.", mode: "list" },
    { prompt: "Create a grocery list for a family of four.", mode: "list" },
    { prompt: "How do I prioritize a backlog of small tasks?", mode: "answer" },
  ];
  return (
    <div className="rounded-lg border border-border bg-card p-2.5">
      <div className="text-[0.6rem] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">Try</div>
      <ul className="space-y-1">
        {samples.map((s) => (
          <li key={s.prompt}>
            <button onClick={() => onPick(s.prompt, s.mode)}
              className="w-full text-left rounded-md border border-border bg-background hover:bg-muted/40 transition-colors px-2 py-1.5 text-xs flex items-center gap-1.5">
              {s.mode === "list" ? <ListPlus className="size-3 text-muted-foreground" /> : <Sparkles className="size-3 text-muted-foreground" />}
              <span className="flex-1 truncate">{s.prompt}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MessageBubble({ msg, onSaveList, savingList }: {
  msg: ChatMessage;
  onSaveList: (p: GeneratedListPayload) => void;
  savingList: boolean;
}) {
  const isUser = msg.role === "user";
  return (
    <div className={`rounded-lg border px-3 py-2 ${
      isUser ? "border-border/70 bg-secondary/50" : "border-border bg-card"
    }`}>
      <div className="text-[0.6rem] font-mono uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1.5">
        {isUser ? "You" : <><Sparkles className="size-3" /> Assistant</>}
      </div>
      <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
      {msg.generated && (
        <GeneratedListPreview payload={msg.generated} onSave={onSaveList} saving={savingList} />
      )}
    </div>
  );
}

function GeneratedListPreview({ payload, onSave, saving }: {
  payload: GeneratedListPayload;
  onSave: (p: GeneratedListPayload) => void;
  saving: boolean;
}) {
  const [title, setTitle] = useState(payload.title);
  const [items, setItems] = useState(payload.items);
  const [draft, setDraft] = useState("");

  const updateItem = (i: number, v: string) => setItems((xs) => xs.map((x, j) => j === i ? v : x));
  const removeItem = (i: number) => setItems((xs) => xs.filter((_, j) => j !== i));
  const addItem = () => {
    const t = draft.trim();
    if (!t) return;
    setItems((xs) => [...xs, t]);
    setDraft("");
  };

  return (
    <div className="mt-2 rounded-md border border-border bg-background/60 p-2">
      <div className="text-[0.6rem] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">Review before saving</div>
      <Input value={title} onChange={(e) => setTitle(e.target.value)}
        className="mb-1.5 h-8 bg-input-background border-border text-sm" />
      <ul className="space-y-1">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1.5">
            <span className="size-1 rounded-full bg-muted-foreground/60 shrink-0" />
            <Input value={it} onChange={(e) => updateItem(i, e.target.value)}
              className="h-7 bg-input-background border-border text-xs" />
            <Button type="button" size="icon" variant="ghost" className="size-6" onClick={() => removeItem(i)}>
              <X className="size-3" />
            </Button>
          </li>
        ))}
      </ul>
      <div className="mt-1.5 flex items-center gap-1.5">
        <Input value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addItem(); } }}
          placeholder="Add item…"
          className="h-7 bg-input-background border-border text-xs" />
        <Button type="button" size="sm" variant="outline" onClick={addItem} disabled={!draft.trim()} className="gap-1 h-7 text-xs">
          <Plus className="size-3" />
        </Button>
      </div>
      <div className="mt-2 flex items-center justify-end">
        <Button size="sm" disabled={saving || !title.trim() || items.length === 0}
          onClick={() => onSave({ kind: "list", title: title.trim(), items: items.map((s) => s.trim()).filter(Boolean) })}
          className="gap-1.5 h-7 text-xs">
          {saving ? <><Loader2 className="size-3 animate-spin" /> Saving</> : <><Check className="size-3" /> Save as list</>}
        </Button>
      </div>
    </div>
  );
}
