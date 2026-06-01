import { useState } from "react";
import { Link } from "react-router";
import { Plug, Loader2, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";
import { Badge } from "../ui/badge";
import { useAI } from "../../state/AIContext";
import { toast } from "sonner";

export function MCPSettingsTab() {
  const { mcp, updateMCP, toggleMCPTool, checkMCP, privacy } = useAI();
  const [checking, setChecking] = useState(false);

  const onCheck = async () => {
    setChecking(true);
    await checkMCP();
    setChecking(false);
    toast("Connection check complete");
  };

  return (
    <>
      <SectionCard title="MCP integration" description="Allow external AI agents to interact with your account through the Model Context Protocol.">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="size-9 rounded-lg grid place-items-center bg-secondary">
              <Plug className="size-4" />
            </div>
            <div>
              <h4>Enable MCP</h4>
              <p className="text-sm text-muted-foreground">When off, no external agent can reach your data.</p>
            </div>
          </div>
          <Switch
            checked={mcp.enabled && privacy.allowExternalMcp}
            onCheckedChange={(v) => updateMCP({ enabled: v })}
            disabled={!privacy.allowExternalMcp}
          />
        </div>
        {!privacy.allowExternalMcp && (
          <p className="mt-3 text-xs text-muted-foreground">
            External MCP access is blocked by your privacy settings. <Link to="/settings?tab=privacy" className="underline">Open privacy</Link>.
          </p>
        )}
      </SectionCard>

      <SectionCard title="Server" description="The MCP server that exposes your account's tools.">
        <div className="space-y-4">
          <div>
            <label className="label">Server URL</label>
            <Input value={mcp.serverUrl} onChange={(e) => updateMCP({ serverUrl: e.target.value })}
              placeholder="http://localhost:8765/mcp"
              className="mt-1.5 h-10 bg-input-background border-border font-mono" />
          </div>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-1.5">
                <span className="size-1.5 rounded-full" style={{
                  background: mcp.serverStatus === "connected" ? "var(--success)"
                    : mcp.serverStatus === "error" ? "var(--destructive)"
                    : "var(--muted-foreground)",
                }} />
                {mcp.serverStatus}
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">
                {mcp.lastCheckedAt ? `Last checked ${new Date(mcp.lastCheckedAt).toLocaleString()}` : "Never checked"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild className="gap-1.5">
                <Link to="/mcp"><ExternalLink className="size-4" /> Open Tool Explorer</Link>
              </Button>
              <Button onClick={onCheck} disabled={checking} className="gap-1.5">
                {checking ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                Check connection
              </Button>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Available tools" description="Tools that external agents can invoke when MCP is enabled.">
        <ul className="divide-y divide-border -mx-5">
          {mcp.tools.map((t) => (
            <li key={t.id} className="px-5 py-3 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <span className="font-mono text-sm">{t.name}</span>
                <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
              </div>
              <Switch checked={t.enabled} onCheckedChange={(v) => toggleMCPTool(t.id, v)} />
            </li>
          ))}
        </ul>
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
