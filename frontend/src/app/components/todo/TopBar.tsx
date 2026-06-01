import { Sun, Moon, Menu } from "lucide-react";
import { Button } from "../ui/button";

type Props = {
  dark: boolean;
  onToggleDark: () => void;
  onMenuToggle: () => void;
};

export function TopBar({ dark, onToggleDark, onMenuToggle }: Props) {
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
        <div className="flex-1" />
        <Button variant="ghost" size="icon" onClick={onToggleDark} aria-label="Toggle dark mode">
          {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
      </div>
    </header>
  );
}
