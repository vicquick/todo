import { useState } from "react";
import { Sparkles, Loader2, Plug, KeyRound, Globe } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";
import { Badge } from "../ui/badge";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "../ui/select";
import { useAI } from "../../state/AIContext";
import { PROVIDERS, ProviderId } from "../../api/aiMock";

export function AISettingsTab() {
  const { ai, updateAI, testAI } = useAI();
  const [testing, setTesting] = useState(false);
  const provider = PROVIDERS.find((p) => p.id === ai.providerId) ?? PROVIDERS[0];
  const [customModel, setCustomModel] = useState("");

  const onProviderChange = async (id: string) => {
    const p = PROVIDERS.find((x) => x.id === id as ProviderId)!;
    await updateAI({
      providerId: p.id,
      baseUrl: p.defaultBaseUrl,
      model: p.models[0] ?? "",
    });
  };

  const onTest = async () => {
    setTesting(true);
    try {
      const res = await testAI();
      if (res.ok) toast.success(res.message);
      else toast.error(res.message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <>
      <SectionCard title="AI assistant" description="Optional. The application works fully without AI.">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="size-9 rounded-lg grid place-items-center bg-secondary">
              <Sparkles className="size-4" />
            </div>
            <div>
              <h4>Enable AI</h4>
              <p className="text-sm text-muted-foreground">Turn the assistant, chat, and AI-generated lists on or off.</p>
            </div>
          </div>
          <Switch checked={ai.enabled} onCheckedChange={(v) => updateAI({ enabled: v })} />
        </div>
      </SectionCard>

      <SectionCard title="Provider" description="Configure how Cairn talks to your model.">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Provider</label>
            <Select value={ai.providerId} onValueChange={onProviderChange}>
              <SelectTrigger className="mt-1.5 h-10 bg-input-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROVIDERS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="label">Model</label>
            {provider.models.length > 0 ? (
              <Select value={ai.model} onValueChange={(v) => updateAI({ model: v })}>
                <SelectTrigger className="mt-1.5 h-10 bg-input-background border-border">
                  <SelectValue placeholder="Choose a model" />
                </SelectTrigger>
                <SelectContent>
                  {provider.models.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                  {ai.model && !provider.models.includes(ai.model) && (
                    <SelectItem value={ai.model}>{ai.model} (custom)</SelectItem>
                  )}
                </SelectContent>
              </Select>
            ) : (
              <Input value={ai.model} onChange={(e) => updateAI({ model: e.target.value })}
                placeholder="e.g. my-custom-model"
                className="mt-1.5 h-10 bg-input-background border-border" />
            )}
            <div className="mt-2 flex items-center gap-2">
              <Input value={customModel} onChange={(e) => setCustomModel(e.target.value)}
                placeholder="Or enter a custom model name…"
                className="h-9 bg-input-background border-border" />
              <Button type="button" variant="outline" size="sm" disabled={!customModel.trim()}
                onClick={() => { updateAI({ model: customModel.trim() }); setCustomModel(""); }}>
                Use
              </Button>
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="label inline-flex items-center gap-1.5"><Globe className="size-3.5" /> Base URL</label>
            <Input value={ai.baseUrl} onChange={(e) => updateAI({ baseUrl: e.target.value })}
              placeholder="https://api.example.com/v1"
              className="mt-1.5 h-10 bg-input-background border-border font-mono" />
          </div>
          <div className="sm:col-span-2">
            <label className="label inline-flex items-center gap-1.5"><KeyRound className="size-3.5" /> API key</label>
            <Input value={ai.apiKey} onChange={(e) => updateAI({ apiKey: e.target.value })}
              type="password" placeholder="sk-…"
              className="mt-1.5 h-10 bg-input-background border-border font-mono" />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Stored locally in your browser. Designed to integrate with LiteLLM-compatible backends later.
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Connection" description="Verify the provider is reachable.">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1.5">
              <span className="size-1.5 rounded-full" style={{
                background: ai.connectionStatus === "ok" ? "var(--success)"
                  : ai.connectionStatus === "failed" ? "var(--destructive)"
                  : "var(--muted-foreground)",
              }} />
              {ai.connectionStatus === "ok" ? "Connected" : ai.connectionStatus === "failed" ? "Failed" : "Not tested"}
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">
              {ai.lastConnectedAt ? `Last successful ${new Date(ai.lastConnectedAt).toLocaleString()}` : "No successful connection yet"}
            </span>
          </div>
          <Button onClick={onTest} disabled={testing} className="gap-1.5">
            {testing ? <Loader2 className="size-4 animate-spin" /> : <Plug className="size-4" />}
            Test connection
          </Button>
        </div>
      </SectionCard>
    </>
  );
}

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-soft-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h3>{title}</h3>
        {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
