import { Sun, Moon, Menu, NotebookPen } from "lucide-react";
import { Button } from "../ui/button";
import { CairnMark } from "../brand/CairnMark";

type Props = {
  dark: boolean;
  onToggleDark: () => void;
  onMenuToggle: () => void;
  notesOpen: boolean;
  onNotesToggle: () => void;
};

export function TopBar({ dark, onToggleDark, onMenuToggle, notesOpen, onNotesToggle }: Props) {
  return (
    <header
      className="sticky top-0 z-30 backdrop-blur-md border-b border-border/70"
      style={{ background: "color-mix(in oklab, var(--background) 78%, transparent)" }}
    >
      <div className="px-4 md:px-8 h-14 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuToggle}
          className="md:hidden text-muted-foreground"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </Button>

        <div className="flex items-center gap-2.5 select-none">
          <CairnMark className="size-7" />
          <span className="font-display text-[1.05rem] leading-none tracking-tight">
            Cairn
          </span>
        </div>

        <div className="flex-1" />

        <Button
          variant="ghost"
          size="icon"
          onClick={onNotesToggle}
          aria-label="Toggle quick notes (Ctrl+J)"
          title="Quick notes — ⌘J"
          className={notesOpen ? "text-primary bg-accent" : "text-muted-foreground"}
        >
          <NotebookPen className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onToggleDark} aria-label="Toggle dark mode">
          {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
      </div>
    </header>
  );
}
