import { useState } from "react";
import { ChevronDown, GripVertical, Plus, Trash2, Settings2 } from "lucide-react";
import { WidgetEditor } from "./WidgetEditor";
import { ColorPicker, NumberInput } from "./fields";
import { defaultWidget, WIDGET_REGISTRY, type Widget, type WidgetType } from "./widgets";
import type { Block, LayoutVariant } from "./types";

interface ColStyle { bgColor?: string; padding?: number; verticalAlign?: string; gap?: number; }

const COL_COUNT: Record<LayoutVariant, number> = { "1": 1, "2": 2, "3": 3, "1-2": 2, "2-1": 2, "4": 4 };

export function LayoutEditor({
  block, update, openWidgetPicker,
}: {
  block: Block;
  update: (patch: Record<string, unknown>) => void;
  openWidgetPicker: (col: number, onPick: (t: WidgetType) => void) => void;
}) {
  const variant: LayoutVariant = block.layout ?? "2";
  const nCols = COL_COUNT[variant];
  const cols = ensureColumns((block.fields as { columns?: Widget[][] }).columns, nCols);

  const [openWidget, setOpenWidget] = useState<{ col: number; id: string } | null>(null);
  const [dragRef, setDragRef] = useState<{ col: number; id: string } | null>(null);
  const [openColSettings, setOpenColSettings] = useState<number | null>(null);

  const colStyles: ColStyle[] = ((block.fields as { columnStyles?: ColStyle[] }).columnStyles) ?? [];
  const getColStyle = (i: number): ColStyle => colStyles[i] ?? {};
  const setColStyle = (i: number, patch: Partial<ColStyle>) => {
    const next = cols.map((_, j) => j === i ? { ...getColStyle(i), ...patch } : getColStyle(j));
    update({ columnStyles: next });
  };

  const setCols = (next: Widget[][]) => update({ columns: next });

  const addWidget = (colIdx: number, type: WidgetType) => {
    const next = cols.map((c) => [...c]);
    const w = defaultWidget(type);
    next[colIdx].push(w);
    setCols(next);
    setOpenWidget({ col: colIdx, id: w.id });
  };

  const removeWidget = (colIdx: number, id: string) => {
    const next = cols.map((c, i) => (i === colIdx ? c.filter((w) => w.id !== id) : c));
    setCols(next);
    if (openWidget?.id === id) setOpenWidget(null);
  };

  const updateWidget = (colIdx: number, id: string, props: Record<string, unknown>) => {
    const next = cols.map((c, i) =>
      i === colIdx ? c.map((w) => (w.id === id ? { ...w, props } : w)) : c,
    );
    setCols(next);
  };

  const handleDrop = (colIdx: number, targetId: string) => {
    if (!dragRef) return;
    const { col: fromCol, id: fromId } = dragRef;
    if (fromCol === colIdx && fromId === targetId) return;
    const next = cols.map((c) => [...c]);
    const fromIdx = next[fromCol].findIndex((w) => w.id === fromId);
    if (fromIdx < 0) return;
    const [moved] = next[fromCol].splice(fromIdx, 1);
    const toIdx = next[colIdx].findIndex((w) => w.id === targetId);
    next[colIdx].splice(toIdx >= 0 ? toIdx : next[colIdx].length, 0, moved);
    setCols(next);
    setDragRef(null);
  };

  return (
    <div className="space-y-4">
      <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
        Layout — {nCols} {nCols === 1 ? "column" : "columns"}
      </div>

      {cols.map((widgets, colIdx) => (
        <div key={colIdx} className="rounded-md border border-slate-700 overflow-hidden">
          <div className="px-3 py-2 bg-slate-800/50 text-xs font-semibold text-slate-200 flex items-center justify-between">
            <span>Column {colIdx + 1}</span>
            <button
              onClick={() => setOpenColSettings(openColSettings === colIdx ? null : colIdx)}
              className="p-0.5 rounded hover:bg-slate-700 text-slate-400 pb-transition"
              title="Column style"
            >
              <Settings2 size={12} />
            </button>
          </div>
          {openColSettings === colIdx && (
            <div className="px-3 py-2 bg-slate-900/60 border-b border-slate-700 space-y-2">
              <ColorPicker label="Background color" value={getColStyle(colIdx).bgColor ?? ''} onChange={(v) => setColStyle(colIdx, { bgColor: v || undefined })} />
              <NumberInput label="Padding (px)" value={getColStyle(colIdx).padding ?? 0} onChange={(v) => setColStyle(colIdx, { padding: v || undefined })} />
              <NumberInput label="Gap between widgets (px)" value={getColStyle(colIdx).gap ?? 16} onChange={(v) => setColStyle(colIdx, { gap: v })} />
              <div>
                <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Vertical align</span>
                <select value={getColStyle(colIdx).verticalAlign ?? 'start'} onChange={(e) => setColStyle(colIdx, { verticalAlign: e.target.value })}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 4, padding: '5px 8px', fontSize: 12 }}>
                  <option value="start">Top</option>
                  <option value="center">Center</option>
                  <option value="end">Bottom</option>
                </select>
              </div>
            </div>
          )}
          <div className="p-2 space-y-1.5 bg-slate-900/40">
            {widgets.length === 0 && (
              <div className="text-[11px] text-slate-500 text-center py-3">No widgets yet.</div>
            )}
            {widgets.map((w) => {
              const isOpen = openWidget?.col === colIdx && openWidget?.id === w.id;
              const meta = WIDGET_REGISTRY[w.type];
              const Icon = meta?.Icon;
              return (
                <div key={w.id} className="rounded-md border border-slate-700 bg-slate-800/40 overflow-hidden">
                  <div
                    draggable
                    onDragStart={() => setDragRef({ col: colIdx, id: w.id })}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(colIdx, w.id)}
                    className="flex items-center gap-2 px-2 py-1.5"
                  >
                    <GripVertical size={13} className="text-slate-500 cursor-grab shrink-0" />
                    <button
                      onClick={() => setOpenWidget(isOpen ? null : { col: colIdx, id: w.id })}
                      className="flex-1 flex items-center gap-2 text-left text-xs text-slate-200"
                    >
                      <ChevronDown size={11} style={{ transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)" }} className="pb-transition shrink-0" />
                      {Icon && <Icon size={13} className="text-slate-400 shrink-0" />}
                      <span className="truncate">{meta?.label ?? w.type}</span>
                    </button>
                    <button
                      onClick={() => removeWidget(colIdx, w.id)}
                      className="text-slate-500 hover:text-red-400 shrink-0"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  {isOpen && (
                    <div className="p-3 border-t border-slate-700 bg-slate-900/60">
                      <WidgetEditor widget={w} update={(props) => updateWidget(colIdx, w.id, props)} openWidgetPicker={openWidgetPicker} />
                    </div>
                  )}
                </div>
              );
            })}
            <button
              onClick={() => openWidgetPicker(colIdx, (t) => addWidget(colIdx, t))}
              className="mt-1 w-full flex items-center justify-center gap-1.5 text-xs text-slate-300 hover:text-white border border-dashed border-slate-700 hover:border-slate-500 rounded-md py-2 pb-transition"
            >
              <Plus size={12} /> Add widget
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ensureColumns(cols: Widget[][] | undefined, n: number): Widget[][] {
  const safe = Array.isArray(cols) ? cols.slice(0, n) : [];
  while (safe.length < n) safe.push([]);
  return safe.map((c) => (Array.isArray(c) ? c : []));
}
