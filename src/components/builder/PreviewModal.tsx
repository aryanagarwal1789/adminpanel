import { X } from "lucide-react";
import { BlockRenderer } from "./blocks";
import type { Block, Theme } from "./types";
import { themeStyle } from "./theme-utils";
import { blockOuterStyle } from "./block-style";

export function PreviewModal({ blocks, theme, onClose }: { blocks: Block[]; theme: Theme; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col" style={{ background: theme.pageBg }}>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg pb-transition hover:opacity-90"
        style={{ background: "#0f172a" }}
        title="Close preview"
      >
        <X size={18} />
      </button>
      <div className="flex-1 overflow-auto" style={themeStyle(theme)}>
        {blocks.filter((b) => !b.hidden).map((b) => (
          <div key={b.id} style={blockOuterStyle(b.style)}>
            <BlockRenderer block={b} />
          </div>
        ))}
        {blocks.length === 0 && (
          <div className="py-24 text-center text-slate-400">This page is empty.</div>
        )}
      </div>
    </div>
  );
}
