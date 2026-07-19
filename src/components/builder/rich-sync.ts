/**
 * rich-sync.ts — mirror TEXT CONTENT across the desktop/mobile variants while
 * each device keeps its OWN inline styling (marks: colour/gradient/bold/font)
 * and its OWN line breaks. Only the words flow across.
 *
 * Builder-only. Matches blocks across variants by id; syncs top-level text
 * fields (string or rich doc). Layout, style, images, links, colours, order and
 * visibility remain per-device.
 */
import { isRichDoc, type RichDoc, type RichNode } from "./rich-text";

// Field keys that are NOT text (kept per-device). Matched case-insensitively.
const NON_TEXT_KEY = /(url|href|image|img|src|video|icon|color|colour|bg|background|logo|media|poster|width|height|size|align)/i;

export function isTextFieldKey(key: string): boolean {
  return !NON_TEXT_KEY.test(key);
}

/** Flatten a rich doc to its word stream — marks + line breaks are ignored
 *  (those are per-device). Returns [] for empty/invalid. */
function richWords(doc: RichDoc | undefined): string[] {
  if (!isRichDoc(doc)) return [];
  let text = "";
  const walk = (n: RichNode) => {
    if (n.type === "text") text += n.text ?? "";
    else if (n.type === "hardBreak" || n.type === "paragraph") text += " ";
    (n.content ?? []).forEach(walk);
  };
  (doc.content ?? []).forEach(walk);
  return text.split(/\s+/).filter(Boolean);
}

/** Every text node in document order (references into the passed doc). */
function textNodes(doc: RichDoc): RichNode[] {
  const out: RichNode[] = [];
  const walk = (n: RichNode) => {
    if (n.type === "text") out.push(n);
    (n.content ?? []).forEach(walk);
  };
  (doc.content ?? []).forEach(walk);
  return out;
}

/**
 * Return a COPY of `target` whose words equal `source`'s words, but with target's
 * own marks and line-break skeleton preserved. Words are distributed across
 * target's text nodes in proportion to their original word counts, so when the
 * two docs share structure (the common case) the mapping is exact.
 */
export function syncRichContent(target: RichDoc | undefined, source: RichDoc): RichDoc {
  const words = richWords(source);

  // No usable target doc → carry the words as plain (unstyled) text.
  if (!isRichDoc(target)) {
    return {
      type: "doc",
      content: [{ type: "paragraph", content: words.length ? [{ type: "text", text: words.join(" ") }] : [] }],
    };
  }

  // Already the same content → leave target untouched (don't reshuffle marks).
  if (richWords(target).join(" ") === words.join(" ")) return target;

  const clone: RichDoc = JSON.parse(JSON.stringify(target));
  const nodes = textNodes(clone);

  // Target has a skeleton but no text nodes → drop words into the first paragraph.
  if (nodes.length === 0) {
    const firstPara = (clone.content ?? []).find((n) => n.type === "paragraph");
    if (firstPara) firstPara.content = words.length ? [{ type: "text", text: words.join(" ") }] : [];
    return clone;
  }

  // Distribute words across nodes proportional to their original word counts,
  // preserving each node's marks and the doc's break/paragraph skeleton.
  const origCounts = nodes.map((n) => (n.text ?? "").split(/\s+/).filter(Boolean).length);
  const totalOrig = origCounts.reduce((a, b) => a + b, 0) || nodes.length;
  let used = 0;
  nodes.forEach((n, i) => {
    const take =
      i === nodes.length - 1
        ? words.length - used // last node absorbs the remainder
        : Math.max(0, Math.min(Math.round(((origCounts[i] || 0) / totalOrig) * words.length), words.length - used));
    n.text = words.slice(used, used + take).join(" ");
    used += take;
  });
  return clone;
}

/** Reduce a field patch to the TEXT fields that should mirror to the other device. */
export function pickTextPatch(patch: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(patch)) {
    if (!isTextFieldKey(key)) continue;
    if (isRichDoc(val) || typeof val === "string") out[key] = val;
  }
  return out;
}
