import { useEffect, useState } from "react";
import { Bell, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";
import { Badge } from "../ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import { remindersApi, ReminderPrefs } from "../../api/mock";

export function RemindersSettingsTab() {
  const [prefs, setPrefs] = useState<ReminderPrefs | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    remindersApi.get().then((p) => { if (alive) setPrefs(p); });
    return () => { alive = false; };
  }, []);

  if (!prefs) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 grid place-items-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  const update = (patch: Partial<ReminderPrefs>) => setPrefs((p) => p ? { ...p, ...patch } : p);

  const save = async () => {
    if (!prefs) return;
    setBusy(true);
    try {
      const next = await remindersApi.save(prefs);
      setPrefs(next);
      toast.success("Reminder preferences saved");
    } catch (err: any) {
      toast.error("Couldn't save", { description: err?.message });
    } finally { setBusy(false); }
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-soft-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-3">
        <div>
          <h3>Email reminders</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Get a periodic email with your active tasks.
          </p>
        </div>
        <Badge variant="outline" className="gap-1 border-warning/40 shrink-0" style={{ color: "var(--warning)" }}>
          Backend Pending
        </Badge>
      </div>

      <div className="p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <div className="size-9 rounded-lg grid place-items-center bg-secondary">
              <Bell className="size-4" />
            </div>
            <div>
              <h4>Enable reminders</h4>
              <p className="text-sm text-muted-foreground">Receive scheduled emails about pending tasks.</p>
            </div>
          </div>
          <Switch checked={prefs.emailReminders} onCheckedChange={(v) => update({ emailReminders: v })} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label>Frequency</label>
            <Select value={prefs.frequency} onValueChange={(v) => update({ frequency: v as ReminderPrefs["frequency"] })}>
              <SelectTrigger className="mt-1.5 h-10 bg-input-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="off">Off</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label>Preferred time</label>
            <Select value={prefs.preferredTime} onValueChange={(v) => update({ preferredTime: v as ReminderPrefs["preferredTime"] })}>
              <SelectTrigger className="mt-1.5 h-10 bg-input-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">Morning</SelectItem>
                <SelectItem value="afternoon">Afternoon</SelectItem>
                <SelectItem value="evening">Evening</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label htmlFor="rem-email">Email address</label>
          <div className="mt-1.5 flex items-center gap-2">
            <Mail className="size-4 text-muted-foreground" />
            <Input id="rem-email" type="email" value={prefs.emailAddress}
              onChange={(e) => update({ emailAddress: e.target.value })}
              placeholder="you@example.com"
              className="h-10 bg-input-background border-border" />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={save} disabled={busy}>
            {busy ? <><Loader2 className="size-4 animate-spin mr-2" /> Saving…</> : "Save preferences"}
          </Button>
        </div>
      </div>
    </div>
  );
}
