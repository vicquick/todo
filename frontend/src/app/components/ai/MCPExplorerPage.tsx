import { Link } from "react-router";
import { ArrowLeft, Plug, Loader2, RefreshCw, Settings2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Badge } from "../ui/badge";
import { useAI } from "../../state/AIContext";
import { toast } from "sonner";

export function MCPExplorerPage() {
  const { mcp, privacy, toggleMCPTool, checkMCP } = useAI();
  const [checking, setChecking] = useState(false);

  const onCheck = async () => {
    setChecking(true);
    await checkMCP();
    setChecking(false);
    toast("Connection check complete");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 backdrop-blur-md border-b border-border/70"
        style={{ background: "color-mix(in oklab, var(--background) 78%, transparent)" }}>
        <div className="px-5 md:px-8 h-14 flex items-center gap-3 max-w-4xl mx-auto">
          <Link to="/" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
            <ArrowLeft className="size-4" /> Back
          </Link>
          <span className="text-border-strong">/</span>
          <span className="font-mono text-[0.72rem] uppercase tracking-[0.2em] text-muted-foreground inline-flex items-center gap-1.5">
            <Plug className="size-3.5" /> MCP Tool Explorer
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="gap-1.5">
              <Link to="/settings?tab=mcp"><Settings2 className="size-4" /> MCP settings</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-5 md:px-8 py-8 space-y-6">
        {!privacy.allowExternalMcp && (
          <div className="rounded-xl border border-dashed border-border bg-card p-5 text-sm">
            <div className="flex items-start gap-3">
              <ShieldCheck className="size-5 text-muted-foreground mt-0.5" />
              <div>
                <div>External MCP access is disabled</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Enable MCP integration to allow external AI agents to interact with your account. Tool toggles below are previewed but not exposed to any agent.
                </p>
                <Button asChild size="sm" variant="outline" className="mt-3 gap-1.5">
                  <Link to="/settings?tab=privacy"><Settings2 className="size-4" /> Open privacy settings</Link>
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-border bg-card shadow-soft-sm">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
            <div>
              <h3>Server status</h3>
              <p className="text-sm text-muted-foreground mt-0.5 font-mono break-all">{mcp.serverUrl || "—"}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1.5">
                <span className="size-1.5 rounded-full" style={{
                  background: mcp.serverStatus === "connected" ? "var(--success)"
                    : mcp.serverStatus === "error" ? "var(--destructive)"
                    : "var(--muted-foreground)",
                }} />
                {mcp.serverStatus}
              </Badge>
              <Button size="sm" variant="outline" onClick={onCheck} disabled={checking} className="gap-1.5">
                {checking ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                Check
              </Button>
            </div>
          </div>
          <div className="px-5 py-3 text-xs text-muted-foreground font-mono">
            {mcp.lastCheckedAt ? `Last checked ${new Date(mcp.lastCheckedAt).toLocaleString()}` : "Never checked"}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-soft-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3>Available tools</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Toggle which actions external AI agents are allowed to perform on your behalf.
            </p>
          </div>
          <ul className="divide-y divide-border">
            {mcp.tools.map((t) => (
              <li key={t.id} className="px-5 py-3 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{t.name}</span>
                    <Badge variant="outline" className={t.enabled ? "" : "opacity-60"}>
                      {t.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
                </div>
                <Switch checked={t.enabled} onCheckedChange={(v) => toggleMCPTool(t.id, v)} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
