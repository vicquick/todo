import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { AuthShell } from "./AuthShell";
import * as api from "../../api/client";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const resetToken = params.get("reset_token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      await api.resetPassword(resetToken, password);
      toast("Password updated", {
        description: "Sign in with your new credentials.",
      });
      navigate("/login", { replace: true });
    } catch (err: any) {
      setError(err?.message ?? "Couldn't reset the password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Almost done — pick something memorable."
      footer={<><Link to="/login" className="text-primary font-medium hover:underline">Back to sign in</Link></>}
    >
      {!resetToken ? (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="size-4 mt-0.5 shrink-0" />
          <span>
            This reset link is missing its token. Request a new one via{" "}
            <Link to="/forgot-password" className="font-medium underline">
              forgot password
            </Link>
            .
          </span>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="rp-password">New password</label>
            <div className="relative mt-1.5">
              <Input
                id="rp-password"
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
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
          <div>
            <label htmlFor="rp-confirm">Confirm password</label>
            <Input
              id="rp-confirm"
              type={show ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              placeholder="••••••••"
              className="mt-1.5 h-11 bg-input-background border-border"
            />
          </div>
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertCircle className="size-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <Button type="submit" className="w-full h-11" disabled={busy}>
            {busy ? <><Loader2 className="size-4 animate-spin mr-2" /> Updating…</> : "Update password"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
