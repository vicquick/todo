import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, History, MessageSquare, Trash2, Eraser, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { conversationsApi, Conversation } from "../../api/aiMock";
import { useAI } from "../../state/AIContext";

export function AIHistoryPage() {
  const { privacy } = useAI();
  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    setLoading(true);
    setItems(await conversationsApi.list());
    setLoading(false);
  };

  useEffect(() => { reload(); }, []);

  const onDelete = async (id: string) => {
    await conversationsApi.remove(id);
    toast("Conversation deleted");
    reload();
  };
  const onClear = async () => {
    await conversationsApi.clear();
    toast("History cleared");
    reload();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 backdrop-blur-md border-b border-border/70"
        style={{ background: "color-mix(in oklab, var(--background) 78%, transparent)" }}>
        <div className="px-5 md:px-8 h-14 flex items-center gap-3 max-w-3xl mx-auto">
          <Link to="/" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
            <ArrowLeft className="size-4" /> Back
          </Link>
          <span className="text-border-strong">/</span>
          <span className="font-mono text-[0.72rem] uppercase tracking-[0.2em] text-muted-foreground inline-flex items-center gap-1.5">
            <History className="size-3.5" /> AI History
          </span>
          <div className="ml-auto" />
          <Button variant="outline" size="sm" onClick={onClear} disabled={items.length === 0} className="gap-1.5">
            <Eraser className="size-4" /> Clear all
          </Button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-5 md:px-8 py-8">
        {!privacy.saveHistory && (
          <div className="mb-4 rounded-xl border border-dashed border-border bg-card p-4 text-sm">
            <div className="flex items-start gap-2">
              <Sparkles className="size-4 text-muted-foreground mt-0.5" />
              <div>
                <div>History saving is disabled.</div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  New conversations are ephemeral. Enable <em>Save AI conversation history</em> in Settings → Privacy to keep them.
                </p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <ul className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
            ))}
          </ul>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
            <MessageSquare className="mx-auto size-6 text-muted-foreground" />
            <h3 className="mt-3">No conversations yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Your AI conversations will appear here.</p>
            <Button asChild size="sm" className="mt-4">
              <Link to="/">Open the assistant</Link>
            </Button>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((c) => (
              <li key={c.id} className="group rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{c.title}</div>
                    <div className="text-xs text-muted-foreground font-mono mt-0.5">
                      {new Date(c.updatedAt).toLocaleString()} · {c.messages.length} message{c.messages.length === 1 ? "" : "s"}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" aria-label="Delete conversation"
                    onClick={() => onDelete(c.id)}
                    className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
