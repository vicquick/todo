import { Button } from "../ui/button";
import { ArrowLeft } from "lucide-react";

export function NotFound({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-[80vh] grid place-items-center px-6">
      <div className="text-center max-w-lg">
        <div className="font-display text-[6rem] leading-none tracking-tight"
          style={{
            background: "linear-gradient(120deg, var(--gb-orange) 0%, var(--gb-purple) 60%, var(--gb-aqua) 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}>
          404
        </div>
        <p className="mt-2 font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">page not found</p>
        <h2 className="mt-6">This trail doesn&apos;t lead anywhere.</h2>
        <p className="mt-2 text-muted-foreground">
          The page you&apos;re looking for isn&apos;t here. It may have been moved, or maybe never existed at all.
        </p>
        <Button onClick={onBack} className="mt-6 gap-2">
          <ArrowLeft className="size-4" /> Back to dashboard
        </Button>
      </div>
    </div>
  );
}
