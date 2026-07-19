/**
 * rich-text.tsx — shared rich-text format + renderer.
 *
 * This file is intentionally DEPENDENCY-FREE (React only, no TipTap import) so it
 * can be copied verbatim into the marketing site repo (Salescode-self-serve) and
 * used to render the exact same config the admin panel produces.
 *
 * Stored format = a subset of the ProseMirror/TipTap JSON doc. `renderRichText`
 * also accepts a plain string (legacy content, incl. the `**word**` accent
 * convention) so nothing that already exists breaks.
 */
import React from "react";

/* ---------------------------------- types --------------------------------- */

export interface RichMark {
  type: "bold" | "italic" | "underline" | "strike" | "textStyle";
  attrs?: {
    color?: string;
    fontFamily?: string;
    fontSize?: string; // e.g. "20px"
    fontWeight?: string; // e.g. "600"
  };
}

export interface RichNode {
  type:
    | "doc"
    | "paragraph"
    | "text"
    | "hardBreak"
    | "bulletList"
    | "orderedList"
    | "listItem"
    | "heading";
  text?: string;
  marks?: RichMark[];
  attrs?: Record<string, unknown>;
  content?: RichNode[];
}

export interface RichDoc {
  type: "doc";
  content?: RichNode[];
}

export type RichValue = string | RichDoc | null | undefined;

/* -------------------------------- guards ---------------------------------- */

export function isRichDoc(v: unknown): v is RichDoc {
  return !!v && typeof v === "object" && (v as RichNode).type === "doc";
}

/** Wrap a plain string into a doc (used lazily on first edit). */
export function toRichDoc(v: RichValue): RichDoc {
  if (isRichDoc(v)) return v;
  const text = typeof v === "string" ? v : "";
  const paragraphs = text.split("\n").map<RichNode>((line) => ({
    type: "paragraph",
    content: line ? [{ type: "text", text: line }] : [],
  }));
  return { type: "doc", content: paragraphs.length ? paragraphs : [{ type: "paragraph" }] };
}

/** True when the doc has no visible text — used to fall back to a placeholder. */
export function isEmptyRich(v: RichValue): boolean {
  if (typeof v === "string") return v.trim() === "";
  if (!isRichDoc(v)) return true;
  const hasText = (n: RichNode): boolean =>
    (n.type === "text" && !!n.text?.trim()) || (n.content?.some(hasText) ?? false);
  return !(v.content?.some(hasText) ?? false);
}

/* --------------------- legacy split-field composition --------------------- */

export const DEFAULT_ACCENT = "#00C6B1";

export interface LegacySegment {
  /** raw text for this segment */
  text: string;
  /** true = the "accent"/bold/highlight middle segment */
  accent?: boolean;
}

/**
 * Compose legacy split fields (e.g. headingPre + headingAccent + headingSuffix)
 * into a single RichDoc paragraph. Accent segments become bold + accent-colored.
 * Used to seed the editor AND as the marketing-side fallback for content that has
 * no rich field yet.
 */
export function composeSegmentsToDoc(segments: LegacySegment[], accentColor = DEFAULT_ACCENT): RichDoc {
  const content: RichNode[] = [];
  for (const seg of segments) {
    if (!seg.text) continue;
    content.push({
      type: "text",
      text: seg.text,
      marks: seg.accent
        ? [{ type: "bold" }, { type: "textStyle", attrs: { color: accentColor } }]
        : undefined,
    });
  }
  return { type: "doc", content: [{ type: "paragraph", content: content.length ? content : undefined }] };
}

/**
 * Marketing-side helper: prefer the rich field; otherwise compose the legacy
 * segments. `richValue` is f[`${base}Rich`]; `segments` are the legacy parts in
 * display order with accent flags.
 */
export function pickGroupRich(richValue: unknown, segments: LegacySegment[], accentColor = DEFAULT_ACCENT): RichDoc {
  if (isRichDoc(richValue)) return richValue;
  return composeSegmentsToDoc(segments, accentColor);
}

/* -------------------------------- rendering ------------------------------- */

