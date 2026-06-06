import { CairnMark } from "../brand/CairnMark";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <CairnMark className="size-9" />
      <div className="leading-tight">
        <div className="font-display text-[1.05rem] tracking-tight">Cairn</div>
        <div className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
          A calm place for tasks
        </div>
      </div>
    </div>
  );
}
