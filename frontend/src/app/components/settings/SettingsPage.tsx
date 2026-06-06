import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import {
  ArrowLeft, User, Shield, Settings2, Hash, Loader2,
  AlertTriangle, KeyRound, Trash2, LogOut, Moon, Sun, Sparkles, Plug, Lock,
  Eye, EyeOff, Github, ExternalLink, Bug, Star,
} from "lucide-react";
import { AISettingsTab } from "./AISettingsTab";
import { MCPSettingsTab } from "./MCPSettingsTab";
import { PrivacySettingsTab } from "./PrivacySettingsTab";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "../ui/alert-dialog";
import { useAuth } from "../../auth/AuthContext";
import * as api from "../../api/client";
import { WorkspacesSettingsTab } from "./WorkspacesSettingsTab";
import { TagsSettingsTab } from "./TagsSettingsTab";
import { RemindersSettingsTab } from "./RemindersSettingsTab";
import { Layers, Tag as TagIcon, Bell, Info } from "lucide-react";

type Tab = "profile" | "security" | "workspaces" | "tags" | "reminders" | "preferences" | "ai" | "mcp" | "privacy" | "about";

const TABS: Tab[] = ["profile", "security", "workspaces", "tags", "reminders", "preferences", "ai", "mcp", "privacy", "about"];

