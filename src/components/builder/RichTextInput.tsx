/**
 * RichTextInput — TipTap-based rich text field for the page builder.
 *
 * Emits a ProseMirror/TipTap JSON doc (see rich-text.tsx `RichDoc`) via onChange.
 * Accepts either a legacy plain string or a doc as its value (back-compat).
 *
 * Perf: the TipTap editor is LAZY-mounted. Until the field is clicked it renders a
 * cheap static preview (renderRichText), so a panel with dozens of fields mounts
 * zero editors on load. SSR-safe: editor uses immediatelyRender:false.
 */
import React, { useEffect, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import { Extension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle, Color, FontFamily, FontSize } from "@tiptap/extension-text-style";

// Adds a `fontWeight` attribute to the textStyle mark (TipTap only ships bold=700;
// this lets presets set an explicit weight like 600). Renders inline + round-trips.
const FontWeight = Extension.create({
  name: "fontWeight",
  addGlobalAttributes() {
    return [{
      types: ["textStyle"],
      attributes: {
        fontWeight: {
          default: null,
          parseHTML: (el: HTMLElement) => el.style.fontWeight || null,
          renderHTML: (attrs: { fontWeight?: string | null }) =>
            attrs.fontWeight ? { style: `font-weight:${attrs.fontWeight}` } : {},
        },
      },
    }];
  },
});

// Gradient text — a CSS linear-gradient clipped to the glyphs (background-clip:text).
// Stored as a `gradient` attr on the textStyle mark, mirroring rich-text.tsx's markStyle.
const Gradient = Extension.create({
  name: "gradient",
  addGlobalAttributes() {
    return [{
      types: ["textStyle"],
      attributes: {
        gradient: {
          default: null,
          parseHTML: (el: HTMLElement) =>
            el.style.backgroundImage && el.style.backgroundImage.includes("gradient")
              ? el.style.backgroundImage
              : null,
          renderHTML: (attrs: { gradient?: string | null }) =>
            attrs.gradient
              ? { style: `background-image:${attrs.gradient};-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent` }
              : {},
        },
      },
    }];
  },
});

// Brand teal gradient (matches the site's accent used across hero/brand-strip headings).
const BRAND_GRADIENT = "linear-gradient(96.47deg, #11D6C5 0%, #0A8F86 100%)";

const GRADIENT_PRESETS: { label: string; value: string }[] = [
  { label: "Teal", value: BRAND_GRADIENT },
  { label: "Deep teal", value: "linear-gradient(94.79deg, #0BC5B5 0%, #29535D 100%)" },
  { label: "Coral red", value: "linear-gradient(120deg, #E5484D 0%, #C73237 100%)" },
  { label: "Purple", value: "linear-gradient(96deg, #7C3AED 0%, #4F46E5 100%)" },
  { label: "Sunset", value: "linear-gradient(96deg, #F59E0B 0%, #EF4444 100%)" },
  { label: "Ocean", value: "linear-gradient(96deg, #06B6D4 0%, #2563EB 100%)" },
  { label: "Rose", value: "linear-gradient(96deg, #EC4899 0%, #8B5CF6 100%)" },
];

// One-click heading preset — matches the reference CSS:
//   font-size: clamp(22px, 4vw, 40px); font-weight: 600;
// (responsive 22px→40px, NOT a fixed 22px which would render small on desktop.)
const HEADING_PRESET = { fontSize: "clamp(22px, 4vw, 40px)", fontWeight: "600" };
import {
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  RemoveFormatting,
} from "lucide-react";
import { toRichDoc, renderRichText, isEmptyRich, type RichDoc, type RichValue } from "./rich-text";

const FONT_FAMILIES = [
  { label: "Default font", value: "" },
  { label: "Inter", value: "Inter, sans-serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Courier New", value: "'Courier New', monospace" },
  { label: "Menlo", value: "Menlo, monospace" },
];

const FONT_SIZES = [
  { label: "Size", value: "" },
  ...["14", "16", "18", "20", "24", "30", "36", "48"].map((s) => ({ label: `${s}px`, value: `${s}px` })),
];

const btnBase =
  "flex items-center justify-center w-7 h-7 rounded text-slate-600 hover:bg-slate-200 pb-transition";
const btnActive = "bg-blue-500 text-white hover:bg-blue-500";

const LIST_CSS = `
  .pb-rte-content ul, .pb-rte-render ul { list-style: disc; padding-left: 1.25rem; }
  .pb-rte-content ol, .pb-rte-render ol { list-style: decimal; padding-left: 1.25rem; }
  .pb-rte-content p, .pb-rte-render p { margin: 0 0 0.25rem; }
  .pb-rte-render p:last-child { margin-bottom: 0; }
  .pb-rte-content:focus { outline: none; }
`;

function ToolbarButton({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()} // keep editor selection
      onClick={onClick}
      className={`${btnBase} ${active ? btnActive : ""}`}
    >
      {children}
    </button>
  );
}

