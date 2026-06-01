import { useState } from "react";
import { Link } from "react-router";
import { Loader2, MailCheck, AlertCircle } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { AuthShell } from "./AuthShell";

// No backend endpoint for password reset yet — UI-only mock.
const forgotPasswordMock = (_email: string) => new Promise<void>((res) => setTimeout(res, 500));

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await forgotPasswordMock(email);
    } catch (err: any) {
      setError(err?.message ?? "Couldn't send reset email.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll email you a recovery link."
      footer={<><Link to="/login" className="text-primary font-medium hover:underline">Back to sign in</Link></>}
    >
      <div className="flex items-center gap-2 mb-4">
        <Badge variant="outline" className="gap-1 border-warning/40" style={{ color: "var(--warning)" }}>
          <MailCheck className="size-3.5" /> Backend Pending
        </Badge>
        <span className="text-xs text-muted-foreground">UI ready — endpoint coming soon.</span>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="fp-email">Email</label>
          <Input id="fp-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@domain.com" className="mt-1.5 h-11 bg-input-background border-border" />
        </div>
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-warning/40 p-3 text-sm" style={{ background: "color-mix(in oklab, var(--warning) 10%, transparent)" }}>
            <AlertCircle className="size-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <Button type="submit" className="w-full h-11" disabled={busy}>
          {busy ? <><Loader2 className="size-4 animate-spin mr-2" /> Sending…</> : "Send recovery link"}
        </Button>
      </form>
    </AuthShell>
  );
}
