import { Inbox, AlertTriangle, RefreshCw, Sparkles, ListPlus } from "lucide-react";
import { Button } from "../ui/button";

export function LoadingPanel({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="space-y-3 p-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3.5">
          <span className="size-5 rounded-md bg-muted animate-pulse" />
          <span className="h-3 flex-1 rounded bg-muted animate-pulse" style={{ width: `${40 + (i * 17) % 50}%` }} />
          <span className="h-3 w-12 rounded bg-muted animate-pulse" />
        </div>
      ))}
      <p className="sr-only">{label}</p>
    </div>
  );
}

export function NoListsEmpty({ onFocusCreate }: { onFocusCreate?: () => void }) {
  return (
    <div className="grid place-items-center min-h-[60vh] px-6">
      <div className="text-center max-w-md">
        <div className="mx-auto size-16 rounded-2xl grid place-items-center shadow-soft-md"
          style={{ background: "color-mix(in oklab, var(--gb-orange) 18%, var(--card))" }}>
          <Sparkles className="size-7" style={{ color: "var(--primary)" }} />
        </div>
        <h2 className="mt-5">A blank slate, ready when you are.</h2>
        <p className="mt-2 text-muted-foreground">
          You don&apos;t have any projects yet. Create one to start collecting tasks — groceries,
          a launch plan, weekend errands, anything.
        </p>
        <Button onClick={onFocusCreate} className="mt-5 gap-2">
          <ListPlus className="size-4" /> Create your first project
        </Button>
        <p className="mt-3 text-xs text-muted-foreground font-mono">
          ↳ tip: press <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border-strong">N</kbd> anytime
        </p>
      </div>
    </div>
  );
}

export function EmptyItems({ listName, onAdd }: { listName: string; onAdd?: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-border-strong bg-card/40 px-6 py-10 text-center">
      <Inbox className="mx-auto size-8 text-muted-foreground" />
      <h3 className="mt-3">No tasks in &ldquo;{listName}&rdquo;</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Add your first task using the input above. Small steps, big stones.
      </p>
      {onAdd && (
        <Button variant="ghost" onClick={onAdd} className="mt-3 gap-1.5 text-primary hover:text-primary">
          <ListPlus className="size-4" /> Add a task
        </Button>
      )}
    </div>
  );
}

export function ErrorPanel({ title = "Something didn't go through.", message, onRetry }: { title?: string; message?: string; onRetry?: () => void }) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4 flex gap-4 items-start">
      <div className="size-9 rounded-lg grid place-items-center shrink-0"
        style={{ background: "color-mix(in oklab, var(--destructive) 15%, transparent)", color: "var(--destructive)" }}>
        <AlertTriangle className="size-5" />
      </div>
      <div className="flex-1">
        <h4 style={{ color: "var(--destructive)" }}>{title}</h4>
        <p className="text-sm text-muted-foreground mt-0.5">
          {message ?? "We couldn't reach the server. Check your connection and try again."}
        </p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm" className="mt-3 gap-1.5">
            <RefreshCw className="size-3.5" /> Retry
          </Button>
        )}
      </div>
    </div>
  );
}

export function NoSelection() {
  return (
    <div className="grid place-items-center min-h-[60vh] px-6">
      <div className="text-center max-w-sm">
        <div className="mx-auto size-14 rounded-2xl grid place-items-center"
          style={{ background: "color-mix(in oklab, var(--gb-aqua) 16%, var(--card))" }}>
          <ListPlus className="size-6" style={{ color: "var(--gb-aqua)" }} />
        </div>
        <h3 className="mt-4">Pick a list to get started</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a list from the left, or create a new one to begin.
        </p>
      </div>
    </div>
  );
}
