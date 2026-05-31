import { Sun, Moon, Wifi, WifiOff, Sparkles } from "lucide-react";
import { Button } from "../ui/button";
// import {
//   DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
//   DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuRadioGroup, DropdownMenuRadioItem,
// } from "../ui/dropdown-menu";

export type DemoState =
  | "ready"
  | "loading"
  | "empty-lists"
  | "empty-items"
  | "error"
  | "offline"
  | "not-found";

type Props = {
  dark: boolean;
  onToggleDark: () => void;
  demo: DemoState;
  onDemo: (s: DemoState) => void;
};

export function TopBar({ dark, onToggleDark, demo, onDemo }: Props) {
  // const online = demo !== "offline" && demo !== "error";
  return (
    <header
      className="sticky top-0 z-30 backdrop-blur-md border-b border-border/70"
      style={{
        background: "color-mix(in oklab, var(--background) 78%, transparent)",
      }}
    >
      <div className="px-5 md:px-8 h-14 flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 text-sm text-muted-foreground">
          {/* <span className="font-mono text-[0.72rem] uppercase tracking-[0.2em]">Workspace</span>
          <span className="text-border-strong">/</span>
          <span className="text-foreground">Personal</span> */}
        </div>

        {/* <div className="hidden md:flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-2.5 py-1 text-xs">
          {online ? (
            <><Wifi className="size-3.5" style={{ color: "var(--success)" }} /> <span>Connected</span></>
          ) : (
            <><WifiOff className="size-3.5" style={{ color: "var(--destructive)" }} /> <span>Offline</span></>
          )}
        </div> */}

        {/* <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Sparkles className="size-3.5" /> Preview state
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Demo state</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={demo} onValueChange={(v) => onDemo(v as DemoState)}>
              <DropdownMenuRadioItem value="ready">Ready (with data)</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="loading">Loading</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="empty-lists">Empty — no lists</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="empty-items">Empty — no items</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="error">Error</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="offline">Offline</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="not-found">Not Found page</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu> */}

        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleDark}
          aria-label="Toggle dark mode"
        >
          {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
      </div>
    </header>
  );
}
