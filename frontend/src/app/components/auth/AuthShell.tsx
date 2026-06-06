import { Github } from "lucide-react";
import { Logo } from "../todo/Logo";

export function AuthShell({
  title, subtitle, children, footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-background text-foreground">
      {/* Form side */}
      <div className="flex flex-col px-6 sm:px-10 py-8">
        <Logo />
        <div className="flex-1 grid place-items-center">
          <div className="w-full max-w-sm">
            <h1>{title}</h1>
            <p className="mt-1.5 text-muted-foreground">{subtitle}</p>
            <div className="mt-7">{children}</div>
            <div className="mt-6 text-sm text-muted-foreground">{footer}</div>
          </div>
        </div>
        <div className="flex items-center justify-between text-[0.7rem] text-muted-foreground/70 font-mono">
          <span className="uppercase tracking-[0.2em]">Cairn · Gruvbox edition</span>
          <a
            href="https://github.com/viraj-sh/todo"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 hover:text-muted-foreground transition-colors normal-case tracking-normal"
          >
            <Github className="size-3" /> Open source
          </a>
        </div>
      </div>

      {/* Showcase side */}
      <aside className="hidden md:flex relative overflow-hidden border-l border-border paper">
        <div className="absolute inset-0"
          style={{
            background: "radial-gradient(circle at 20% 20%, color-mix(in oklab, var(--gb-orange) 22%, transparent) 0, transparent 50%), radial-gradient(circle at 90% 90%, color-mix(in oklab, var(--gb-aqua) 22%, transparent) 0, transparent 55%)",
          }}
        />
        <div className="relative m-auto max-w-md px-10">
          <blockquote className="font-display text-2xl leading-snug">
            &ldquo;Small stones, stacked carefully, find their way to the summit.&rdquo;
          </blockquote>
          <div className="mt-5 flex items-center gap-3">
            <div className="size-9 rounded-full grid place-items-center text-primary-foreground"
              style={{ background: "var(--gb-aqua)" }}>
              <span className="font-display">C</span>
            </div>
            <div>
              <div className="text-sm">Cairn — a calm place for tasks</div>
              <div className="text-xs text-muted-foreground font-mono">FastAPI · React · PostgreSQL</div>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-3">
            {["orange", "aqua", "purple"].map((c) => (
              <div key={c} className="rounded-xl border border-border bg-card p-4 shadow-soft-sm">
                <span className="block size-2.5 rounded-full mb-3" style={{ background: `var(--gb-${c})` }} />
                <div className="h-2 rounded bg-muted mb-1.5" style={{ width: "82%" }} />
                <div className="h-2 rounded bg-muted" style={{ width: "60%" }} />
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
