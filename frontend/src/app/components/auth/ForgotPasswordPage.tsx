import { useState } from "react";
import { Link } from "react-router";
import { Loader2, MailCheck, AlertCircle } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { AuthShell } from "./AuthShell";
import * as api from "../../api/client";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError("Enter your email address.");
      return;
    }
    setBusy(true);
    try {
      await api.forgotPassword(email.trim());
      setSent(true);
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
      {sent ? (
        <div className="flex items-start gap-2 rounded-lg border border-border p-3 text-sm">
          <MailCheck className="size-4 mt-0.5 shrink-0 text-primary" />
          <span>
            If an account with that email exists, a reset link is on its way.
            The link expires in 1 hour.
          </span>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="fp-email">Email</label>
            <Input id="fp-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@domain.com" className="mt-1.5 h-11 bg-input-background border-border" />
          </div>
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertCircle className="size-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <Button type="submit" className="w-full h-11" disabled={busy}>
            {busy ? <><Loader2 className="size-4 animate-spin mr-2" /> Sending…</> : "Send recovery link"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