/** Gradient-text picker: brand presets + a custom two-colour + angle builder. */
function GradientControl({ editor }: { editor: Editor | null }) {
  const [open, setOpen] = useState(false);
  const [c1, setC1] = useState("#11D6C5");
  const [c2, setC2] = useState("#0A8F86");
  const [angle, setAngle] = useState(96);
  const active = !!editor?.getAttributes("textStyle").gradient;
  const custom = `linear-gradient(${angle}deg, ${c1} 0%, ${c2} 100%)`;
  const apply = (g: string | null) => {
    editor?.chain().focus().setMark("textStyle", { gradient: g }).run();
    setOpen(false);
  };
  const swatch = (v: string): React.CSSProperties => ({
    width: 34, height: 22, borderRadius: 5, border: "1px solid #e2e8f0",
    backgroundImage: v, cursor: "pointer", padding: 0,
  });
  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <ToolbarButton title="Gradient text" active={active} onClick={() => setOpen((o) => !o)}>
        <span style={{ fontWeight: 800, fontSize: 13, backgroundImage: BRAND_GRADIENT, WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent" }}>A</span>
      </ToolbarButton>
      {open && (
        <>
          <div onMouseDown={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
          <div
            style={{ position: "absolute", top: "115%", left: 0, zIndex: 50, width: 224, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, boxShadow: "0 10px 30px rgba(0,0,0,0.15)", padding: 10 }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", color: "#94a3b8", marginBottom: 6 }}>Presets</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
              {GRADIENT_PRESETS.map((p) => (
                <button key={p.value} type="button" title={p.label} onMouseDown={(e) => e.preventDefault()} onClick={() => apply(p.value)} style={swatch(p.value)} />
              ))}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", color: "#94a3b8", marginBottom: 6 }}>Custom</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <input type="color" value={c1} onChange={(e) => setC1(e.target.value)} title="Start colour" style={{ width: 30, height: 26, border: "none", background: "none", padding: 0, cursor: "pointer" }} />
              <input type="color" value={c2} onChange={(e) => setC2(e.target.value)} title="End colour" style={{ width: 30, height: 26, border: "none", background: "none", padding: 0, cursor: "pointer" }} />
              <label style={{ marginLeft: "auto", fontSize: 11, color: "#64748b", display: "inline-flex", alignItems: "center", gap: 3 }}>
                <input type="number" value={angle} onChange={(e) => setAngle(Number(e.target.value) || 0)} style={{ width: 48, fontSize: 11, border: "1px solid #e2e8f0", borderRadius: 4, padding: "2px 4px" }} />°
              </label>
            </div>
            <div style={{ height: 18, borderRadius: 4, backgroundImage: custom, marginBottom: 10, border: "1px solid #e2e8f0" }} />
            <div style={{ display: "flex", gap: 6 }}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => apply(custom)} style={{ flex: 1, fontSize: 12, fontWeight: 600, background: "#3b82f6", color: "#fff", border: "none", borderRadius: 6, padding: "5px 0", cursor: "pointer" }}>Apply</button>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => apply(null)} style={{ fontSize: 12, color: "#64748b", background: "#f1f5f9", border: "none", borderRadius: 6, padding: "5px 10px", cursor: "pointer" }}>Remove</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** The actual TipTap editor — only mounted once the field is activated. */
function RichEditor({ value, onChange }: { value: RichValue; onChange: (v: RichDoc) => void }) {
  const editor = useEditor({
    immediatelyRender: false,
    autofocus: "end",
    extensions: [StarterKit, TextStyle, Color, FontFamily, FontSize, FontWeight, Gradient],
    content: toRichDoc(value),
    onUpdate: ({ editor }) => onChange(editor.getJSON() as RichDoc),
    editorProps: {
      attributes: {
        class: "pb-rte-content outline-none min-h-[60px] px-2.5 py-2 text-sm text-slate-900",
      },
    },
  });

  // Sync external value changes without clobbering active typing.
  useEffect(() => {
    if (!editor) return;
    const incoming = JSON.stringify(toRichDoc(value));
    const current = JSON.stringify(editor.getJSON());
    if (incoming !== current && !editor.isFocused) {
      editor.commands.setContent(toRichDoc(value), { emitUpdate: false });
    }
  }, [value, editor]);

  const currentColor = (editor?.getAttributes("textStyle").color as string) || "#000000";
  const currentFont = (editor?.getAttributes("textStyle").fontFamily as string) || "";
  const currentSize = (editor?.getAttributes("textStyle").fontSize as string) || "";
  const currentWeight = (editor?.getAttributes("textStyle").fontWeight as string) || "";
  const isHeadingPreset = currentSize === HEADING_PRESET.fontSize && currentWeight === HEADING_PRESET.fontWeight;

  return (
    <div className="rounded-md border border-blue-400 overflow-hidden" style={{ background: "#f8fafc" }}>
      <div className="flex flex-wrap items-center gap-0.5 px-1.5 py-1 border-b border-slate-200 bg-white">
        <ToolbarButton title="Bold" active={editor?.isActive("bold")} onClick={() => editor?.chain().focus().toggleBold().run()}>
          <BoldIcon size={14} />
        </ToolbarButton>
        <ToolbarButton title="Italic" active={editor?.isActive("italic")} onClick={() => editor?.chain().focus().toggleItalic().run()}>
          <ItalicIcon size={14} />
        </ToolbarButton>
        <ToolbarButton title="Underline" active={editor?.isActive("underline")} onClick={() => editor?.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon size={14} />
        </ToolbarButton>
        <ToolbarButton title="Strikethrough" active={editor?.isActive("strike")} onClick={() => editor?.chain().focus().toggleStrike().run()}>
          <Strikethrough size={14} />
        </ToolbarButton>

        <span className="w-px h-4 bg-slate-200 mx-0.5" />

        <ToolbarButton title="Bullet list" active={editor?.isActive("bulletList")} onClick={() => editor?.chain().focus().toggleBulletList().run()}>
          <List size={14} />
        </ToolbarButton>
        <ToolbarButton title="Numbered list" active={editor?.isActive("orderedList")} onClick={() => editor?.chain().focus().toggleOrderedList().run()}>
          <ListOrdered size={14} />
        </ToolbarButton>

        <span className="w-px h-4 bg-slate-200 mx-0.5" />

        {/* Color */}
        <label className={btnBase} title="Text color" style={{ cursor: "pointer", position: "relative" }} onMouseDown={(e) => e.preventDefault()}>
          <span style={{ fontWeight: 700, fontSize: 13, color: currentColor === "#000000" ? "#334155" : currentColor }}>A</span>
          <input
            type="color"
            value={currentColor}
            onChange={(e) => editor?.chain().focus().setColor(e.target.value).run()}
            style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
          />
        </label>
        <ToolbarButton title="Clear color" onClick={() => editor?.chain().focus().unsetColor().setMark("textStyle", { gradient: null }).run()}>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>✕</span>
        </ToolbarButton>

        {/* Gradient text — presets + custom builder */}
        <GradientControl editor={editor} />

        {/* Font family */}
        <select
          title="Font"
          value={currentFont}
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => {
            const v = e.target.value;
            if (v) editor?.chain().focus().setFontFamily(v).run();
            else editor?.chain().focus().unsetFontFamily().run();
          }}
          className="text-xs rounded border border-slate-200 bg-white px-1 py-0.5 text-slate-700 outline-none"
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f.label} value={f.value}>{f.label}</option>
          ))}
        </select>

        {/* Font size */}
        <select
          title="Font size"
          value={currentSize}
          onChange={(e) => {
            const v = e.target.value;
            if (v) editor?.chain().focus().setFontSize(v).run();
            else editor?.chain().focus().unsetFontSize().run();
          }}
          className="text-xs rounded border border-slate-200 bg-white px-1 py-0.5 text-slate-700 outline-none"
        >
          {FONT_SIZES.map((s) => (
            <option key={s.label} value={s.value}>{s.label}</option>
          ))}
        </select>

        {/* Heading preset — 22px / weight 600 (toggle) */}
        <ToolbarButton
          title="Heading style (22px / 600)"
          active={isHeadingPreset}
          onClick={() =>
            editor?.chain().focus().setMark("textStyle", isHeadingPreset
              ? { fontSize: null, fontWeight: null }
              : { fontSize: HEADING_PRESET.fontSize, fontWeight: HEADING_PRESET.fontWeight }).run()
          }
        >
          <span style={{ fontWeight: 700, fontSize: 12 }}>H1</span>
        </ToolbarButton>

        <ToolbarButton title="Clear formatting" onClick={() => editor?.chain().focus().unsetAllMarks().run()}>
          <RemoveFormatting size={14} />
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}

export function RichTextInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: RichValue;
  onChange: (v: RichDoc) => void;
}) {
  const [active, setActive] = useState(false);
  const empty = isEmptyRich(value);

  return (
    <div>
      <label className="block text-xs font-medium text-slate-300 mb-1.5">{label}</label>
      {active ? (
        <RichEditor value={value} onChange={onChange} />
      ) : (
        <div
          role="textbox"
          tabIndex={0}
          onClick={() => setActive(true)}
          onFocus={() => setActive(true)}
          className="pb-rte-render rounded-md border border-slate-200 px-2.5 py-2 text-sm text-slate-900 min-h-[38px] cursor-text leading-relaxed"
          style={{ background: "#f8fafc" }}
        >
          {empty ? <span className="text-slate-400">Click to edit…</span> : renderRichText(value)}
        </div>
      )}
      <style>{LIST_CSS}</style>
    </div>
  );
}
