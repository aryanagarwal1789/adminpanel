// Rich-text (ProseMirror/Tiptap) helpers for translation. Dependency-free so the
// exact same logic can be mirrored in the marketplace overlay.
//
// Formatted INLINE rich fields (a heading/paragraph split into several styled
// runs, e.g. "**AI Native SFA** with **AI**") were being enumerated run-by-run,
// so one on-screen sentence became several partial, un-orderable rows. These
// helpers let the editor expose such a field as ONE row (the whole sentence) and
// rebuild a valid doc from the translated text. Multi-block / list docs are left
// alone (one clean row per bullet is fine, and rebuilding would drop the list).

export interface RichMark {
  type: string;
  attrs?: Record<string, unknown>;
}
export interface RichNode {
  type: string;
  text?: string;
  marks?: RichMark[];
  attrs?: Record<string, unknown>;
  content?: RichNode[];
}
export interface RichDoc {
  type: "doc";
  content?: RichNode[];
}

export function isRichDoc(v: unknown): v is RichDoc {
  return !!v && typeof v === "object" && (v as RichNode).type === "doc";
}

// A rich doc is "inline" when every top-level block is a paragraph/heading whose
// children are only text/hardBreak — i.e. no bullet/ordered lists to preserve.
// Only these are safe to collapse into a single translatable row and rebuild.
export function isInlineRichDoc(doc: RichDoc): boolean {
  const blocks = doc.content ?? [];
  if (blocks.length === 0) return false;
  return blocks.every(
    (b) =>
      (b.type === "paragraph" || b.type === "heading") &&
      (b.content ?? []).every((c) => c.type === "text" || c.type === "hardBreak"),
  );
}

// Flatten a doc's visible text: runs concatenate, hardBreaks and block
// boundaries become newlines. Round-trips with richDocFromText.
export function richDocToText(doc: RichDoc): string {
  const runText = (nodes: RichNode[] | undefined): string =>
    (nodes ?? [])
      .map((n) => {
        if (n.type === "text") return n.text ?? "";
        if (n.type === "hardBreak") return "\n";
        return runText(n.content);
      })
      .join("");
  return (doc.content ?? []).map((b) => runText(b.content)).join("\n");
}

// If every text run shares the same marks, return them — so a heading that is
// uniformly styled (all teal, say) keeps that style after translation. Mixed
// styling (accent on some words) returns undefined → translated text is plain,
// inheriting the component's base style rather than guessing where accents go.
function uniformMarks(doc: RichDoc): RichMark[] | undefined {
  const runs: RichNode[] = [];
  const collect = (nodes: RichNode[] | undefined) =>
    (nodes ?? []).forEach((n) => {
      if (n.type === "text") runs.push(n);
      else if (n.content) collect(n.content);
    });
  (doc.content ?? []).forEach((b) => collect(b.content));
  if (!runs.length) return undefined;
  const first = JSON.stringify(runs[0].marks ?? null);
  const allSame = runs.every((r) => JSON.stringify(r.marks ?? null) === first);
  return allSame && runs[0].marks?.length ? runs[0].marks : undefined;
}

// Rebuild an inline doc from translated text, preserving block types (heading vs
// paragraph) and uniform styling where present. Each line → one block, one run.
export function richDocFromText(text: string, baseDoc: RichDoc): RichDoc {
  const marks = uniformMarks(baseDoc);
  const baseBlocks = baseDoc.content ?? [];
  const lines = text.split("\n");
  const content: RichNode[] = lines.map((line, i) => {
    const base = baseBlocks[Math.min(i, Math.max(0, baseBlocks.length - 1))];
    const type = base && base.type === "heading" ? "heading" : "paragraph";
    const run: RichNode = { type: "text", text: line, ...(marks ? { marks } : {}) };
    return {
      type,
      ...(base?.attrs ? { attrs: base.attrs } : {}),
      content: line ? [run] : [],
    };
  });
  return { type: "doc", content: content.length ? content : [{ type: "paragraph" }] };
}