export function SettingsPage({ dark, onToggleDark }: { dark: boolean; onToggleDark: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const initialTab = (TABS.includes(params.get("tab") as Tab) ? params.get("tab") : "profile") as Tab;
  const [tab, setTab] = useState<Tab>(initialTab);

  useEffect(() => {
    const t = params.get("tab") as Tab | null;
    if (t && TABS.includes(t) && t !== tab) setTab(t);
    // eslint-disable-next-line
  }, [params]);

  const onTabChange = (t: Tab) => {
    setTab(t);
    setParams({ tab: t }, { replace: true });
  };

  const initial = user?.username?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 backdrop-blur-md border-b border-border/70"
        style={{ background: "color-mix(in oklab, var(--background) 78%, transparent)" }}>
        <div className="px-5 md:px-8 h-14 flex items-center gap-3 max-w-5xl mx-auto">
          <Link to="/" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
            <ArrowLeft className="size-4" /> Back
          </Link>
          <span className="text-border-strong">/</span>
          <span className="font-mono text-[0.72rem] uppercase tracking-[0.2em] text-muted-foreground">Settings</span>
          <div className="ml-auto" />
          <Button variant="ghost" size="sm" onClick={() => { logout(); navigate("/login", { replace: true }); }} className="gap-1.5">
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-5 md:px-8 py-8 grid md:grid-cols-[220px_1fr] gap-8">
        {/* Identity card + nav */}
        <aside>
          <div className="rounded-xl border border-border bg-card p-4 shadow-soft-sm">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-xl grid place-items-center text-primary-foreground font-display"
                style={{ background: "linear-gradient(135deg, var(--gb-orange) 0%, var(--gb-purple) 100%)" }}>
                {initial}
              </div>
              <div className="min-w-0">
                <div className="truncate">{user?.username ?? "—"}</div>
                <div className="truncate text-xs text-muted-foreground font-mono">{user?.email ?? ""}</div>
              </div>
            </div>
          </div>

          <nav className="mt-4 space-y-0.5">
            {([
              ["profile",     "Profile",     <User className="size-4" />],
              ["security",    "Security",    <Shield className="size-4" />],
              ["workspaces",  "Workspaces",  <Layers className="size-4" />],
              ["tags",        "Tags",        <TagIcon className="size-4" />],
              ["reminders",   "Reminders",   <Bell className="size-4" />],
              ["preferences", "Preferences", <Settings2 className="size-4" />],
              ["ai",          "AI",          <Sparkles className="size-4" />],
              ["mcp",         "MCP",         <Plug className="size-4" />],
              ["privacy",     "Privacy",     <Lock className="size-4" />],
              ["about",       "About",       <Info className="size-4" />],
            ] as [Tab, string, React.ReactNode][]).map(([id, label, icon]) => (
              <button key={id} onClick={() => onTabChange(id)}
                className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                  tab === id ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}>
                {icon}<span>{label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <section className="space-y-6 min-w-0">
          {tab === "profile" && <ProfileTab />}
          {tab === "security" && <SecurityTab />}
          {tab === "workspaces" && <WorkspacesSettingsTab />}
          {tab === "tags" && <TagsSettingsTab />}
          {tab === "reminders" && <RemindersSettingsTab />}
          {tab === "preferences" && <PreferencesTab dark={dark} onToggleDark={onToggleDark} />}
          {tab === "ai" && <AISettingsTab />}
          {tab === "mcp" && <MCPSettingsTab />}
          {tab === "privacy" && <PrivacySettingsTab />}
          {tab === "about" && <AboutTab />}
        </section>
      </div>
    </div>
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

function MaskedField({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  const [visible, setVisible] = useState(false);

  const mask = (v: string) => {
    if (v.includes("@")) {
      const [local, domain] = v.split("@");
      return `${local.slice(0, 3)}***@${domain}`;
    }
    if (v.length > 8) return v.slice(0, 4) + "••••••••" + v.slice(-4);
    return "••••••••";
  };

  return (
    <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
      <span className="label">{label}</span>
      <div className={`flex items-center gap-2 ${mono ? "font-mono" : ""}`}>
        <span className="truncate text-sm">{visible ? value : mask(value)}</span>
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide" : "Show"}
          className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
        >
          {visible ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        </button>
      </div>
    </div>
  );
}

function ProfileTab() {
  const { user, refreshMe } = useAuth();
  const [username, setUsername] = useState(user?.username ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setUsername(user?.username ?? "");
    setEmail(user?.email ?? "");
  }, [user?.username, user?.email]);

  const dirty = username !== (user?.username ?? "") || email !== (user?.email ?? "");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dirty) return;
    setBusy(true);
    try {
      const patch: { username?: string; email?: string } = {};
      if (username !== user?.username) patch.username = username;
      if (email !== user?.email) patch.email = email;
      await api.updateUser(patch);
      await refreshMe();
      toast.success("Profile updated");
    } catch (err: any) {
      toast.error("Couldn't update profile", { description: err?.message });
    } finally { setBusy(false); }
  };

  return (
    <SectionCard title="Profile" description="Update your username and email.">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="pf-username">Username</label>
            <Input id="pf-username" value={username} onChange={(e) => setUsername(e.target.value)}
              className="mt-1.5 h-10 bg-input-background border-border" />
          </div>
          <div>
            <label htmlFor="pf-email">Email</label>
            <Input id="pf-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 h-10 bg-input-background border-border" />
          </div>
        </div>
        <div className="border-t border-border pt-3">
          <MaskedField label="User ID" value={user?.id ?? "—"} mono />
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={busy || !dirty}>
            {busy ? <><Loader2 className="size-4 animate-spin mr-2" /> Saving…</> : "Save changes"}
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}

function SecurityTab() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.changePassword(current, next);
      toast.success("Password updated — signing you out…");
      setCurrent(""); setNext("");
      setTimeout(() => {
        logout();
        navigate("/login", { replace: true });
      }, 1500);
    } catch (err: any) {
      toast.error("Couldn't update password", { description: err?.message });
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async () => {
    setDeleting(true);
    try {
      await api.deleteUser();
      toast.success("Account deleted");
      logout();
      navigate("/login", { replace: true });
    } catch (err: any) {
      toast.error("Couldn't delete account", { description: err?.message });
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <>
      <SectionCard title="Change password" description="Use a strong, unique password. You'll be signed out after changing it.">
        <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="cur-pw">Current password</label>
            <Input id="cur-pw" type="password" value={current} onChange={(e) => setCurrent(e.target.value)}
              className="mt-1.5 h-10 bg-input-background border-border" />
          </div>
          <div>
            <label htmlFor="new-pw">New password</label>
            <Input id="new-pw" type="password" value={next} onChange={(e) => setNext(e.target.value)}
              className="mt-1.5 h-10 bg-input-background border-border" />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <Button type="submit" disabled={busy || !current || !next}>
              {busy ? <><Loader2 className="size-4 animate-spin mr-2" /> Updating…</> : "Update password"}
            </Button>
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Danger zone" description="Permanently remove your account and all of its data.">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="size-9 rounded-lg grid place-items-center"
              style={{ background: "color-mix(in oklab, var(--destructive) 12%, transparent)", color: "var(--destructive)" }}>
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <h4>Delete account</h4>
              <p className="text-sm text-muted-foreground">This action can&apos;t be undone.</p>
            </div>
          </div>
          <Button variant="outline" className="text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/50 gap-1.5" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="size-4" /> Delete my account
          </Button>
        </div>
      </SectionCard>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              All of your lists and tasks will be permanently deleted. This action can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? <><Loader2 className="size-4 animate-spin mr-2" /> Deleting…</> : "Delete account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function PreferencesTab({ dark, onToggleDark }: { dark: boolean; onToggleDark: () => void }) {
  return (
    <SectionCard title="Preferences" description="Personalize your workspace.">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-3">
          <div className="size-9 rounded-lg grid place-items-center bg-secondary">
            {dark ? <Moon className="size-4" /> : <Sun className="size-4" />}
          </div>
          <div>
            <h4>Appearance</h4>
            <p className="text-sm text-muted-foreground">Switch between light and dark Gruvbox.</p>
          </div>
        </div>
        <Switch checked={dark} onCheckedChange={onToggleDark} />
      </div>
    </SectionCard>
  );
}

function AboutTab() {
  return (
    <div className="space-y-6">
      <SectionCard title="About Cairn">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Cairn is an open-source task management app built with FastAPI, React, and PostgreSQL.
            It features workspace-scoped lists and items, priority tagging, AI-powered task assistance, and a
            focused Gruvbox aesthetic designed for long work sessions.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {["FastAPI", "React", "PostgreSQL", "Tailwind CSS", "shadcn/ui"].map((t) => (
              <span key={t} className="inline-flex items-center rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-mono text-muted-foreground">
                {t}
              </span>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Open Source">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="size-9 rounded-lg grid place-items-center bg-secondary shrink-0">
              <Github className="size-4" />
            </div>
            <div>
              <p className="text-sm">Cairn is free and open-source software, released under the MIT License.</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Contributions, ideas, and feedback are welcome.
              </p>
            </div>
          </div>

          <a
            href="https://github.com/viraj-sh/todo"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-lg border border-border bg-card/60 p-3 hover:bg-muted/60 transition-colors group"
          >
            <Github className="size-5 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">viraj-sh/todo</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Star className="size-3" /> Star the repository if you find it useful
              </div>
            </div>
            <ExternalLink className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </a>

          <a
            href="https://github.com/viraj-sh/todo/issues"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-lg border border-border bg-card/60 p-3 hover:bg-muted/60 transition-colors group"
          >
            <Bug className="size-5 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">Bug Reports & Feature Requests</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Open an issue on GitHub — bugs, suggestions, and ideas all welcome
              </div>
            </div>
            <ExternalLink className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </a>
        </div>
      </SectionCard>

      <SectionCard title="Version">
        <div className="flex items-center justify-between">
          <span className="font-mono text-sm text-muted-foreground">v0.1.0</span>
          <span className="text-xs text-muted-foreground">Cairn · Gruvbox edition</span>
        </div>
      </SectionCard>
    </div>
  );
}
