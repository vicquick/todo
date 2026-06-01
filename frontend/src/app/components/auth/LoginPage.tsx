import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useAuth } from "../../auth/AuthContext";
import { AuthShell } from "./AuthShell";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password) {
      setError("Enter your username and password.");
      return;
    }
    setBusy(true);
    try {
      await login(username.trim(), password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err?.message ?? "Couldn't sign in.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to pick up where you left off."
      footer={<>New to Cairn? <Link to="/signup" className="text-primary font-medium hover:underline">Create an account</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="login-username">Username</label>
          <Input
            id="login-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            placeholder="your-handle"
            className="mt-1.5 h-11 bg-input-background border-border"
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="login-password">Password</label>
            <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground normal-case tracking-normal">
              Forgot?
            </Link>
          </div>
          <div className="relative mt-1.5">
            <Input
              id="login-password"
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
              className="h-11 pr-10 bg-input-background border-border"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground"
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button type="submit" className="w-full h-11" disabled={busy}>
          {busy ? <><Loader2 className="size-4 animate-spin mr-2" /> Signing in…</> : "Sign in"}
        </Button>
      </form>
    </AuthShell>
  );
}
