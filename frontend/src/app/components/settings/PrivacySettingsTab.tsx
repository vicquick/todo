import { Sparkles, Database, Pencil, Network } from "lucide-react";
import { Switch } from "../ui/switch";
import { useAI } from "../../state/AIContext";

export function PrivacySettingsTab() {
  const { ai, privacy, updateAI, updatePrivacy } = useAI();

  return (
    <SectionCard title="Privacy & security" description="You control what AI and external agents are allowed to do.">
      <ul className="divide-y divide-border -mx-5">
        <Row
          icon={<Sparkles className="size-4" />}
          title="Enable AI"
          desc="Master switch for the assistant. When off, no AI surfaces are reachable and no requests are made."
          checked={ai.enabled}
          onChange={(v) => updateAI({ enabled: v })}
        />
        <Row
          icon={<Database className="size-4" />}
          title="Save AI conversation history"
          desc="Store chat history locally so you can reopen previous conversations. Off by default."
          checked={privacy.saveHistory}
          onChange={(v) => updatePrivacy({ saveHistory: v })}
        />
        <Row
          icon={<Pencil className="size-4" />}
          title="Allow AI to modify data"
          desc="Permits the assistant and connected agents to create, edit, or delete your lists. Changes still require your confirmation."
          checked={privacy.allowDataModification}
          onChange={(v) => updatePrivacy({ allowDataModification: v })}
        />
        <Row
          icon={<Network className="size-4" />}
          title="Allow external MCP access"
          desc="Lets external AI agents connect through the Model Context Protocol. Disabled by default."
          checked={privacy.allowExternalMcp}
          onChange={(v) => updatePrivacy({ allowExternalMcp: v })}
        />
      </ul>
    </SectionCard>
  );
}

function Row({ icon, title, desc, checked, onChange }: {
  icon: React.ReactNode; title: string; desc: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <li className="px-5 py-4 flex items-start gap-4">
      <div className="size-9 rounded-lg grid place-items-center bg-secondary shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <h4>{title}</h4>
        <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </li>
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
