import { useRef, useState } from "react";

/** HTML5 drag-and-drop reorder for one list; spread dragProps(i) on each row/handle. */
export function useDragReorder(onMove: (from: number, to: number) => void) {
  const dragItem = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const dragProps = (idx: number) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      e.stopPropagation();
      dragItem.current = idx;
    },
    onDragOver: (e: React.DragEvent) => {
      if (dragItem.current === null) return;
      e.preventDefault();
      setDragOver(idx);
    },
    onDragLeave: () => setDragOver(null),
    onDrop: (e: React.DragEvent) => {
      if (dragItem.current === null) return;
      e.stopPropagation();
      setDragOver(null);
      const from = dragItem.current;
      dragItem.current = null;
      if (from !== idx) onMove(from, idx);
    },
    onDragEnd: () => {
      dragItem.current = null;
      setDragOver(null);
    },
  });

  return { dragOver, dragProps };
}