function markStyle(marks?: RichMark[]): React.CSSProperties {
  const s: React.CSSProperties = {};
  const decorations: string[] = [];
  for (const m of marks ?? []) {
    if (m.type === "bold") s.fontWeight = 700;
    else if (m.type === "italic") s.fontStyle = "italic";
    else if (m.type === "underline") decorations.push("underline");
    else if (m.type === "strike") decorations.push("line-through");
    else if (m.type === "textStyle" && m.attrs) {
      if (m.attrs.color) s.color = m.attrs.color;
      if (m.attrs.fontFamily) s.fontFamily = m.attrs.fontFamily;
      if (m.attrs.fontSize) s.fontSize = m.attrs.fontSize;
      if (m.attrs.fontWeight) s.fontWeight = m.attrs.fontWeight;
    }
  }
  if (decorations.length) s.textDecoration = decorations.join(" ");
  return s;
}

/** Legacy `**word**` → accent-colored bold span. Only applied when accentColor is set. */
function renderAccentString(text: string, accentColor?: string): React.ReactNode {
  if (!accentColor || !text.includes("**")) return text;
  const parts = text.split(/\*\*(.+?)\*\*/g); // odd indexes are highlighted
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} style={{ color: accentColor, fontWeight: 700 }}>
        {part}
      </span>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    ),
  );
}

interface RenderOpts {
  /** Legacy accent color for `**word**` in plain strings. */
  accentColor?: string;
  /** Inline mode: flatten paragraphs (join with <br/>), no <p>/list wrappers. For headings. */
  inline?: boolean;
}

function renderNodes(nodes: RichNode[] | undefined, opts: RenderOpts, keyPrefix: string): React.ReactNode[] {
  if (!nodes) return [];
  return nodes.map((n, i) => renderNode(n, opts, `${keyPrefix}-${i}`));
}

function renderInlineChildren(nodes: RichNode[] | undefined, opts: RenderOpts, keyPrefix: string): React.ReactNode[] {
  if (!nodes) return [];
  return nodes.map((n, i) => {
    const key = `${keyPrefix}-${i}`;
    if (n.type === "text") {
      const content = renderAccentString(n.text ?? "", opts.accentColor);
      const style = markStyle(n.marks);
      return Object.keys(style).length ? (
        <span key={key} style={style}>
          {content}
        </span>
      ) : (
        <React.Fragment key={key}>{content}</React.Fragment>
      );
    }
    if (n.type === "hardBreak") return <br key={key} />;
    return <React.Fragment key={key}>{renderNode(n, opts, key)}</React.Fragment>;
  });
}

function renderNode(node: RichNode, opts: RenderOpts, key: string): React.ReactNode {
  switch (node.type) {
    case "doc":
      if (opts.inline) return flattenInline(node.content, opts, key);
      return <React.Fragment key={key}>{renderNodes(node.content, opts, key)}</React.Fragment>;
    case "paragraph":
      if (opts.inline) return <React.Fragment key={key}>{renderInlineChildren(node.content, opts, key)}</React.Fragment>;
      return <p key={key}>{renderInlineChildren(node.content, opts, key)}</p>;
    case "heading": {
      const level = Math.min(6, Math.max(1, Number(node.attrs?.level) || 2));
      const Tag = `h${level}` as React.ElementType;
      return <Tag key={key}>{renderInlineChildren(node.content, opts, key)}</Tag>;
    }
    case "bulletList":
      return <ul key={key}>{renderNodes(node.content, opts, key)}</ul>;
    case "orderedList":
      return <ol key={key}>{renderNodes(node.content, opts, key)}</ol>;
    case "listItem":
      return <li key={key}>{renderNodes(node.content, opts, key)}</li>;
    case "text": {
      const content = renderAccentString(node.text ?? "", opts.accentColor);
      const style = markStyle(node.marks);
      return Object.keys(style).length ? (
        <span key={key} style={style}>
          {content}
        </span>
      ) : (
        <React.Fragment key={key}>{content}</React.Fragment>
      );
    }
    case "hardBreak":
      return <br key={key} />;
    default:
      return null;
  }
}

/** Flatten all paragraphs of a doc into inline content separated by <br/> (for headings). */
function flattenInline(nodes: RichNode[] | undefined, opts: RenderOpts, key: string): React.ReactNode {
  if (!nodes) return null;
  const out: React.ReactNode[] = [];
  nodes.forEach((n, i) => {
    if (i > 0 && n.type === "paragraph") out.push(<br key={`${key}-sep-${i}`} />);
    out.push(<React.Fragment key={`${key}-${i}`}>{renderInlineChildren(n.content, opts, `${key}-${i}`)}</React.Fragment>);
  });
  return out;
}

