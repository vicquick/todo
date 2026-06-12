/**
 * Drag-and-drop backend config shared by the list reorder and the kanban board.
 *
 * react-dnd's HTML5 backend is mouse-only — it does nothing on touch screens,
 * which left reorder + board moves dead on phones. This wires a multi-backend
 * pipeline: HTML5 for mouse, TouchBackend for touch. `delayTouchStart` lets a
 * quick swipe scroll the page while a short press-and-hold starts a drag, so
 * dragging and scrolling coexist on a phone.
 */
import type { ReactNode } from "react";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import {
  DndProvider,
  MultiBackend,
  MouseTransition,
  TouchTransition,
  Preview,
} from "react-dnd-multi-backend";

export const DND_OPTIONS = {
  backends: [
    {
      id: "html5",
      backend: HTML5Backend,
      transition: MouseTransition,
    },
    {
      id: "touch",
      backend: TouchBackend,
      // press-and-hold ~180ms to drag; quicker touches scroll/tap through
      options: { enableMouseEvents: false, delayTouchStart: 180 },
      preview: true,
      transition: TouchTransition,
    },
  ],
};

/** A lightweight drag ghost the touch backend can render (it has none by default). */
function DragPreview() {
  return (
    <Preview>
      {({ style }) => (
        <div
          style={style}
          className="pointer-events-none rounded-lg border border-ring/70 bg-card/95 px-3 py-2 text-sm shadow-soft-lg"
        >
          Moving…
        </div>
      )}
    </Preview>
  );
}

export function DndRoot({ children }: { children: ReactNode }) {
  return (
    <DndProvider backend={MultiBackend} options={DND_OPTIONS}>
      <DragPreview />
      {children}
    </DndProvider>
  );
}
