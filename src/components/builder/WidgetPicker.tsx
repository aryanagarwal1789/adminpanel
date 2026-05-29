import { useMemo, useState } from "react";
import { X, ChevronDown, ChevronRight, Search } from "lucide-react";
import { WIDGET_CATEGORIES, WIDGET_REGISTRY, type WidgetType } from "./widgets";

export function WidgetPicker({
  open, onClose, onPick, onDragStart,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (t: WidgetType) => void;
  onDragStart?: (t: WidgetType, e: React.MouseEvent) => void;
}) {
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const q = search.trim().toLowerCase();
  const visibleCategories = useMemo(() => {
    return WIDGET_CATEGORIES.map((cat) => ({
      ...cat,
      types: cat.types.filter((t) => {
        const meta = WIDGET_REGISTRY[t];
        if (!meta) return false;
        if (!q) return true;
        return meta.label.toLowerCase().includes(q) || t.includes(q);
      }),
    })).filter((c) => c.types.length > 0);
  }, [q]);

  if (!open) return null;

  return (
    <div className="flex flex-col flex-1 min-h-0 text-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
        <div className="text-sm font-semibold">Add widget</div>
        <button onClick={onClose} className="p-1 rounded hover:bg-slate-800 pb-transition"><X size={14} /></button>
      </div>
      <div className="p-3 border-b border-slate-800 shrink-0">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search widgets..."
            className="w-full pl-7 pr-2 py-1.5 text-sm rounded-md bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 outline-none focus:border-blue-500 pb-transition"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {visibleCategories.length === 0 && (
          <div className="p-6 text-center text-xs text-slate-400">No widgets match "{search}"</div>
        )}
        {visibleCategories.map((cat) => {
          const isOpen = q ? true : !collapsed[cat.key];
          return (
            <div key={cat.key} className="border-b border-slate-800/60 last:border-b-0">
              <button
                onClick={() => setCollapsed((c) => ({ ...c, [cat.key]: !c[cat.key] }))}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-slate-800/40 pb-transition"
              >
                {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                <span className="text-sm font-semibold flex-1">{cat.name}</span>
                <span className="text-xs text-slate-400">{cat.types.length}</span>
              </button>
              {isOpen && (
                <div className="grid grid-cols-4 gap-1.5 px-3 pb-3">
                  {cat.types.map((t) => {
                    const meta = WIDGET_REGISTRY[t];
                    if (!meta) return null;
                    const Icon = meta.Icon;
                    return (
                      <button
                        key={`${cat.key}-${t}`}
                        onClick={() => { onPick(t); onClose(); }}
                        onMouseDown={(e) => { e.preventDefault(); onDragStart?.(t, e); }}
                        className="group flex flex-col items-center justify-center gap-1 p-2 rounded-md bg-slate-800/40 hover:bg-slate-700 hover:ring-1 hover:ring-blue-500 pb-transition"
                        title={`${meta.label} — drag to canvas or click to add`}
                      >
                        <div className="flex gap-0.5 mb-0.5 opacity-30">
                          {Array.from({ length: 6 }).map((_, i) => (
                            <span key={i} className="w-0.5 h-0.5 rounded-full bg-slate-300" />
                          ))}
                        </div>
                        <Icon size={18} className="text-slate-300" />
                        <span className="text-[10px] text-center text-slate-200 leading-tight line-clamp-2">
                          {meta.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