/**
 * Render stored rich-text (string or doc) to React nodes. Pure & SSR-safe.
 *
 * @param value       string (legacy) or RichDoc JSON
 * @param opts.accentColor  legacy `**word**` accent color (plain strings only)
 * @param opts.inline       flatten to inline content (headings)
 */
export function renderRichText(value: RichValue, opts: RenderOpts = {}): React.ReactNode {
  if (value == null) return null;
  if (typeof value === "string") {
    if (opts.inline) return renderAccentString(value, opts.accentColor);
    // preserve legacy newline behavior; caller usually sets whitespace-pre-wrap too
    return <p style={{ whiteSpace: "pre-wrap" }}>{renderAccentString(value, opts.accentColor)}</p>;
  }
  if (isRichDoc(value)) return renderNode(value, opts, "r");
  return null;
}

/* ----------------- global field resolution (renderer side) ---------------- */

/**
 * Renderer-side helper: given a block's raw `fields`, replace any `${key}Rich`
 * rich doc with a rendered React node on the SAME `key` the component reads.
 * Split fields stay independent (each `${key}Rich` → its own `key` slot), so
 * components that apply special styling per segment (gradient spans, `<br/>`,
 * badges) keep working. Recurses into nested arrays/objects (array-item fields).
 * Returns the input unchanged when no `*Rich` field exists (legacy = identical).
 *
 *   const f = resolveRichFields(block.fields as Record<string, unknown>);
 */
export function resolveRichFields(fields: Record<string, unknown>): Record<string, unknown> {
  return resolveValue(fields) as Record<string, unknown>;
}

/**
 * If a doc is "plain" (single paragraph, no marks, no breaks/lists) return its text,
 * so unstyled rich content resolves back to a plain string. Returns null when the doc
 * carries any formatting (then it must render as a React node).
 */
function docToPlainText(doc: RichDoc): string | null {
  const content = doc.content;
  if (!content || content.length === 0) return "";
  if (content.length > 1) return null; // multiple blocks
  const para = content[0];
  if (para.type !== "paragraph") return null;
  let text = "";
  for (const n of para.content ?? []) {
    if (n.type !== "text") return null; // hardBreak/other → formatted
    if (n.marks && n.marks.length) return null; // styled → formatted
    text += n.text ?? "";
  }
  return text;
}

function resolveValue(value: unknown): unknown {
  if (value == null || typeof value !== "object") return value;
  if (React.isValidElement(value)) return value; // never descend into rendered nodes
  if (isRichDoc(value)) return value;

  if (Array.isArray(value)) {
    let changed = false;
    const arr = value.map((item) => {
      const r = resolveValue(item);
      if (r !== item) changed = true;
      return r;
    });
    return changed ? arr : value;
  }

  const obj = value as Record<string, unknown>;
  let out: Record<string, unknown> | null = null;
  const ensure = () => (out ??= { ...obj });

  // 1) resolve `${key}Rich` docs into the exact same `key` (no regrouping).
  //    Unformatted docs collapse back to a plain STRING so downstream string ops
  //    (e.g. legacy `**accent**` parsers doing text.split/replace) keep working.
  for (const key of Object.keys(obj)) {
    if (!key.endsWith("Rich") || !isRichDoc(obj[key])) continue;
    const o = ensure();
    const doc = obj[key] as RichDoc;
    const plain = docToPlainText(doc);
    o[key.slice(0, -4)] = plain !== null ? plain : renderRichText(doc, { inline: true });
    delete o[key];
  }

  // 2) recurse into child objects/arrays (e.g. fields.items[].fooRich).
  const src = out ?? obj;
  for (const key of Object.keys(src)) {
    const child = src[key];
    if (child && typeof child === "object" && !React.isValidElement(child) && !isRichDoc(child)) {
      const r = resolveValue(child);
      if (r !== child) ensure()[key] = r;
    }
  }

  return out ?? obj;
}

/**
 * Binding helper for rich text inside array/repeater items. Stores rich content on
 * `${key}Rich` of the item, seeded from the legacy `item[key]` string. Usage:
 *   <RichTextInput label="Quote" {...richItemProps(it, 'quote', u)} />
 */
export function richItemProps<T>(it: T, key: string, update: (next: T) => void) {
  const rec = it as Record<string, unknown>;
  return {
    value: (rec[key + "Rich"] ?? rec[key]) as RichValue,
    onChange: (doc: RichDoc) => update({ ...it, [key + "Rich"]: doc } as T),
  };
}
