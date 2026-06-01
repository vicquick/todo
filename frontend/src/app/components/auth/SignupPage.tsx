import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useAuth } from "../../auth/AuthContext";
import { AuthShell } from "./AuthShell";

export function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = username.trim().length >= 2 && /.+@.+\..+/.test(email) && password.length >= 6;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!valid) {
      setError("Check your details — username, email, and a password of 6+ characters.");
      return;
    }
    setBusy(true);
    try {
      await signup(username.trim(), email.trim(), password);
      toast.success("Account created", { description: "Sign in with your new credentials." });
      navigate("/login", { replace: true });
    } catch (err: any) {
      setError(err?.message ?? "Couldn't create your account.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start collecting tasks in your own space."
      footer={<>Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="su-username">Username</label>
          <Input id="su-username" value={username} onChange={(e) => setUsername(e.target.value)}
            autoComplete="username" placeholder="your-handle"
            className="mt-1.5 h-11 bg-input-background border-border" />
        </div>
        <div>
          <label htmlFor="su-email">Email</label>
          <Input id="su-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            autoComplete="email" placeholder="you@domain.com"
            className="mt-1.5 h-11 bg-input-background border-border" />
        </div>
        <div>
          <label htmlFor="su-password">Password</label>
          <Input id="su-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password" placeholder="6+ characters"
            className="mt-1.5 h-11 bg-input-background border-border" />
          <p className="mt-1.5 text-xs text-muted-foreground flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5" style={{ color: password.length >= 6 ? "var(--success)" : "var(--muted-foreground)" }} />
            At least 6 characters.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button type="submit" className="w-full h-11" disabled={busy}>
          {busy ? <><Loader2 className="size-4 animate-spin mr-2" /> Creating account…</> : "Create account"}
        </Button>
      </form>
    </AuthShell>
  );
}
