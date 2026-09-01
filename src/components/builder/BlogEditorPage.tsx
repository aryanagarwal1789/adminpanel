import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { authJsonHeaders, authHeaders } from "@/lib/builder-drafts";
import { getAuth } from "@/lib/auth";
import { toast } from "sonner";
import type { BlogPost, ContentBlock, ContentBlockType } from "./BlogPanel";

const BACKEND = import.meta.env.VITE_BACKEND_URL ?? "https://salescode-marketplace.salescode.ai";
const UPLOAD_URL = `${BACKEND}/site/upload`;
const RENDERER =
  (import.meta.env.VITE_RENDERER_URL as string | undefined) ??
  "https://demo-experience.salescode.ai";

// ── Publish OTP (same gate as builder pages) ──
const OTP_EMAIL_DOMAIN = "salescode.ai";
function ssoEmail(): string | null {
  const a = getAuth();
  return a?.email && a.token && a.token !== "local-dev" ? a.email : null;
}
function isValidOtpEmail(email: string): boolean {
  return new RegExp(`^[^@\\s]+@${OTP_EMAIL_DOMAIN.replace(".", "\\.")}$`).test(
    email.trim().toLowerCase(),
  );
}

// ── Utilities (unchanged data-layer helpers) ──────────────────────
function uid() {
  return Math.random().toString(36).slice(2, 10);
}
function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
function calcReadTime(blocks: ContentBlock[]) {
  const words = blocks.reduce((n, b) => {
    if (b.text) n += b.text.split(/\s+/).filter(Boolean).length;
    if (b.items) n += b.items.join(" ").split(/\s+/).filter(Boolean).length;
    if (b.faqItems)
      n += b.faqItems
        .map((f) => `${f.q} ${f.a}`)
        .join(" ")
        .split(/\s+/)
        .filter(Boolean).length;
    return n;
  }, 0);
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
}
function countWords(blocks: ContentBlock[]): number {
  return blocks.reduce((n, b) => {
    const strip = (s: string) =>
      s
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/\+\+(.+?)\+\+/g, "$1")
        .replace(/\{#[0-9a-fA-F]{3,8}\|([^}]+)\}/g, "$1")
        .replace(/\[(.+?)\]\([^)]+\)/g, "$1")
        .replace(/==(.+?)==/g, "$1")
        .replace(/\*([^*]+?)\*/g, "$1");
    if (b.text) n += strip(b.text).split(/\s+/).filter(Boolean).length;
    if (b.items) n += b.items.join(" ").split(/\s+/).filter(Boolean).length;
    if (b.faqItems)
      n += b.faqItems
        .map((f) => `${f.q} ${f.a}`)
        .join(" ")
        .split(/\s+/)
        .filter(Boolean).length;
    return n;
  }, 0);
}

const EMPTY: Omit<BlogPost, "_id"> = {
  slug: "",
  title: "",
  category: "Blog",
  excerpt: "",
  body: "",
  content: [],
  author: "",
  authorRole: "",
  readTime: "",
  featuredImage: "",
  featuredImageCaption: "",
  tags: [],
  status: "draft",
};

// ── Markdown ↔ HTML bridge ─────────────────────────────────────────
// The live renderer (BlogPostPage) stores rich text as PLAIN-TEXT markup and
// parses it at render time. Support differs per block:
//   paragraph → **bold**, [link](url), ==teal==
//   heading2/3 → **text** (renders teal; no links)
//   quote / list items / captions → plain text (no markup)
// contentEditable produces HTML, so we bridge in both directions per mode.
type EditMode = "paragraph" | "heading" | "plain";
function blockMode(type: ContentBlockType): EditMode | null {
  if (type === "paragraph") return "paragraph";
  if (type === "heading2" || type === "heading3") return "heading";
  if (type === "quote") return "plain";
  return null;
}
function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeAttr(s: string) {
  return s.replace(/"/g, "&quot;");
}
// Normalise a CSS color (rgb()/named/hex) to #rrggbb for the {#hex|…} storage syntax.
function toHex(color: string): string {
  const c = color.trim();
  if (/^#[0-9a-fA-F]{3,8}$/.test(c)) return c.length === 4
    ? "#" + c.slice(1).split("").map((x) => x + x).join("")
    : c.slice(0, 7);
  const m = c.match(/rgba?\(([^)]+)\)/i);
  if (m) {
    const [r, g, b] = m[1].split(",").map((n) => Math.max(0, Math.min(255, parseInt(n, 10) || 0)));
    return "#" + [r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("");
  }
  return c;
}

// md → HTML for the contentEditable surface.
function mdToHtml(md: string, mode: EditMode): string {
  if (!md) return "";
  if (mode === "plain") return escapeHtml(md);
  if (mode === "heading") {
    // Only **text** → teal.
    let out = "",
      last = 0;
    const re = /\*\*(.+?)\*\*/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(md)) !== null) {
      if (m.index > last) out += escapeHtml(md.slice(last, m.index));
      out += `<span class="bs-teal">${escapeHtml(m[1])}</span>`;
      last = m.index + m[0].length;
    }
    if (last < md.length) out += escapeHtml(md.slice(last));
    return out;
  }
  // paragraph: **bold**, *italic*, ++underline++, {#hex|colored}, [link](url), ==teal==
  // {#hex|…} is matched with balanced braces so nested colour marks render as
  // nested spans instead of literal {#…|…} text.
  return paragraphMdToHtml(md);
}

// Non-colour inline marks → HTML.
function simpleMdToHtml(md: string): string {
  let out = "",
    last = 0;
  const re = /\*\*(.+?)\*\*|\+\+(.+?)\+\+|\[(.+?)\]\(([^)]+)\)|==(.+?)==|\*([^*]+?)\*/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md)) !== null) {
    if (m.index > last) out += escapeHtml(md.slice(last, m.index));
    if (m[1] !== undefined) out += `<b>${escapeHtml(m[1])}</b>`;
    else if (m[2] !== undefined) out += `<u>${escapeHtml(m[2])}</u>`;
    else if (m[3] !== undefined) out += `<a href="${escapeAttr(m[4])}">${escapeHtml(m[3])}</a>`;
    else if (m[5] !== undefined) out += `<span class="bs-teal">${escapeHtml(m[5])}</span>`;
    else if (m[6] !== undefined) out += `<i>${escapeHtml(m[6])}</i>`;
    last = m.index + m[0].length;
  }
  if (last < md.length) out += escapeHtml(md.slice(last));
  return out;
}

// {#hex|…} with balanced braces (nesting-safe); non-colour segments → simpleMdToHtml.
function paragraphMdToHtml(md: string): string {
  let out = "";
  let i = 0;
  let seg = "";
  const flush = () => { if (seg) { out += simpleMdToHtml(seg); seg = ""; } };
  while (i < md.length) {
    const open = /^\{(#[0-9a-fA-F]{3,8})\|/.exec(md.slice(i));
    if (open) {
      const contentStart = i + open[0].length;
      let depth = 1;
      let j = contentStart;
      while (j < md.length && depth > 0) {
        if (md[j] === "{") depth++;
        else if (md[j] === "}") { depth--; if (depth === 0) break; }
        j++;
      }
      if (depth === 0) {
        flush();
        out += `<span style="color:${escapeAttr(open[1])}">${paragraphMdToHtml(md.slice(contentStart, j))}</span>`;
        i = j + 1;
        continue;
      }
    }
    seg += md[i];
    i += 1;
  }
  flush();
  return out;
}

// HTML (from contentEditable) → md for storage.
function nodeToMd(node: Node, mode: EditMode): string {
  let s = "";
  node.childNodes.forEach((n) => {
    if (n.nodeType === Node.TEXT_NODE) {
      s += n.textContent ?? "";
      return;
    }
    if (n.nodeType !== Node.ELEMENT_NODE) return;
    const el = n as HTMLElement;
    const tag = el.tagName;
    const isTeal = el.classList?.contains("bs-teal");
    const inner = nodeToMd(el, mode);
    if (mode === "plain") {
      s += inner;
      return;
    }
    if (mode === "heading") {
      // Any emphasis (teal span or bold) → **text**
      if (isTeal || tag === "B" || tag === "STRONG") s += `**${inner}**`;
      else if (tag === "BR" || tag === "DIV") s += (s && !s.endsWith(" ") ? " " : "") + inner;
      else s += inner;
      return;
    }
    // paragraph
    const deco = el.style?.textDecorationLine || el.style?.textDecoration || "";
    const colorStyle = el.style?.color || "";
    if (isTeal) s += `==${inner}==`;
    else if (tag === "B" || tag === "STRONG") s += `**${inner}**`;
    else if (tag === "U" || deco.includes("underline")) s += `++${inner}++`;
    else if (tag === "I" || tag === "EM") s += `*${inner}*`;
    else if (colorStyle) s += `{${toHex(colorStyle)}|${inner}}`;
    else if (tag === "A")
      s += `[${inner}](${(el as HTMLAnchorElement).getAttribute("href") ?? ""})`;
    else if (tag === "BR") s += " ";
    else if (tag === "DIV") s += (s && !s.endsWith(" ") ? " " : "") + inner;
    else if (tag === "FONT") {
      // execCommand('foreColor') can emit <font color> — treat as a color span.
      const fc = (el as HTMLElement).getAttribute("color");
      s += fc ? `{${toHex(fc)}|${inner}}` : inner;
    }
    else s += inner;
  });
  return s;
}
function htmlToMd(el: HTMLElement, mode: EditMode): string {
  return nodeToMd(el, mode)
    .replace(/\u00A0/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

// ── Slash menu options (renderer-supported types only) ─────────────-
interface SlashOpt {
  t: ContentBlockType;
  ordered?: boolean;
  tt: string;
  ds: string;
  ic: string;
  grp: string;
}
const SLASH_OPTS: SlashOpt[] = [
  { t: "paragraph", tt: "Text", ds: "Plain paragraph", ic: "¶", grp: "Basic" },
  { t: "heading2", tt: "Section (H2)", ds: "Shows in the outline", ic: "H2", grp: "Basic" },
  { t: "heading3", tt: "Subsection (H3)", ds: "Nested in the outline", ic: "H3", grp: "Basic" },
  {
    t: "list",
    ordered: false,
    tt: "Bulleted list",
    ds: "A simple bullet list",
    ic: "•",
    grp: "Basic",
  },
  { t: "list", ordered: true, tt: "Numbered list", ds: "An ordered list", ic: "1.", grp: "Basic" },
  { t: "image", tt: "Image", ds: "Upload a file or paste a URL", ic: "🖼", grp: "Media & blocks" },
  { t: "image-grid", tt: "Image grid", ds: "A 2–4 column gallery", ic: "▦", grp: "Media & blocks" },
  { t: "quote", tt: "Quote", ds: "Pull-quote with accent bar", ic: "❝", grp: "Media & blocks" },
  { t: "faq", tt: "FAQ", ds: "Question & answer list", ic: "?", grp: "Media & blocks" },
  { t: "youtube", tt: "YouTube video", ds: "Embed a YouTube video by URL", ic: "▶", grp: "Media & blocks" },
  { t: "html", tt: "Custom HTML / Embed", ds: "Paste raw HTML or an embed snippet", ic: "</>", grp: "Media & blocks" },
  { t: "divider", tt: "Divider", ds: "Section break", ic: "—", grp: "Media & blocks" },
];
function newBlockOf(o: { t: ContentBlockType; ordered?: boolean }): ContentBlock {
  const nb: ContentBlock = { id: uid(), type: o.t };
  if (o.t === "list") {
    nb.items = [""];
    nb.ordered = !!o.ordered;
  }
  if (o.t === "faq") {
    nb.faqItems = [{ q: "", a: "" }];
    nb.text = "";
  }
  if (o.t === "image-grid") {
    nb.columns = 2;
    nb.images = [{ url: "", caption: "", alt: "" }];
  }
  if (o.t === "html") {
    nb.html = "";
  }
  if (o.t === "youtube") {
    nb.url = "";
  }
  return nb;
}
const TYPE_LABEL: Record<ContentBlockType, string> = {
  paragraph: "Text",
  heading2: "Section (H2)",
  heading3: "Subsection (H3)",
  image: "Image",
  "image-grid": "Image grid",
  quote: "Quote",
  list: "List",
  divider: "Divider",
  faq: "FAQ",
  html: "Custom HTML",
  youtube: "YouTube video",
};
const TURN_INTO: ContentBlockType[] = ["paragraph", "heading2", "heading3", "quote"];

// ── caret helpers ─────────────────────────────────────────────────
function focusEnd(el: HTMLElement) {
  el.focus();
  const r = document.createRange();
  r.selectNodeContents(el);
  r.collapse(false);
  const s = getSelection();
  s?.removeAllRanges();
  s?.addRange(r);
}
function focusStart(el: HTMLElement) {
  el.focus();
  const r = document.createRange();
  r.selectNodeContents(el);
  r.collapse(true);
  const s = getSelection();
  s?.removeAllRanges();
  s?.addRange(r);
}
function caretAtStart(el: HTMLElement) {
  const s = getSelection();
  if (!s?.rangeCount) return false;
  const r = s.getRangeAt(0).cloneRange();
  r.selectNodeContents(el);
  r.setEnd(s.getRangeAt(0).startContainer, s.getRangeAt(0).startOffset);
  return r.toString().length === 0;
}
function caretAtEnd(el: HTMLElement) {
  const s = getSelection();
  if (!s?.rangeCount) return false;
  const r = s.getRangeAt(0).cloneRange();
  r.selectNodeContents(el);
  r.setStart(s.getRangeAt(0).endContainer, s.getRangeAt(0).endOffset);
  return r.toString().length === 0;
}

// ── Scoped studio CSS (all classes bs-prefixed, scoped under .bstudio) ──
const CSS = `
.bstudio{--bg:#0A0D14;--surface:#121722;--surface-2:#1A2130;--surface-3:#212A3B;--ink:#E9ECF4;--ink-2:#B7C0D3;--muted:#8790A6;--faint:#5E6880;--hair:#242C3B;--blue:#5B8BFF;--teal:#2FD8C4;--grad:linear-gradient(135deg,#5B8BFF 0%,#2FD8C4 100%);--blue-soft:rgba(91,139,255,.15);--blue-line:rgba(91,139,255,.32);--teal-soft:rgba(47,216,196,.14);--danger:#F77;--ph:#454F66;--sh-md:0 8px 30px rgba(0,0,0,.5),0 2px 8px rgba(0,0,0,.4);--sh-lg:0 24px 70px rgba(0,0,0,.6),0 8px 20px rgba(0,0,0,.5);position:fixed;inset:0;display:flex;flex-direction:column;background:var(--bg);color:var(--ink);font-family:'Poppins',system-ui,-apple-system,Segoe UI,Roboto,sans-serif;-webkit-font-smoothing:antialiased;overflow:hidden;z-index:0}
.bstudio *{box-sizing:border-box}
.bstudio button{font-family:inherit;cursor:pointer;border:none;background:none;color:inherit}
.bstudio input,.bstudio textarea{font-family:inherit}
.bstudio .bs-teal{color:var(--teal)}

.bstudio .bs-top{height:56px;flex:0 0 56px;display:flex;align-items:center;gap:12px;padding:0 14px;background:var(--surface);border-bottom:1px solid var(--hair);z-index:40}
.bstudio .bs-brand{display:flex;align-items:center;gap:9px;font-weight:600;font-size:14px}
.bstudio .bs-logo{width:26px;height:26px;border-radius:7px;background:var(--grad);display:grid;place-items:center;color:#06121a;font-size:13px;font-weight:700}
.bstudio .bs-brand small{display:block;font-weight:400;font-size:10.5px;color:var(--faint);margin-top:-2px}
.bstudio .bs-vr{width:1px;height:24px;background:var(--hair)}
.bstudio .bs-mini{font-weight:500;font-size:13px;color:var(--ink-2);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bstudio .bs-pill{display:flex;align-items:center;gap:7px;font-size:11.5px;color:var(--muted);padding:4px 10px;border-radius:20px;background:var(--surface-2)}
.bstudio .bs-dot{width:7px;height:7px;border-radius:50%;background:#34D399;box-shadow:0 0 8px rgba(52,211,153,.6)}
.bstudio .bs-pill.bs-dirty .bs-dot{background:#FBBF24;box-shadow:0 0 8px rgba(251,191,36,.6)}
.bstudio .bs-spacer{flex:1}
.bstudio .bs-stats{font-size:11.5px;color:var(--muted);display:flex;gap:12px}
.bstudio .bs-stats b{color:var(--ink-2);font-weight:600}
.bstudio .bs-tbtn{display:inline-flex;align-items:center;gap:6px;height:34px;padding:0 12px;border-radius:9px;font-size:12.5px;font-weight:500;color:var(--ink-2);border:1px solid transparent;transition:.15s;white-space:nowrap}
.bstudio .bs-tbtn:hover{background:var(--surface-2)}
.bstudio .bs-tbtn.bs-active{background:var(--blue-soft);color:var(--blue)}
.bstudio .bs-tbtn.bs-ghost{border-color:var(--hair);background:var(--surface-2)}
.bstudio .bs-tbtn.bs-ghost:hover{background:var(--surface-3)}
.bstudio .bs-tbtn.bs-primary{background:var(--grad);color:#06121a;font-weight:600}
.bstudio .bs-tbtn.bs-primary:hover{filter:brightness(1.08)}
.bstudio .bs-tbtn:disabled{opacity:.5;cursor:default}
.bstudio .bs-tbtn.bs-icon{padding:0;width:34px;justify-content:center}
.bstudio .bs-tbtn svg{width:15px;height:15px}

.bstudio .bs-body{flex:1;display:flex;min-height:0}

/* LEFT RAIL */
.bstudio .bs-left{width:264px;flex:0 0 264px;background:var(--surface);border-right:1px solid var(--hair);display:flex;flex-direction:column;transition:margin .2s ease}
.bstudio .bs-left.bs-collapsed{margin-left:-264px}
.bstudio .bs-seg{display:flex;gap:3px;margin:12px 14px 6px;background:var(--surface-2);border:1px solid var(--hair);border-radius:9px;padding:3px}
.bstudio .bs-seg button{flex:1;height:28px;border-radius:6px;font-size:12px;font-weight:600;color:var(--muted)}
.bstudio .bs-seg button.on{background:var(--surface-3);color:var(--blue)}
.bstudio .bs-lp{padding:2px 12px 10px}
.bstudio .bs-newbtn{width:100%;display:flex;align-items:center;justify-content:center;gap:7px;height:36px;border-radius:9px;background:var(--grad);color:#06121a;font-weight:600;font-size:13px;margin-bottom:8px}
.bstudio .bs-newbtn svg{width:16px;height:16px;flex:none}
.bstudio .bs-search{position:relative;margin-bottom:6px}
.bstudio .bs-search input{width:100%;height:34px;padding:0 12px;border-radius:8px;background:var(--surface-2);border:1px solid var(--hair);color:var(--ink);font-size:12.5px;outline:none}
.bstudio .bs-search input:focus{border-color:var(--blue-line)}
.bstudio .bs-plist{flex:1;overflow-y:auto;overflow-x:hidden;padding:0 12px 16px}
.bstudio .bs-pitem{width:100%;text-align:left;display:flex;gap:9px;padding:8px;border-radius:10px;margin:2px 0;border:1px solid transparent;transition:.12s}
.bstudio .bs-pitem:hover{background:var(--surface-2)}
.bstudio .bs-pitem.on{background:var(--blue-soft);border-color:var(--blue-line)}
.bstudio .bs-pthumb{width:42px;height:42px;flex:0 0 42px;border-radius:7px;overflow:hidden;background:var(--surface-3);display:grid;place-items:center;color:var(--faint)}
.bstudio .bs-pthumb img{width:100%;height:100%;object-fit:cover;display:block}
.bstudio .bs-pmeta{flex:1;min-width:0}
.bstudio .bs-ptitle{display:block;font-size:13px;font-weight:500;color:var(--ink);line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bstudio .bs-pitem.on .bs-ptitle{color:var(--teal)}
.bstudio .bs-badge{display:inline-block;font-size:9.5px;font-weight:700;padding:2px 7px;border-radius:20px;margin-top:3px}
.bstudio .bs-badge.live{background:rgba(52,211,153,.16);color:#34D399}
.bstudio .bs-badge.draft{background:rgba(135,144,166,.18);color:var(--muted)}
.bstudio .bs-pexcerpt{display:block;font-size:11px;color:var(--faint);margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bstudio .bs-empty{padding:14px 12px;color:var(--faint);font-size:12px;line-height:1.55}
.bstudio .bs-empty b{color:var(--ink-2);font-weight:600}
.bstudio .bs-lfoot{border-top:1px solid var(--hair);padding:10px 16px;font-size:11px;color:var(--faint)}

/* OUTLINE */
.bstudio .bs-outline{flex:1;overflow-y:auto;padding:6px 12px 24px}
.bstudio .bs-toc{width:100%;text-align:left;display:block;padding:7px 10px;border-radius:8px;font-size:12.5px;color:var(--ink-2);margin:1px 0}
.bstudio .bs-toc.l3{padding-left:24px;font-size:12px;color:var(--muted)}
.bstudio .bs-toc:hover{background:var(--surface-2)}

/* CENTER */
.bstudio .bs-canvas{flex:1;overflow-y:auto;background:var(--bg);scroll-behavior:smooth}
.bstudio .bs-doc{max-width:760px;margin:0 auto;padding:48px 24px 40vh}
.bstudio .bs-kicker{font-size:12px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--teal);margin-bottom:12px;outline:none}
.bstudio .bs-title{font-weight:600;font-size:40px;line-height:1.12;letter-spacing:-.02em;color:var(--ink);outline:none;margin:0 0 8px}
.bstudio .bs-sub{font-size:19px;line-height:1.5;color:var(--muted);outline:none;margin:6px 0 12px;font-weight:300}
.bstudio [data-ph]:empty::before{content:attr(data-ph);color:var(--ph);pointer-events:none}
.bstudio .bs-byline{display:flex;align-items:center;gap:11px;padding:14px 0;border-top:1px solid var(--hair);border-bottom:1px solid var(--hair);color:var(--muted);font-size:13px}
.bstudio .bs-av{width:32px;height:32px;border-radius:50%;background:var(--grad);color:#06121a;display:grid;place-items:center;font-size:13px;font-weight:600}
.bstudio .bs-byline b{color:var(--ink-2);font-weight:600}

.bstudio .bs-cover{position:relative;border-radius:14px;overflow:hidden;margin:22px 0 6px;background:var(--surface);border:1px dashed var(--hair)}
.bstudio .bs-cover.has{border:none}
.bstudio .bs-cover img{width:100%;display:block;max-height:400px;object-fit:cover}
.bstudio .bs-cover-ph{aspect-ratio:16/6;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:var(--muted);cursor:pointer;font-size:13px}
.bstudio .bs-cover-ph:hover{background:var(--surface-2);color:var(--ink-2)}
.bstudio .bs-cover-ph small{font-size:11px;color:var(--faint)}
.bstudio .bs-cover-tools{position:absolute;top:12px;right:12px;display:flex;gap:8px}
.bstudio .bs-cover-tools button{background:rgba(10,13,20,.7);color:#fff;height:30px;padding:0 12px;border-radius:8px;font-size:12px;display:flex;align-items:center;gap:6px;backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,.12)}

/* BLOCKS */
.bstudio .bs-blocks{margin-top:14px}
.bstudio .bs-row{position:relative;display:flex;align-items:flex-start;margin:2px 0}
.bstudio .bs-gutter{position:absolute;left:-62px;top:0;height:34px;display:flex;align-items:center;gap:2px;opacity:0;transition:opacity .12s;padding-right:8px}
.bstudio .bs-row:hover .bs-gutter,.bstudio .bs-row.menu .bs-gutter{opacity:1}
.bstudio .bs-gbtn{width:26px;height:26px;border-radius:7px;color:var(--faint);display:grid;place-items:center}
.bstudio .bs-gbtn:hover{background:var(--surface-2);color:var(--ink-2)}
.bstudio .bs-gbtn svg{width:16px;height:16px}
.bstudio .bs-gbtn.drag{cursor:grab}
.bstudio .bs-bc{flex:1;min-width:0;outline:none;color:var(--ink)}
.bstudio .bs-bc a{color:var(--blue);text-decoration:underline;text-underline-offset:2px}
.bstudio .bs-p{font-size:17px;line-height:1.75;padding:5px 0;color:var(--ink-2)}
.bstudio .bs-h2{font-size:27px;font-weight:600;line-height:1.25;letter-spacing:-.015em;padding:18px 0 4px;color:var(--ink)}
.bstudio .bs-h3{font-size:20px;font-weight:600;line-height:1.3;padding:12px 0 2px;color:var(--ink)}
.bstudio .bs-quote{font-size:20px;line-height:1.5;font-style:italic;font-weight:300;color:var(--ink);padding:6px 0 6px 20px;border-left:3px solid var(--teal)}
.bstudio .bs-attrib{font-size:13px;color:var(--muted);margin-top:6px;padding-left:20px;outline:none;font-style:normal}
.bstudio .bs-attrib:empty::before{content:'— Attribution (optional)';color:var(--ph)}
.bstudio .bs-li{display:flex;align-items:flex-start;gap:10px;font-size:17px;line-height:1.7;color:var(--ink-2);padding:2px 0}
.bstudio .bs-li-mark{color:var(--teal);font-weight:600;min-width:20px;user-select:none}
.bstudio .bs-li-text{flex:1;outline:none}
.bstudio .bs-list-tools{display:flex;gap:10px;margin:6px 0 2px;font-size:11.5px;color:var(--muted)}
.bstudio .bs-list-tools button{color:var(--muted)}
.bstudio .bs-list-tools button.on{color:var(--teal)}
.bstudio .bs-divider{display:flex;gap:9px;justify-content:center;margin:24px 0}
.bstudio .bs-divider span{width:5px;height:5px;border-radius:50%;background:var(--hair)}

/* image + grid + faq shared */
.bstudio .bs-frame{border-radius:12px;overflow:hidden;background:var(--surface);border:1px solid var(--hair);position:relative;margin:8px 0}
.bstudio .bs-frame img{width:100%;display:block}
.bstudio .bs-uz{aspect-ratio:16/7;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:var(--muted);padding:20px}
.bstudio .bs-uprow{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:center}
.bstudio .bs-upbtn{background:var(--surface-3);color:var(--ink);height:34px;padding:0 15px;border-radius:9px;font-size:12.5px;font-weight:500;display:flex;align-items:center;gap:6px;border:1px solid var(--hair)}
.bstudio .bs-upbtn:hover{border-color:var(--blue-line);color:var(--blue)}
.bstudio .bs-upbtn:disabled{opacity:.5}
.bstudio .bs-urlin{background:var(--surface);border:1px solid var(--hair);color:var(--ink);height:34px;padding:0 12px;border-radius:9px;font-size:12.5px;width:220px;outline:none}
.bstudio .bs-imgtools{position:absolute;top:10px;right:10px;display:flex;gap:7px;opacity:0;transition:.15s}
.bstudio .bs-frame:hover .bs-imgtools{opacity:1}
.bstudio .bs-imgtools button{background:rgba(10,13,20,.72);color:#fff;height:28px;padding:0 10px;border-radius:8px;font-size:11.5px;display:flex;align-items:center;gap:5px;backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,.12)}
.bstudio .bs-cap{width:100%;text-align:center;font-size:13px;color:var(--muted);padding:8px 6px 0;outline:none;font-style:italic;background:transparent;border:none}
.bstudio .bs-fieldin{width:100%;background:var(--surface-2);border:1px solid var(--hair);color:var(--ink);border-radius:8px;padding:8px 11px;font-size:13px;outline:none}
.bstudio .bs-fieldin:focus{border-color:var(--blue-line)}
.bstudio .bs-gal-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
.bstudio .bs-gal-lbl{font-size:11px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;color:var(--faint)}
.bstudio .bs-cols{display:flex;gap:4px;background:var(--surface-2);border:1px solid var(--hair);border-radius:8px;padding:3px}
.bstudio .bs-cols button{width:30px;height:26px;border-radius:6px;font-size:12px;font-weight:600;color:var(--muted)}
.bstudio .bs-cols button.on{background:var(--surface-3);color:var(--blue)}
.bstudio .bs-galcell{border-radius:10px;overflow:hidden;background:var(--surface);border:1px solid var(--hair);padding:10px;margin:8px 0;display:flex;flex-direction:column;gap:8px}
.bstudio .bs-galcell .bs-fieldin{background:var(--surface)}
.bstudio .bs-addlink{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--muted);margin-top:6px}
.bstudio .bs-addlink:hover{color:var(--teal)}
.bstudio .bs-faqcard{border-radius:10px;background:var(--surface);border:1px solid var(--hair);padding:10px;margin:8px 0;display:flex;flex-direction:column;gap:8px}
.bstudio .bs-del{color:var(--faint);width:24px;height:24px;border-radius:6px;display:grid;place-items:center}
.bstudio .bs-del:hover{color:var(--danger);background:rgba(255,119,119,.1)}
.bstudio .bs-rowbetween{display:flex;align-items:center;justify-content:space-between}

/* RIGHT RAIL */
.bstudio .bs-right{width:320px;flex:0 0 320px;background:var(--surface);border-left:1px solid var(--hair);display:flex;flex-direction:column;transition:margin .2s ease}
.bstudio .bs-right.bs-collapsed{margin-right:-320px}
.bstudio .bs-rhead{padding:15px 18px;border-bottom:1px solid var(--hair);display:flex;align-items:center;justify-content:space-between}
.bstudio .bs-rhead h3{margin:0;font-size:14px;font-weight:600}
.bstudio .bs-rbody{overflow-y:auto;padding:8px 18px 40px}
.bstudio .bs-field{margin:15px 0}
.bstudio .bs-field label{display:block;font-size:12px;font-weight:600;color:var(--ink-2);margin-bottom:6px}
.bstudio .bs-field .bs-hint{font-size:11px;color:var(--faint);font-weight:400;margin-left:6px}
.bstudio .bs-field input,.bstudio .bs-field textarea{width:100%;font-size:13px;color:var(--ink);background:var(--surface-2);border:1px solid var(--hair);border-radius:9px;padding:9px 11px;outline:none}
.bstudio .bs-field input:focus,.bstudio .bs-field textarea:focus{border-color:var(--blue);box-shadow:0 0 0 3px var(--blue-soft)}
.bstudio .bs-field textarea{resize:vertical;min-height:70px;line-height:1.5}
.bstudio .bs-counter{text-align:right;font-size:11px;color:var(--faint);margin-top:4px}
.bstudio .bs-counter.warn{color:#FBBF24}.bstudio .bs-counter.bad{color:var(--danger)}
.bstudio .bs-permalink{font-family:ui-monospace,monospace;font-size:11px;background:var(--surface-2);border:1px solid var(--hair);border-radius:8px;padding:7px 10px;color:var(--muted);word-break:break-all;margin-top:8px}
.bstudio .bs-permalink b{color:var(--teal);font-weight:500}
.bstudio .bs-seo{display:flex;align-items:center;gap:12px;background:var(--surface-2);border:1px solid var(--hair);border-radius:12px;padding:12px;margin:6px 0}
.bstudio .bs-seo .lbl{font-size:12px;color:var(--muted);line-height:1.4}
.bstudio .bs-seo .lbl b{display:block;color:var(--ink);font-size:14px;font-weight:600}
.bstudio .bs-checks{font-size:12px}
.bstudio .bs-checks .r{display:flex;gap:8px;padding:5px 0;color:var(--muted);align-items:flex-start}
.bstudio .bs-checks .r.ok{color:var(--ink-2)}
.bstudio .bs-checks .ic{width:15px;flex:0 0 15px;margin-top:1px;color:var(--faint)}
.bstudio .bs-checks .r.ok .ic{color:var(--teal)}
.bstudio .bs-checks .r small{font-size:11px;color:var(--faint)}

/* ── top-level Editor / SEO tabs ── */
.bstudio .bs-toptabs{display:flex;gap:3px;background:var(--surface-2);border:1px solid var(--hair);border-radius:9px;padding:3px}
.bstudio .bs-toptabs button{display:flex;align-items:center;gap:6px;height:28px;padding:0 12px;border-radius:6px;font-size:12.5px;font-weight:600;color:var(--muted)}
.bstudio .bs-toptabs button.on{background:var(--surface-3);color:var(--teal)}
.bstudio .bs-toptabs .bs-seobadge{font-size:10.5px;font-weight:700;padding:1px 6px;border-radius:20px;background:var(--surface);color:var(--muted)}
.bstudio .bs-toptabs button.on .bs-seobadge{color:var(--teal);background:rgba(47,216,196,.14)}

/* ── SEO tab (full-width) ── */
.bstudio .bs-seoview{flex:1;overflow-y:auto;padding:32px clamp(20px,4vw,64px) 80px}
.bstudio .bs-seoid{display:flex;align-items:center;gap:14px;max-width:1180px;margin:0 auto 20px}
.bstudio .bs-seoid img,.bstudio .bs-seoid .ph{width:52px;height:52px;flex:0 0 52px;border-radius:10px;object-fit:cover;background:var(--surface-2);border:1px solid var(--hair);display:grid;place-items:center;color:var(--faint)}
.bstudio .bs-seoid .t{min-width:0}
.bstudio .bs-seoid .t b{display:block;font-size:16px;font-weight:600;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bstudio .bs-seoid .t span{font-size:12px;color:var(--faint)}
.bstudio .bs-seogrid{max-width:1180px;margin:0 auto;display:grid;grid-template-columns:400px 1fr;gap:32px;align-items:start}
.bstudio .bs-field textarea.bs-jsonld{width:100%;font-family:ui-monospace,monospace;font-size:12px;color:var(--ink);background:var(--surface-2);border:1px solid var(--hair);border-radius:9px;padding:10px 12px;outline:none;resize:vertical;min-height:560px;line-height:1.5}
.bstudio .bs-jsonld:focus{border-color:var(--blue);box-shadow:0 0 0 3px var(--blue-soft)}
.bstudio .bs-jsonld.err{border-color:var(--danger)}
.bstudio .bs-jsonld-err{font-size:11.5px;color:var(--danger);margin-top:6px}
.bstudio .bs-seocard{background:var(--surface);border:1px solid var(--hair);border-radius:14px;padding:20px 22px;margin-bottom:20px}
.bstudio .bs-seocard h4{margin:0 0 4px;font-size:14px;font-weight:600;color:var(--ink)}
.bstudio .bs-seocard .sub{font-size:12px;color:var(--faint);margin:0 0 16px}
.bstudio .bs-scoreblock{display:flex;align-items:center;gap:16px;background:var(--surface-2);border:1px solid var(--hair);border-radius:14px;padding:18px;margin-bottom:20px}
.bstudio .bs-scoreblock .lbl{font-size:12.5px;color:var(--muted)}
.bstudio .bs-scoreblock .lbl b{display:block;color:var(--ink);font-size:16px;font-weight:600;margin-bottom:2px}
.bstudio .bs-scoreblock .lbl small{display:block;font-size:11px;color:var(--faint);margin-top:2px}
.bstudio .bs-checkgrp{margin-bottom:6px}
.bstudio .bs-checkgrp h5{font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--faint);margin:0 0 8px}
.bstudio .bs-checkrow{display:flex;gap:9px;align-items:flex-start;padding:6px 0;font-size:12.5px;color:var(--ink-2)}
.bstudio .bs-checkrow .dot{width:8px;height:8px;border-radius:50%;margin-top:5px;flex:0 0 8px}
.bstudio .bs-checkrow.good .dot{background:var(--teal)}
.bstudio .bs-checkrow.ok .dot{background:#FBBF24}
.bstudio .bs-checkrow.bad .dot{background:var(--danger)}
.bstudio .bs-checkrow small{display:block;font-size:11px;color:var(--faint);margin-top:1px}
.bstudio .bs-lenbar{height:3px;border-radius:3px;background:var(--hair);margin-top:6px;overflow:hidden}
.bstudio .bs-lenbar i{display:block;height:100%;border-radius:3px;transition:width .15s}
@media(max-width:1020px){.bstudio .bs-seogrid{grid-template-columns:1fr}}

/* floating widgets */
.bstudio .bs-fmt{position:fixed;z-index:80;display:none;align-items:center;gap:2px;background:var(--surface-3);border:1px solid var(--hair);border-radius:11px;padding:5px;box-shadow:var(--sh-lg);transform:translate(-50%,-100%)}
.bstudio .bs-fmt.show{display:flex}
.bstudio .bs-fmt button{width:32px;height:32px;border-radius:8px;color:var(--ink-2);display:grid;place-items:center;font-size:14px}
.bstudio .bs-fmt button:hover{background:var(--surface-2);color:var(--ink)}
.bstudio .bs-fmt .sep{width:1px;height:18px;background:var(--hair);margin:0 3px}
.bstudio .bs-fmt input{background:var(--surface);border:1px solid var(--hair);color:var(--ink);font-size:12.5px;padding:6px 9px;border-radius:8px;width:200px;outline:none}
.bstudio .bs-fmt .go{background:var(--grad);color:#06121a;font-weight:600;font-size:12px;height:30px;width:auto;padding:0 12px;border-radius:8px}

.bstudio .bs-slash,.bstudio .bs-ctx{position:fixed;z-index:85;background:var(--surface-2);border:1px solid var(--hair);border-radius:12px;box-shadow:var(--sh-lg);padding:6px;display:none}
.bstudio .bs-slash{width:300px;max-height:340px;overflow-y:auto}
.bstudio .bs-ctx{width:210px}
.bstudio .bs-slash.show,.bstudio .bs-ctx.show{display:block}
.bstudio .bs-slash .grp{font-size:10px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;color:var(--faint);padding:8px 10px 4px}
.bstudio .bs-opt{display:flex;align-items:center;gap:11px;padding:8px 10px;border-radius:9px;width:100%;text-align:left}
.bstudio .bs-opt.sel,.bstudio .bs-opt:hover{background:var(--blue-soft)}
.bstudio .bs-opt .oic{width:34px;height:34px;flex:0 0 34px;border-radius:9px;background:var(--surface);border:1px solid var(--hair);display:grid;place-items:center;color:var(--ink-2);font-size:14px}
.bstudio .bs-opt .tt{font-size:13px;font-weight:500;color:var(--ink)}
.bstudio .bs-opt .ds{font-size:11px;color:var(--muted)}
.bstudio .bs-ctx button{display:flex;width:100%;align-items:center;gap:9px;padding:8px 10px;border-radius:8px;font-size:12.5px;color:var(--ink-2);text-align:left}
.bstudio .bs-ctx button:hover{background:var(--surface-3)}
.bstudio .bs-ctx button.danger{color:var(--danger)}
.bstudio .bs-ctx .sep{height:1px;background:var(--hair);margin:5px 2px}
.bstudio .bs-drop{position:fixed;height:3px;background:var(--blue);border-radius:3px;z-index:70;display:none;box-shadow:0 0 10px var(--blue)}

/* preview overlay */
.bstudio .bs-preview{position:fixed;inset:0;z-index:100;background:var(--bg);display:none;flex-direction:column}
.bstudio .bs-preview.show{display:flex}
.bstudio .bs-pvbar{height:56px;flex:0 0 56px;display:flex;align-items:center;gap:14px;padding:0 20px;border-bottom:1px solid var(--hair);background:var(--surface)}
.bstudio .bs-pvscroll{flex:1;overflow-y:auto}
.bstudio .bs-article{max-width:720px;margin:0 auto;padding:48px 24px 30vh}
.bstudio .bs-article .k{font-size:12px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--teal);margin-bottom:14px}
.bstudio .bs-article h1{font-weight:600;font-size:42px;line-height:1.12;margin:0 0 14px;color:var(--ink)}
.bstudio .bs-article .s{font-size:20px;font-weight:300;color:var(--muted);margin:0 0 20px}
.bstudio .bs-article img{max-width:100%;border-radius:12px;display:block;margin:24px 0}
.bstudio .bs-article p{font-size:18px;line-height:1.8;color:var(--ink-2);margin:18px 0}
.bstudio .bs-article h2{font-size:28px;font-weight:600;margin:40px 0 12px;color:var(--ink)}
.bstudio .bs-article h3{font-size:21px;font-weight:600;margin:28px 0 8px;color:var(--ink)}
.bstudio .bs-article blockquote{font-size:21px;font-style:italic;font-weight:300;color:var(--ink);border-left:3px solid var(--teal);padding:6px 0 6px 22px;margin:22px 0}
.bstudio .bs-article ul,.bstudio .bs-article ol{font-size:18px;line-height:1.8;padding-left:26px;margin:16px 0;color:var(--ink-2)}
.bstudio .bs-article a{color:var(--blue);text-decoration:underline}
.bstudio .bs-article hr{border:none;border-top:1px solid var(--hair);margin:32px 0}
.bstudio .bs-article figcaption{text-align:center;font-style:italic;font-size:13px;color:var(--muted);margin-top:-14px}
.bstudio .bs-pvgrid{display:grid;gap:10px;margin:22px 0}
.bstudio .bs-pvgrid img{margin:0;aspect-ratio:1/1;object-fit:cover}

/* modal */
.bstudio .bs-scrim{position:fixed;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(3px);z-index:130;display:flex;align-items:center;justify-content:center;padding:24px}
.bstudio .bs-modal{background:var(--surface);border:1px solid var(--hair);border-radius:16px;box-shadow:var(--sh-lg);width:min(560px,100%);max-height:86vh;display:flex;flex-direction:column;overflow:hidden}
.bstudio .bs-mhead{padding:18px 22px 14px;border-bottom:1px solid var(--hair);display:flex;align-items:center;justify-content:space-between}
.bstudio .bs-mhead h3{margin:0;font-size:16px}
.bstudio .bs-mbody{padding:18px 22px;overflow-y:auto}
.bstudio .bs-mfoot{padding:14px 22px;border-top:1px solid var(--hair);display:flex;justify-content:flex-end;gap:10px}
.bstudio .bs-btn{display:inline-flex;align-items:center;gap:7px;padding:9px 16px;border-radius:9px;font-size:13.5px;font-weight:600}
.bstudio .bs-btn.ghost{border:1px solid var(--hair);color:var(--ink-2);background:var(--surface-2)}
.bstudio .bs-btn.primary{background:var(--grad);color:#06121a}
.bstudio .bs-btn:disabled{opacity:.45;cursor:default}
.bstudio .bs-otp-in{width:100%;border:1px solid var(--hair);background:var(--surface-2);border-radius:8px;padding:9px 11px;font-size:13px;color:var(--ink);outline:none}
.bstudio .bs-otp-code{text-align:center;font-size:18px;letter-spacing:.5em}
.bstudio .bs-err{font-size:12px;color:var(--danger)}
.bstudio .bs-etabs{display:flex;gap:6px;margin-bottom:12px}
.bstudio .bs-etabs button{padding:6px 13px;border-radius:8px;font-size:12.5px;font-weight:500;color:var(--muted);background:var(--surface-2)}
.bstudio .bs-etabs button.on{background:var(--blue);color:#06121a}
.bstudio .bs-code-out{font-family:ui-monospace,monospace;font-size:12px;line-height:1.5;background:#070A10;color:#DDE3F0;border:1px solid var(--hair);border-radius:10px;padding:14px;width:100%;height:300px;resize:none;white-space:pre;overflow:auto;outline:none}

.bstudio ::-webkit-scrollbar{width:10px;height:10px}
.bstudio ::-webkit-scrollbar-thumb{background:#2A3244;border:3px solid transparent;background-clip:content-box;border-radius:20px}
`;

// ── Image upload button ────────────────────────────────────────────
function useUpload() {
  return useCallback(async (file: File): Promise<string | null> => {
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch(UPLOAD_URL, { method: "POST", headers: authHeaders(), body: fd });
      if (!r.ok) throw new Error();
      const d = (await r.json()) as { url?: string };
      return d.url ?? null;
    } catch {
      toast.error("Upload failed");
      return null;
    }
  }, []);
}
function pickFile(multiple: boolean, cb: (files: File[]) => void) {
  const inp = document.createElement("input");
  inp.type = "file";
  inp.accept = "image/*";
  if (multiple) inp.multiple = true;
  inp.onchange = () => {
    const f = inp.files ? [...inp.files] : [];
    if (f.length) cb(f);
  };
  inp.click();
}

// ── SVG icon helpers (inline, matching the pasted look) ────────────
const Ic = {
  outline: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  eye: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  send: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  ),
  download: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  drag: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <circle cx="9" cy="6" r="1.6" />
      <circle cx="15" cy="6" r="1.6" />
      <circle cx="9" cy="12" r="1.6" />
      <circle cx="15" cy="12" r="1.6" />
      <circle cx="9" cy="18" r="1.6" />
      <circle cx="15" cy="18" r="1.6" />
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  circle: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
    </svg>
  ),
  ext: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
    </svg>
  ),
};

interface SeoCheck {
  ok: boolean;
  t: string;
  d: string;
}

type SeoStatus = "good" | "ok" | "bad";
interface SeoStatusCheck {
  status: SeoStatus;
  title: string;
  detail: string;
}

// ═══════════════════════════════════════════════════════════════════
export function BlogEditorPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<BlogPost | null>(null);
  const [form, setForm] = useState<Omit<BlogPost, "_id">>({ ...EMPTY });
  const [tagInput, setTagInput] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [dirty, setDirty] = useState(false);
  const [leftTab, setLeftTab] = useState<"posts" | "outline">("posts");
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [activeView, setActiveView] = useState<"editor" | "seo">("editor");

  const isNew = !selected;
  const upload = useUpload();

  // docKey remounts contentEditable surfaces only when switching posts, never mid-edit.
  const docKey = selected?._id ?? selected?.slug ?? "new";

  // Sync editable state SYNCHRONOUSLY when the selected post changes (React's
  // "adjust state while rendering" pattern). Doing this in a useEffect instead
  // ran one render late: docKey (from `selected`) changed and remounted the
  // uncontrolled contentEditable surfaces BEFORE `form` updated, so the editor
  // showed the previously-open post's content. Setting form here keeps the
  // re-mounted surfaces initialised from the correct post.
  const prevDocKey = useRef(docKey);
  if (prevDocKey.current !== docKey) {
    prevDocKey.current = docKey;
    if (selected) {
      setForm({ ...EMPTY, ...selected, content: selected.content ?? [] });
      setTagInput((selected.tags ?? []).join(", "));
      setSlugManual(true);
    } else {
      setForm({ ...EMPTY });
      setTagInput("");
      setSlugManual(false);
    }
    setDirty(false);
  }

  const uploadImg = async (file: File): Promise<string | null> => upload(file);

  // Fetch posts
  useEffect(() => {
    setLoading(true);
    fetch(`${BACKEND}/site/builder/blog/posts`)
      .then((r) => r.json())
      .then((d: { posts?: BlogPost[] }) => setPosts(d.posts ?? []))
      .catch(() => toast.error("Failed to load posts"))
      .finally(() => setLoading(false));
  }, []);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setDirty(true);
  };
  // Nested setter for the per-post SEO overrides.
  const setSeo = (k: string, v: unknown) => {
    setForm((f) => ({ ...f, seo: { ...(f.seo ?? {}), [k]: v } }));
    setDirty(true);
  };
  const handleTitleChange = (v: string) => {
    setForm((f) => ({ ...f, title: v, ...(slugManual ? {} : { slug: slugify(v) }) }));
    setDirty(true);
  };

  // ── Content blocks ──────────────────────────────────────────────
  const blocks: ContentBlock[] = useMemo(() => form.content ?? [], [form.content]);
  const setBlocks = useCallback((next: ContentBlock[]) => {
    setForm((f) => ({ ...f, content: next, readTime: calcReadTime(next) }));
    setDirty(true);
  }, []);
  const updateBlock = useCallback((id: string, patch: Partial<ContentBlock>) => {
    setForm((f) => {
      const next = (f.content ?? []).map((b) => (b.id === id ? { ...b, ...patch } : b));
      return { ...f, content: next, readTime: calcReadTime(next) };
    });
    setDirty(true);
  }, []);

  const insertAfter = (id: string | null, nb: ContentBlock) => {
    const cur = form.content ?? [];
    const idx = id ? cur.findIndex((b) => b.id === id) : cur.length - 1;
    const next = [...cur];
    next.splice(idx + 1, 0, nb);
    setBlocks(next);
    return nb;
  };
  const removeBlock = (id: string) => setBlocks((form.content ?? []).filter((b) => b.id !== id));
  const moveBlock = (id: string, dir: -1 | 1) => {
    const cur = form.content ?? [];
    const i = cur.findIndex((b) => b.id === id);
    if (i < 0) return;
    const j = i + dir;
    if (j < 0 || j >= cur.length) return;
    const next = [...cur];
    [next[i], next[j]] = [next[j], next[i]];
    setBlocks(next);
  };
  const reorder = (fromId: string, toId: string, after: boolean) => {
    const cur = form.content ?? [];
    const from = cur.findIndex((b) => b.id === fromId);
    let to = cur.findIndex((b) => b.id === toId);
    if (from < 0 || to < 0 || fromId === toId) return;
    const next = [...cur];
    const [moved] = next.splice(from, 1);
    to = next.findIndex((b) => b.id === toId);
    next.splice(after ? to + 1 : to, 0, moved);
    setBlocks(next);
  };

  // Editable refs (for imperative split/merge caret placement)
  const editRefs = useRef<Map<string, HTMLElement>>(new Map());
  const registerRef = useCallback((id: string, el: HTMLElement | null) => {
    if (el) editRefs.current.set(id, el);
    else editRefs.current.delete(id);
  }, []);

  // ── Prose key handling: Enter split, Backspace merge ──
  const handleProseKey = (e: React.KeyboardEvent, block: ContentBlock) => {
    if (slashRef.current.open) return; // slash handles its own keys
    const el = e.currentTarget as HTMLElement;
    const mode = blockMode(block.type)!;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const sel = getSelection();
      if (!sel?.rangeCount) return;
      const r = sel.getRangeAt(0);
      const after = r.cloneRange();
      after.selectNodeContents(el);
      after.setStart(r.endContainer, r.endOffset);
      const frag = after.extractContents();
      const tmp = document.createElement("div");
      tmp.appendChild(frag);
      const afterMd = htmlToMd(tmp, mode);
      updateBlock(block.id, { text: htmlToMd(el, mode) });
      const nb: ContentBlock = { id: uid(), type: "paragraph", text: afterMd };
      insertAfter(block.id, nb);
      requestAnimationFrame(() => {
        const nx = editRefs.current.get(nb.id);
        if (nx) focusStart(nx);
      });
      return;
    }
    if (e.key === "Backspace" && caretAtStart(el)) {
      const cur = form.content ?? [];
      const i = cur.findIndex((b) => b.id === block.id);
      const isEmpty = el.textContent?.trim() === "";
      if (isEmpty && block.type !== "paragraph") {
        e.preventDefault();
        updateBlock(block.id, { text: "" });
        // turn into paragraph
        setBlocks(cur.map((b) => (b.id === block.id ? { ...b, type: "paragraph" } : b)));
        requestAnimationFrame(() => {
          const nx = editRefs.current.get(block.id);
          if (nx) focusStart(nx);
        });
        return;
      }
      // merge into previous prose block
      let p = i - 1;
      while (p >= 0 && !blockMode(cur[p].type)) p--;
      if (p >= 0) {
        e.preventDefault();
        const prev = cur[p];
        const prevMode = blockMode(prev.type)!;
        const prevEl = editRefs.current.get(prev.id);
        const merged = (prev.text ?? "") + htmlToMd(el, prevMode);
        const next = cur
          .filter((b) => b.id !== block.id)
          .map((b) => (b.id === prev.id ? { ...b, text: merged } : b));
        setBlocks(next);
        requestAnimationFrame(() => {
          const pe = editRefs.current.get(prev.id) ?? prevEl;
          if (pe) {
            pe.innerHTML = mdToHtml(merged, prevMode);
            focusEnd(pe);
          }
        });
      }
    }
  };

  // ── Slash menu ──
  const slashRef = useRef<{ open: boolean; blockId: string | null }>({
    open: false,
    blockId: null,
  });
  const [slash, setSlash] = useState<{
    x: number;
    y: number;
    q: string;
    sel: number;
    blockId: string;
  } | null>(null);
  const slashFiltered = useMemo(() => {
    if (!slash) return [] as SlashOpt[];
    const q = slash.q.toLowerCase();
    return SLASH_OPTS.filter((o) => (o.tt + " " + o.ds).toLowerCase().includes(q));
  }, [slash]);
  const openSlashFor = (el: HTMLElement, blockId: string, q = "") => {
    const r = el.getBoundingClientRect();
    slashRef.current = { open: true, blockId };
    setSlash({ x: r.left, y: r.bottom + 6, q, sel: 0, blockId });
  };
  const closeSlash = () => {
    slashRef.current = { open: false, blockId: null };
    setSlash(null);
  };
  const chooseSlash = (o: SlashOpt) => {
    if (!slash) return;
    const row = slash.blockId;
    const el = editRefs.current.get(row);
    const cur = form.content ?? [];
    const idx = cur.findIndex((b) => b.id === row);
    const curBlock = cur[idx];
    // The block the slash was invoked from is an empty paragraph if its only text
    // is the "/query" itself — in that case we REPLACE it rather than leaving a stray line.
    const rawText = el?.textContent ?? curBlock?.text ?? "";
    const isEmptyPara =
      !!curBlock && curBlock.type === "paragraph" && rawText.replace(/^\//, "").trim() === "";
    closeSlash();
    if (isEmptyPara && blockMode(o.t)) {
      // convert the empty paragraph in place (key includes type → remounts empty)
      setBlocks(cur.map((b) => (b.id === row ? { ...b, type: o.t, text: "" } : b)));
      requestAnimationFrame(() => {
        const nx = editRefs.current.get(row);
        if (nx) focusStart(nx);
      });
    } else if (isEmptyPara) {
      // replace the empty paragraph with the new structured block
      const nb = newBlockOf(o);
      const next = [...cur];
      next.splice(idx, 1, nb);
      setBlocks(next);
    } else {
      // clear the "/query" from the current paragraph, then insert after it
      if (el) {
        el.innerHTML = "";
        updateBlock(row, { text: "" });
      }
      const nb = newBlockOf(o);
      insertAfter(row, nb);
      if (blockMode(nb.type))
        requestAnimationFrame(() => {
          const nx = editRefs.current.get(nb.id);
          if (nx) focusStart(nx);
        });
    }
  };
  const onProseInput = (e: React.FormEvent, block: ContentBlock) => {
    const el = e.currentTarget as HTMLElement;
    const mode = blockMode(block.type)!;
    const md = htmlToMd(el, mode);
    updateBlock(block.id, { text: md });
    // slash trigger only in an otherwise-empty paragraph starting with "/"
    const txt = el.textContent ?? "";
    if (block.type === "paragraph" && txt.startsWith("/")) {
      if (!slashRef.current.open) openSlashFor(el, block.id, txt.slice(1));
      else setSlash((s) => (s ? { ...s, q: txt.slice(1), sel: 0 } : s));
    } else if (slashRef.current.open && slashRef.current.blockId === block.id) {
      closeSlash();
    }
  };

  // ── Inline format toolbar ──
  const [fmt, setFmt] = useState<{ x: number; y: number; mode: EditMode; linking: boolean } | null>(
    null,
  );
  const savedRange = useRef<Range | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const activeMode = useRef<EditMode | null>(null);
  useEffect(() => {
    const onSelChange = () => {
      const s = getSelection();
      if (!s?.rangeCount || s.isCollapsed) {
        if (!fmtLinking.current) setFmt(null);
        return;
      }
      // find enclosing editable prose block
      let n: Node | null = s.anchorNode;
      let mode: EditMode | null = null;
      while (n && n !== document.body) {
        if (n instanceof HTMLElement && n.dataset.mode) {
          mode = n.dataset.mode as EditMode;
          break;
        }
        n = n.parentNode;
      }
      if (!mode || mode === "plain" || s.toString().trim() === "") {
        if (!fmtLinking.current) setFmt(null);
        return;
      }
      const rect = s.getRangeAt(0).getBoundingClientRect();
      if (!rect.width && !rect.height) return;
      savedRange.current = s.getRangeAt(0).cloneRange();
      activeMode.current = mode;
      setFmt({ x: rect.left + rect.width / 2, y: rect.top - 8, mode, linking: false });
    };
    document.addEventListener("selectionchange", onSelChange);
    return () => document.removeEventListener("selectionchange", onSelChange);
  }, []);
  const fmtLinking = useRef(false);
  const restoreRange = () => {
    if (savedRange.current) {
      const s = getSelection();
      s?.removeAllRanges();
      s?.addRange(savedRange.current);
    }
  };
  const commitInputFromRange = () => {
    // read back the edited block into state
    const s = getSelection();
    let n: Node | null = s?.anchorNode ?? null;
    while (n && n !== document.body) {
      if (n instanceof HTMLElement && n.dataset.blockId) {
        const id = n.dataset.blockId;
        const mode = (n.dataset.mode as EditMode) ?? "paragraph";
        updateBlock(id, { text: htmlToMd(n, mode) });
        return;
      }
      n = n.parentNode;
    }
  };
  const wrapTeal = () => {
    restoreRange();
    const s = getSelection();
    if (!s?.rangeCount || s.isCollapsed) return;
    // unwrap if already teal
    let n: Node | null = s.anchorNode;
    while (n && n !== document.body) {
      if (n instanceof HTMLElement && n.classList.contains("bs-teal")) {
        const t = document.createTextNode(n.textContent ?? "");
        n.replaceWith(t);
        commitInputFromRange();
        return;
      }
      n = n.parentNode;
    }
    const r = s.getRangeAt(0);
    const span = document.createElement("span");
    span.className = "bs-teal";
    try {
      span.appendChild(r.extractContents());
      r.insertNode(span);
    } catch {
      /* noop */
    }
    commitInputFromRange();
  };
  const applyBold = () => {
    restoreRange();
    try {
      document.execCommand("styleWithCSS", false, "false");
      document.execCommand("bold");
    } catch {
      /* noop */
    }
    commitInputFromRange();
  };
  const applyItalic = () => {
    restoreRange();
    try {
      document.execCommand("styleWithCSS", false, "false");
      document.execCommand("italic");
    } catch {
      /* noop */
    }
    commitInputFromRange();
  };
  const applyUnderline = () => {
    restoreRange();
    try {
      document.execCommand("styleWithCSS", false, "false");
      document.execCommand("underline");
    } catch {
      /* noop */
    }
    commitInputFromRange();
  };
  // Colour the current selection. If it's already inside a coloured span, RECOLOUR
  // that span in place instead of nesting a new one — nesting produced invalid
  // {#hex|{#hex|…}} markup the renderer can't parse.
  const applyColor = (hex: string) => {
    restoreRange();
    const s = getSelection();
    if (!s?.rangeCount || s.isCollapsed) return;
    // Recolour an enclosing coloured span (skip the teal accent span).
    let n: Node | null = s.anchorNode;
    while (n && n !== document.body) {
      if (
        n instanceof HTMLElement &&
        !n.classList.contains("bs-teal") &&
        n.style?.color &&
        (n.textContent ?? "") === s.toString()
      ) {
        n.style.color = hex;
        commitInputFromRange();
        return;
      }
      n = n.parentNode;
    }
    const r = s.getRangeAt(0);
    const span = document.createElement("span");
    span.style.color = hex;
    try {
      span.appendChild(r.extractContents());
      r.insertNode(span);
      // Move the caret OUT of the coloured span (to just after it) so that any
      // text typed next is the default colour, not the colour just applied.
      const after = document.createRange();
      after.setStartAfter(span);
      after.collapse(true);
      s.removeAllRanges();
      s.addRange(after);
    } catch {
      /* noop */
    }
    commitInputFromRange();
  };
  const applyClear = () => {
    restoreRange();
    try {
      document.execCommand("removeFormat");
      document.execCommand("unlink");
    } catch {
      /* noop */
    }
    commitInputFromRange();
  };
  const startLink = () => {
    fmtLinking.current = true;
    setLinkUrl("https://");
    setFmt((f) => (f ? { ...f, linking: true } : f));
  };
  const commitLink = () => {
    restoreRange();
    const url = linkUrl.trim();
    try {
      if (!url || url === "https://") document.execCommand("unlink");
      else {
        const href =
          /^https?:\/\//i.test(url) || url[0] === "#" || url[0] === "/" ? url : "https://" + url;
        document.execCommand("createLink", false, href);
      }
    } catch {
      /* noop */
    }
    commitInputFromRange();
    fmtLinking.current = false;
    setFmt(null);
    setLinkUrl("");
  };

  // ── Block context menu ──
  const [ctx, setCtx] = useState<{ x: number; y: number; blockId: string } | null>(null);
  const openCtx = (anchor: HTMLElement, blockId: string) => {
    if (suppressClick.current) return; // trailing click right after a drag
    const r = anchor.getBoundingClientRect();
    setCtx({ x: r.right + 6, y: r.top, blockId });
  };
  const ctxBlock = ctx ? blocks.find((b) => b.id === ctx.blockId) : null;
  const doCtx = (action: string, arg?: ContentBlockType) => {
    if (!ctx) return;
    const id = ctx.blockId;
    const cur = form.content ?? [];
    if (action === "turn" && arg) {
      const b = cur.find((x) => x.id === id);
      setBlocks(cur.map((x) => (x.id === id ? { ...x, type: arg, text: b?.text ?? "" } : x)));
      requestAnimationFrame(() => {
        const nx = editRefs.current.get(id);
        if (nx) {
          nx.innerHTML = mdToHtml(b?.text ?? "", blockMode(arg)!);
          focusEnd(nx);
        }
      });
    } else if (action === "dup") {
      const b = cur.find((x) => x.id === id);
      if (b) insertAfter(id, { ...structuredCloneSafe(b), id: uid() });
    } else if (action === "up") moveBlock(id, -1);
    else if (action === "down") moveBlock(id, 1);
    else if (action === "del") removeBlock(id);
    setCtx(null);
  };

  // ── Drag reorder ──
  const dragState = useRef<{ id: string; moved: boolean } | null>(null);
  // Latest drop target, read imperatively in pointerup (state would be stale in the closure).
  const dropRef = useRef<{ id: string; after: boolean } | null>(null);
  // Set when a drag actually moved, so the trailing click doesn't open the context menu.
  const suppressClick = useRef(false);
  const [drop, setDrop] = useState<{
    x: number;
    y: number;
    w: number;
    id: string;
    after: boolean;
  } | null>(null);
  const startDrag = (e: React.PointerEvent, id: string) => {
    if (e.button !== 0) return;
    dragState.current = { id, moved: false };
    dropRef.current = null;
    const startY = e.clientY;
    const move = (ev: PointerEvent) => {
      if (!dragState.current) return;
      if (!dragState.current.moved && Math.abs(ev.clientY - startY) < 4) return;
      dragState.current.moved = true;
      const rows = [...document.querySelectorAll<HTMLElement>(".bstudio .bs-row")];
      let target: { el: HTMLElement; after: boolean } | null = null;
      for (const el of rows) {
        const r = el.getBoundingClientRect();
        if (ev.clientY < r.top + r.height / 2) {
          target = { el, after: false };
          break;
        }
      }
      if (!target && rows.length) {
        const el = rows[rows.length - 1];
        target = { el, after: true };
      }
      if (target) {
        const r = target.el.getBoundingClientRect();
        dropRef.current = { id: target.el.dataset.id!, after: target.after };
        setDrop({
          x: r.left,
          y: target.after ? r.bottom : r.top,
          w: r.width,
          id: target.el.dataset.id!,
          after: target.after,
        });
      }
    };
    const up = () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
      const d = dropRef.current;
      if (dragState.current?.moved && d) {
        reorder(dragState.current.id, d.id, d.after);
        suppressClick.current = true;
        setTimeout(() => {
          suppressClick.current = false;
        }, 60);
      }
      setDrop(null);
      dropRef.current = null;
      dragState.current = null;
    };
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up);
  };

  // close popovers on outside click / escape
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest(".bs-ctx")) setCtx(null);
      if (slashRef.current.open && !t.closest(".bs-slash") && !t.closest("[contenteditable]"))
        closeSlash();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCtx(null);
        closeSlash();
        if (!fmtLinking.current) setFmt(null);
        setPreview(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const onSlashKey = (e: React.KeyboardEvent) => {
    if (!slash) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSlash((s) => (s ? { ...s, sel: Math.min(s.sel + 1, slashFiltered.length - 1) } : s));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSlash((s) => (s ? { ...s, sel: Math.max(s.sel - 1, 0) } : s));
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      if (slashFiltered[slash.sel]) chooseSlash(slashFiltered[slash.sel]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeSlash();
    }
  };

  // ── Save / publish (unchanged data layer) ──
  const applySaved = (saved: BlogPost, msg: string) => {
    toast.success(msg);
    setPosts((ps) => {
      const idx = ps.findIndex((p) => p.slug === saved.slug);
      return idx >= 0 ? ps.map((p, i) => (i === idx ? saved : p)) : [saved, ...ps];
    });
    setSelected(saved);
    setDirty(false);
  };
  const save = async (opts?: { publish?: boolean; unpublish?: boolean }) => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!form.slug.trim()) {
      toast.error("Slug is required");
      return;
    }
    const editorName =
      (typeof localStorage !== "undefined" && localStorage.getItem("pb_editor_name")) || "Editor";
    const payload: Partial<BlogPost> & { editorName: string } = {
      ...form,
      tags: tagInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      editorName,
    };
    if (opts?.publish) {
      payload.status = "published";
      if (!payload.publishedAt) payload.publishedAt = new Date().toISOString();
    }
    if (opts?.unpublish) {
      payload.status = "draft";
    }
    const isPublishing = payload.status === "published" && !opts?.unpublish;
    if (isPublishing) {
      openPublishOtp(payload);
      return;
    }
    setSaving(true);
    try {
      const url = isNew
        ? `${BACKEND}/site/builder/blog/posts`
        : `${BACKEND}/site/builder/blog/posts/${selected!.slug}`;
      const res = await fetch(url, {
        method: isNew ? "POST" : "PUT",
        headers: authJsonHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const e = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(e.error ?? String(res.status));
      }
      const { post: saved } = (await res.json()) as { post: BlogPost };
      applySaved(saved, opts?.unpublish ? "Reverted to draft" : "Saved");
    } catch (err) {
      toast.error(`Save failed: ${err}`);
    } finally {
      setSaving(false);
    }
  };

  // ── OTP-gated publish (unchanged) ──
  const [publishOtp, setPublishOtp] = useState<{
    payload: Partial<BlogPost> & { editorName: string };
    slug: string;
    step: "email" | "otp";
    email: string;
    sessionId?: string;
    sentTo?: string;
    submitting: boolean;
    error?: string;
  } | null>(null);
  const [otpInput, setOtpInput] = useState("");
  const requestPublishOtp = async (
    staged: { slug: string; payload: Partial<BlogPost> & { editorName: string } },
    email: string,
  ) => {
    setPublishOtp((s) => (s ? { ...s, submitting: true, error: undefined } : s));
    try {
      const res = await fetch(`${BACKEND}/site/builder/blog/otp/request`, {
        method: "POST",
        headers: authJsonHeaders(),
        body: JSON.stringify({ ...staged.payload, slug: staged.slug, isNew, email }),
      });
      const d = await res
        .json()
        .catch(() => ({}) as { error?: string; sessionId?: string; sentTo?: string });
      if (!res.ok) {
        setPublishOtp((s) =>
          s
            ? { ...s, submitting: false, error: d.error || `Couldn't send OTP (${res.status})` }
            : s,
        );
        return;
      }
      setOtpInput("");
      setPublishOtp((s) =>
        s
          ? {
              ...s,
              step: "otp",
              email,
              sessionId: d.sessionId,
              sentTo: d.sentTo,
              submitting: false,
              error: undefined,
            }
          : s,
      );
      toast.success(`OTP sent to ${d.sentTo || email}`);
    } catch {
      setPublishOtp((s) =>
        s ? { ...s, submitting: false, error: "Couldn't send OTP — is the backend running?" } : s,
      );
    }
  };
  const openPublishOtp = (payload: Partial<BlogPost> & { editorName: string }) => {
    const staged = { slug: form.slug.trim(), payload };
    const sso = ssoEmail();
    if (sso) {
      setPublishOtp({ ...staged, step: "otp", email: sso, submitting: true });
      void requestPublishOtp(staged, sso);
    } else {
      setPublishOtp({ ...staged, step: "email", email: getAuth()?.email ?? "", submitting: false });
    }
  };
  const submitPublishEmail = () => {
    setPublishOtp((cur) => {
      if (!cur) return cur;
      const email = cur.email.trim().toLowerCase();
      if (!isValidOtpEmail(email))
        return { ...cur, error: `Enter a valid @${OTP_EMAIL_DOMAIN} email` };
      void requestPublishOtp({ slug: cur.slug, payload: cur.payload }, email);
      return { ...cur, email, submitting: true, error: undefined };
    });
  };
  const verifyPublishOtp = () => {
    setPublishOtp((cur) => {
      if (!cur?.sessionId) return cur;
      const code = otpInput.trim();
      if (!/^\d{6}$/.test(code)) return { ...cur, error: "Enter the 6-digit code" };
      void (async () => {
        try {
          const res = await fetch(`${BACKEND}/site/builder/blog/otp/verify`, {
            method: "POST",
            headers: authJsonHeaders(),
            body: JSON.stringify({ sessionId: cur.sessionId, otp: code }),
          });
          const d = await res.json().catch(
            () =>
              ({}) as {
                ok?: boolean;
                post?: BlogPost;
                attemptsRemaining?: number;
                error?: string;
              },
          );
          if (res.ok && d.ok) {
            applySaved(d.post as BlogPost, "Published!");
            setPublishOtp(null);
            setOtpInput("");
            return;
          }
          if (res.status === 400 && typeof d.attemptsRemaining === "number") {
            setPublishOtp((s) =>
              s
                ? {
                    ...s,
                    submitting: false,
                    error: `Invalid OTP — ${d.attemptsRemaining} attempt(s) left`,
                  }
                : s,
            );
            return;
          }
          if (res.status === 410) {
            setPublishOtp((s) =>
              s
                ? {
                    ...s,
                    submitting: false,
                    sessionId: undefined,
                    error: "OTP expired — request a new one",
                  }
                : s,
            );
            return;
          }
          if (res.status === 423) {
            setPublishOtp(null);
            setOtpInput("");
            toast.error(d.error || "Too many attempts — request a new OTP.");
            return;
          }
          setPublishOtp((s) =>
            s ? { ...s, submitting: false, error: d.error || `Verify failed (${res.status})` } : s,
          );
        } catch {
          setPublishOtp((s) =>
            s ? { ...s, submitting: false, error: "Verify failed — is the backend running?" } : s,
          );
        }
      })();
      return { ...cur, submitting: true, error: undefined };
    });
  };

  const newPost = () => {
    setSelected(null);
    setLeftTab("posts");
  };

  // ── Drag-to-reorder posts list (unchanged) ──
  const [dragSlug, setDragSlug] = useState<string | null>(null);
  const persistOrder = (ordered: BlogPost[]) => {
    fetch(`${BACKEND}/site/builder/blog/reorder`, {
      method: "PUT",
      headers: authJsonHeaders(),
      body: JSON.stringify({ slugs: ordered.map((p) => p.slug) }),
    }).catch(() => toast.error("Could not save order"));
  };
  const handleDropPost = (targetSlug: string) => {
    if (!dragSlug || dragSlug === targetSlug) {
      setDragSlug(null);
      return;
    }
    setPosts((ps) => {
      const from = ps.findIndex((p) => p.slug === dragSlug);
      const to = ps.findIndex((p) => p.slug === targetSlug);
      if (from < 0 || to < 0) return ps;
      const next = [...ps];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      persistOrder(next);
      return next;
    });
    setDragSlug(null);
  };

  const filtered = posts.filter(
    (p) =>
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.excerpt ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  // ── Outline (from headings) ──
  const outline = blocks
    .filter((b) => b.type === "heading2" || b.type === "heading3")
    .map((b) => ({
      id: b.id,
      lvl: b.type === "heading3" ? 3 : 2,
      txt: (b.text ?? "").replace(/\*\*(.+?)\*\*/g, "$1") || "Untitled",
    }));

  // ── SEO checks ──
  const checks: SeoCheck[] = useMemo(() => {
    const meta = form.excerpt.trim();
    const hs = blocks.filter((b) => b.type === "heading2" || b.type === "heading3").length;
    return [
      {
        ok: form.title.trim().length >= 15 && form.title.trim().length <= 70,
        t: "Title is 15–70 characters",
        d: "Ideal length for search snippets",
      },
      {
        ok: meta.length >= 70 && meta.length <= 160,
        t: "Excerpt set (70–160)",
        d: "Summarises the post for Google",
      },
      { ok: hs >= 2, t: "Has 2+ sections", d: "Structure powers the outline & TOC" },
      { ok: !!form.featuredImage, t: "Hero image added", d: "Drives clicks on social" },
      {
        ok:
          tagInput
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean).length >= 1,
        t: "Tagged",
        d: "Helps categorisation",
      },
    ];
  }, [form, blocks, tagInput]);
  const circ = 97.4;

  const jsonLdValid = useMemo(() => {
    const raw = (form.seo?.jsonLd ?? "").trim();
    if (!raw) return true;
    try {
      JSON.parse(raw);
      return true;
    } catch {
      return false;
    }
  }, [form.seo?.jsonLd]);

  // ── Meta & keyphrase checks (mirrors the scoring in /admin/seo) ──
  const metaChecks: SeoStatusCheck[] = useMemo(() => {
    const kp = (form.seo?.focusKeyphrase ?? "").toLowerCase().trim();
    const title = (form.seo?.metaTitle || form.title).trim();
    const desc = (form.seo?.metaDescription || form.excerpt).trim();
    const tl = title.length;
    const dl = desc.length;
    const kpPos = kp ? title.toLowerCase().indexOf(kp) : -1;
    const frontloaded = kpPos !== -1 && kpPos <= Math.ceil(tl * 0.4);
    const robots = form.seo?.robots ?? "";
    const indexable = !robots || robots.startsWith("index");

    return [
      {
        status: kp ? "good" : "ok",
        title: "Focus keyphrase set",
        detail: kp ? `Targeting "${kp}"` : "Optional, but sharpens the other checks",
      },
      {
        status: !kp ? "ok" : title.toLowerCase().includes(kp) ? "good" : "bad",
        title: "Keyphrase in search title",
        detail: !kp ? "Set a keyphrase to check" : title.toLowerCase().includes(kp) ? "Found in title" : "Not found in title",
      },
      {
        status: !kp || !title ? "ok" : frontloaded ? "good" : "ok",
        title: "Keyphrase near the start of the title",
        detail: "Search engines weight the first ~40% of a title more heavily",
      },
      {
        status: !kp ? "ok" : desc.toLowerCase().includes(kp) ? "good" : "bad",
        title: "Keyphrase in meta description",
        detail: !kp ? "Set a keyphrase to check" : desc.toLowerCase().includes(kp) ? "Found in description" : "Not found in description",
      },
      {
        status: tl === 0 ? "bad" : tl >= 30 && tl <= 60 ? "good" : "ok",
        title: "Search title length (30–60 ideal)",
        detail: `${tl} character${tl === 1 ? "" : "s"}`,
      },
      {
        status: dl === 0 ? "bad" : dl >= 140 && dl <= 160 ? "good" : dl >= 80 ? "ok" : "bad",
        title: "Meta description length (140–160 ideal)",
        detail: `${dl} character${dl === 1 ? "" : "s"}`,
      },
      {
        status: indexable ? "good" : "bad",
        title: "Indexable",
        detail: indexable ? "Index & follow" : "Blocked from search indexing",
      },
      {
        status: form.seo?.ogImage || form.featuredImage ? "good" : "ok",
        title: "Social share image set",
        detail: form.seo?.ogImage ? "Custom OG image set" : form.featuredImage ? "Falls back to the hero image" : "No image to share on social",
      },
      {
        status: form.seo?.canonicalUrl ? "good" : "ok",
        title: "Canonical URL set",
        detail: form.seo?.canonicalUrl ? form.seo.canonicalUrl : "Optional — set if this content is duplicated elsewhere",
      },
      {
        status: !form.seo?.jsonLd?.trim() ? "ok" : jsonLdValid ? "good" : "bad",
        title: "Structured data (JSON-LD)",
        detail: !form.seo?.jsonLd?.trim()
          ? "Optional — none set"
          : jsonLdValid
            ? "Valid JSON-LD set"
            : "Set but not valid JSON",
      },
    ];
  }, [form, jsonLdValid]);

  const contentStatusChecks: SeoStatusCheck[] = useMemo(
    () => checks.map((c) => ({ status: c.ok ? "good" : "bad", title: c.t, detail: c.d })),
    [checks],
  );

  const allSeoChecks = [...metaChecks, ...contentStatusChecks];
  const seoGood = allSeoChecks.filter((c) => c.status === "good").length;
  const seoBad = allSeoChecks.filter((c) => c.status === "bad").length;
  const overallSeoPct = Math.round((seoGood / allSeoChecks.length) * 100);
  const overallSeoStatus: SeoStatus =
    seoBad === 0 && overallSeoPct >= 70 ? "good" : seoBad <= 2 ? "ok" : "bad";
  const overallSeoLabel =
    overallSeoStatus === "good" ? "Good" : overallSeoStatus === "ok" ? "OK" : "Needs improvement";

  const words = countWords(blocks);
  const readMin = Math.max(1, Math.ceil(words / 220));

  // ── Preview + Export overlays ──
  const [preview, setPreview] = useState(false);
  const [exportKind, setExportKind] = useState<null | "html" | "md" | "json">(null);

  const scrollToBlock = (id: string) => {
    const el = document.querySelector<HTMLElement>(`.bstudio .bs-row[data-id="${id}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="bstudio">
      <style>{CSS}</style>

      {/* ── Top bar ── */}
      <header className="bs-top">
        <div className="bs-brand">
          <div className="bs-logo">S</div>
          <div>
            Salescode<small>Blog Studio</small>
          </div>
        </div>
        <div className="bs-vr" />
        <div className="bs-mini">{form.title || "Untitled"}</div>
        <div className="bs-vr" />
        <div className="bs-toptabs">
          <button className={activeView === "editor" ? "on" : ""} onClick={() => setActiveView("editor")}>
            Editor
          </button>
          <button className={activeView === "seo" ? "on" : ""} onClick={() => setActiveView("seo")}>
            SEO <span className="bs-seobadge">{overallSeoPct}</span>
          </button>
        </div>
        <div className={`bs-pill${dirty ? " bs-dirty" : ""}`}>
          <span className="bs-dot" />
          <span>{dirty ? "Unsaved changes" : "All changes saved"}</span>
        </div>
        <div className="bs-spacer" />
        <div className="bs-stats">
          <span>
            <b>{words}</b> words
          </span>
          <span>
            <b>{readMin}</b> min read
          </span>
        </div>
        <div className="bs-vr" />
        <button
          className={`bs-tbtn bs-icon${leftTab === "outline" && leftOpen ? " bs-active" : ""}`}
          title="Outline"
          onClick={() => {
            setLeftOpen(true);
            setLeftTab("outline");
          }}
        >
          {Ic.outline}
        </button>
        <button
          className={`bs-tbtn bs-icon${rightOpen ? " bs-active" : ""}`}
          title="Settings"
          onClick={() => setRightOpen((o) => !o)}
        >
          {Ic.settings}
        </button>
        <button className="bs-tbtn bs-ghost" onClick={() => setExportKind("html")}>
          {Ic.download}Export
        </button>
        <button className="bs-tbtn bs-ghost" onClick={() => setPreview(true)}>
          {Ic.eye}Preview
        </button>
        {form.status === "published" ? (
          <>
            <button
              className="bs-tbtn bs-ghost"
              onClick={() => save({ unpublish: true })}
              disabled={saving}
            >
              Unpublish
            </button>
            <button className="bs-tbtn bs-primary" onClick={() => save()} disabled={saving}>
              {saving ? "Saving…" : "Update"}
            </button>
          </>
        ) : (
          <>
            <button className="bs-tbtn bs-ghost" onClick={() => save()} disabled={saving}>
              {saving ? "Saving…" : "Save draft"}
            </button>
            <button
              className="bs-tbtn bs-primary"
              onClick={() => save({ publish: true })}
              disabled={saving}
            >
              {Ic.send}Publish
            </button>
          </>
        )}
      </header>

      {activeView === "editor" && (
      <div className="bs-body">
        {/* ── Left rail ── */}
        <aside className={`bs-left${leftOpen ? "" : " bs-collapsed"}`}>
          <div className="bs-seg">
            <button className={leftTab === "posts" ? "on" : ""} onClick={() => setLeftTab("posts")}>
              Posts
            </button>
            <button
              className={leftTab === "outline" ? "on" : ""}
              onClick={() => setLeftTab("outline")}
            >
              Outline
            </button>
          </div>

          {leftTab === "posts" ? (
            <>
              <div className="bs-lp">
                <button className="bs-newbtn" onClick={newPost}>
                  {Ic.plus} New Post
                </button>
                <div className="bs-search">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search posts…"
                  />
                </div>
              </div>
              <div className="bs-plist">
                {loading ? (
                  <p className="bs-empty">Loading…</p>
                ) : filtered.length === 0 ? (
                  <p className="bs-empty">No posts found</p>
                ) : (
                  filtered.map((p) => (
                    <button
                      key={p.slug}
                      className={`bs-pitem${selected?.slug === p.slug ? " on" : ""}`}
                      draggable={!search}
                      onDragStart={() => setDragSlug(p.slug)}
                      onDragOver={(e) => {
                        if (dragSlug) e.preventDefault();
                      }}
                      onDrop={() => handleDropPost(p.slug)}
                      onClick={() => setSelected(p)}
                    >
                      <span className="bs-pthumb">
                        {p.featuredImage ? <img src={p.featuredImage} alt="" /> : Ic.outline}
                      </span>
                      <span className="bs-pmeta">
                        <span className="bs-ptitle">{p.title || "Untitled"}</span>
                        <span className={`bs-badge ${p.status === "published" ? "live" : "draft"}`}>
                          {p.status === "published" ? "Live" : "Draft"}
                        </span>
                        {p.excerpt && <span className="bs-pexcerpt">{p.excerpt}</span>}
                      </span>
                    </button>
                  ))
                )}
              </div>
              <div className="bs-lfoot">
                {posts.length} post{posts.length !== 1 ? "s" : ""}
              </div>
            </>
          ) : (
            <div className="bs-outline">
              {outline.length === 0 ? (
                <p className="bs-empty">
                  Add <b>Section</b> and <b>Subsection</b> headings — they appear here as a jumpable
                  outline.
                </p>
              ) : (
                outline.map((h) => (
                  <button
                    key={h.id}
                    className={`bs-toc${h.lvl === 3 ? " l3" : ""}`}
                    onClick={() => scrollToBlock(h.id)}
                  >
                    {h.txt}
                  </button>
                ))
              )}
            </div>
          )}
        </aside>

        {/* ── Center canvas ── */}
        <main className="bs-canvas">
          <div className="bs-doc" key={docKey}>
            <PlainEditable
              className="bs-kicker"
              placeholder="EYEBROW"
              value={form.category ?? ""}
              onChange={(v) => set("category", v)}
            />
            <PlainEditable
              tag="h1"
              className="bs-title"
              placeholder="Untitled post"
              value={form.title}
              onChange={handleTitleChange}
            />
            <PlainEditable
              className="bs-sub"
              placeholder="Add a subtitle or excerpt…"
              value={form.excerpt}
              onChange={(v) => set("excerpt", v)}
            />
            <div className="bs-byline">
              <div className="bs-av">{(form.author?.trim()[0] || "A").toUpperCase()}</div>
              <div>
                by <b>{form.author || "Author name"}</b> ·{" "}
                {form.status === "published" && form.publishedAt
                  ? new Date(form.publishedAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Draft"}
              </div>
            </div>

            <Cover
              url={form.featuredImage}
              onSet={(u) => set("featuredImage", u)}
              onUpload={uploadImg}
            />

            <div className="bs-blocks">
              {blocks.length === 0 && (
                <p
                  className="bs-empty"
                  style={{ padding: "24px 0", cursor: "text" }}
                  onClick={() => {
                    const nb: ContentBlock = { id: uid(), type: "paragraph", text: "" };
                    insertAfter(null, nb);
                    requestAnimationFrame(() => {
                      const el = editRefs.current.get(nb.id);
                      if (el) focusStart(el);
                    });
                  }}
                >
                  Click here to start writing — or press <b>“/”</b> for commands and the <b>+</b> in the gutter to add blocks.
                </p>
              )}
              {blocks.map((block) => (
                <BlockRow
                  key={block.id}
                  block={block}
                  onGutterAdd={() => {
                    const nb: ContentBlock = { id: uid(), type: "paragraph", text: "" };
                    insertAfter(block.id, nb);
                    requestAnimationFrame(() => {
                      const el = editRefs.current.get(nb.id);
                      if (el) {
                        focusStart(el);
                        openSlashFor(el, nb.id, "");
                      }
                    });
                  }}
                  onGutterMenu={(anchor) => openCtx(anchor, block.id)}
                  onDrag={(e) => startDrag(e, block.id)}
                  menuOpen={ctx?.blockId === block.id}
                  registerRef={registerRef}
                  onProseInput={onProseInput}
                  onProseKey={handleProseKey}
                  onSlashKey={onSlashKey}
                  updateBlock={updateBlock}
                  uploadImg={uploadImg}
                />
              ))}
            </div>
          </div>
        </main>

        {/* ── Right rail ── */}
        <aside className={`bs-right${rightOpen ? "" : " bs-collapsed"}`}>
          <div className="bs-rhead">
            <h3>Post settings</h3>
            <button className="bs-tbtn bs-icon" onClick={() => setRightOpen(false)}>
              {Ic.x}
            </button>
          </div>
          <div className="bs-rbody">
            <div className="bs-field">
              <label>
                Hero image <span className="bs-hint">upload or URL</span>
              </label>
              <UploadBtn
                label="Upload hero image"
                onUpload={uploadImg}
                onDone={(u) => set("featuredImage", u)}
                value={form.featuredImage}
              />
              <input
                style={{ marginTop: 8 }}
                value={form.featuredImage}
                onChange={(e) => set("featuredImage", e.target.value)}
                placeholder="…or paste an image URL"
              />
              {form.featuredImage && (
                <input
                  style={{ marginTop: 8 }}
                  value={form.featuredImageCaption ?? ""}
                  onChange={(e) => set("featuredImageCaption", e.target.value)}
                  placeholder="Image caption (optional)"
                />
              )}
            </div>

            <div className="bs-field">
              <label>Author</label>
              <input
                value={form.author ?? ""}
                onChange={(e) => set("author", e.target.value)}
                placeholder="e.g. Priya Menon"
              />
            </div>
            <div className="bs-field">
              <label>Author role</label>
              <input
                value={form.authorRole ?? ""}
                onChange={(e) => set("authorRole", e.target.value)}
                placeholder="Product Lead"
              />
            </div>
            <div className="bs-field">
              <label>Category</label>
              <input
                value={form.category ?? ""}
                onChange={(e) => set("category", e.target.value)}
                placeholder="Blog, Case Study, News…"
              />
            </div>

            <div className="bs-field">
              <label>
                URL slug <span className="bs-hint">auto from title</span>
              </label>
              <input
                value={form.slug}
                onChange={(e) => {
                  setSlugManual(true);
                  set("slug", e.target.value.toLowerCase().replace(/\s+/g, "-"));
                }}
                placeholder="my-post-slug"
              />
              <div className="bs-permalink">
                /blog/<b>{form.slug || "…"}</b>
              </div>
            </div>

            <div className="bs-field">
              <label>
                Excerpt / meta description <span className="bs-hint">for search results</span>
              </label>
              <textarea
                value={form.excerpt}
                onChange={(e) => set("excerpt", e.target.value)}
                placeholder="One or two sentences summarising the post for Google and social cards."
              />
              <div
                className={`bs-counter${form.excerpt.length > 160 ? " bad" : form.excerpt.length > 140 ? " warn" : ""}`}
              >
                {form.excerpt.length} / 160
              </div>
            </div>

            <div className="bs-field">
              <label>
                Tags <span className="bs-hint">comma-separated</span>
              </label>
              <input
                value={tagInput}
                onChange={(e) => {
                  setTagInput(e.target.value);
                  setDirty(true);
                }}
                placeholder="SFA, CPG, AI"
              />
            </div>
            <div className="bs-field">
              <label>
                Read time <span className="bs-hint">auto-calculated</span>
              </label>
              <input
                value={form.readTime ?? ""}
                onChange={(e) => set("readTime", e.target.value)}
                placeholder="5 min read"
              />
            </div>

            <p className="bs-hint" style={{ display: "block", marginTop: 4 }}>
              Search title, meta description, social cards and other SEO fields moved to the{" "}
              <button
                type="button"
                onClick={() => setActiveView("seo")}
                style={{ color: "var(--teal)", textDecoration: "underline" }}
              >
                SEO tab
              </button>
              .
            </p>
          </div>
        </aside>
      </div>
      )}

      {activeView === "seo" && (
        <div className="bs-seoview">
          <div className="bs-seoid">
            {form.featuredImage ? (
              <img src={form.featuredImage} alt="" />
            ) : (
              <span className="ph">{Ic.outline}</span>
            )}
            <div className="t">
              <b>{form.title || "Untitled post"}</b>
              <span>{form.status === "published" ? "Published" : "Draft"} · /blog/{form.slug || "…"}</span>
            </div>
          </div>
          <div className="bs-seogrid">
            <div>
              <div className="bs-scoreblock">
                <svg width="64" height="64" viewBox="0 0 36 36">
                  <path
                    d="M18 2.5a15.5 15.5 0 1 1 0 31 15.5 15.5 0 0 1 0-31"
                    fill="none"
                    stroke="#242C3B"
                    strokeWidth="3.5"
                  />
                  <path
                    d="M18 2.5a15.5 15.5 0 1 1 0 31 15.5 15.5 0 0 1 0-31"
                    fill="none"
                    stroke="url(#bsg2)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeDasharray={circ}
                    strokeDashoffset={circ - (circ * overallSeoPct) / 100}
                  />
                  <defs>
                    <linearGradient id="bsg2" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stopColor="#5B8BFF" />
                      <stop offset="1" stopColor="#2FD8C4" />
                    </linearGradient>
                  </defs>
                  <text x="18" y="21.5" textAnchor="middle" fontSize="11" fontWeight="700" fill="#E9ECF4">
                    {overallSeoPct}
                  </text>
                </svg>
                <div className="lbl">
                  <b>{overallSeoLabel}</b>
                  {seoGood}/{allSeoChecks.length} checks passing
                  <small>Combines search metadata and content-quality signals.</small>
                </div>
              </div>

              <div className="bs-seocard">
                <h4>Meta &amp; keyphrase</h4>
                <p className="sub">How this post's search title, description and keyphrase are set up.</p>
                <div className="bs-checkgrp">
                  {metaChecks.map((c, i) => (
                    <div key={i} className={`bs-checkrow ${c.status}`}>
                      <span className="dot" />
                      <div>
                        <div>{c.title}</div>
                        <small>{c.detail}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bs-seocard">
                <h4>Content readiness</h4>
                <p className="sub">Structure and depth signals search engines and readers both reward.</p>
                <div className="bs-checkgrp">
                  {contentStatusChecks.map((c, i) => (
                    <div key={i} className={`bs-checkrow ${c.status}`}>
                      <span className="dot" />
                      <div>
                        <div>{c.title}</div>
                        <small>{c.detail}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="bs-seocard">
                <h4>Search &amp; social</h4>
                <p className="sub">Blank fields fall back to the post's title, excerpt and hero image.</p>

                <div className="bs-field">
                  <label>Focus keyphrase</label>
                  <input
                    value={form.seo?.focusKeyphrase ?? ""}
                    onChange={(e) => setSeo("focusKeyphrase", e.target.value)}
                    placeholder="e.g. AI-native SFA"
                  />
                </div>

                <div className="bs-field">
                  <label>
                    Search title <span className="bs-hint">defaults to the post title</span>
                  </label>
                  <input
                    value={form.seo?.metaTitle ?? ""}
                    onChange={(e) => setSeo("metaTitle", e.target.value)}
                    placeholder={form.title || "Page title for search engines"}
                  />
                  <div className="bs-lenbar">
                    <i
                      style={{
                        width: `${Math.min(100, ((form.seo?.metaTitle || form.title).length / 60) * 100)}%`,
                        background:
                          (form.seo?.metaTitle || form.title).length >= 30 &&
                          (form.seo?.metaTitle || form.title).length <= 60
                            ? "var(--teal)"
                            : "#FBBF24",
                      }}
                    />
                  </div>
                </div>

                <div className="bs-field">
                  <label>
                    Meta description <span className="bs-hint">defaults to the excerpt</span>
                  </label>
                  <textarea
                    value={form.seo?.metaDescription ?? ""}
                    onChange={(e) => setSeo("metaDescription", e.target.value)}
                    placeholder="Override the excerpt for search results (optional)."
                  />
                  <div className="bs-lenbar">
                    <i
                      style={{
                        width: `${Math.min(100, ((form.seo?.metaDescription || form.excerpt).length / 160) * 100)}%`,
                        background:
                          (form.seo?.metaDescription || form.excerpt).length >= 140 &&
                          (form.seo?.metaDescription || form.excerpt).length <= 160
                            ? "var(--teal)"
                            : "#FBBF24",
                      }}
                    />
                  </div>
                </div>

                <div className="bs-field">
                  <label>
                    Focus keywords <span className="bs-hint">comma-separated</span>
                  </label>
                  <input
                    value={(form.seo?.keywords ?? []).join(", ")}
                    onChange={(e) =>
                      setSeo(
                        "keywords",
                        e.target.value
                          .split(",")
                          .map((k) => k.trim())
                          .filter(Boolean),
                      )
                    }
                    placeholder="AI SFA, CPG sales, route to market"
                  />
                </div>

                <div className="bs-field">
                  <label>Search indexing</label>
                  <select value={form.seo?.robots ?? ""} onChange={(e) => setSeo("robots", e.target.value)}>
                    <option value="">Index &amp; follow (default)</option>
                    <option value="index, follow">Index &amp; follow</option>
                    <option value="noindex, follow">No index, follow links</option>
                    <option value="noindex, nofollow">No index, no follow</option>
                  </select>
                </div>

                <div className="bs-field">
                  <label>
                    Canonical URL <span className="bs-hint">optional</span>
                  </label>
                  <input
                    value={form.seo?.canonicalUrl ?? ""}
                    onChange={(e) => setSeo("canonicalUrl", e.target.value)}
                    placeholder="https://salescode.ai/resources/blog/…"
                  />
                </div>
              </div>

              <div className="bs-seocard">
                <h4>Open Graph (Facebook / LinkedIn)</h4>
                <p className="sub">Blank fields fall back to the search title / description / hero image above.</p>
                <div className="bs-field">
                  <label>OG title</label>
                  <input
                    value={form.seo?.ogTitle ?? ""}
                    onChange={(e) => setSeo("ogTitle", e.target.value)}
                    placeholder={form.seo?.metaTitle || form.title}
                  />
                </div>
                <div className="bs-field">
                  <label>OG description</label>
                  <textarea
                    value={form.seo?.ogDescription ?? ""}
                    onChange={(e) => setSeo("ogDescription", e.target.value)}
                    placeholder={form.seo?.metaDescription || form.excerpt}
                  />
                </div>
                <div className="bs-field">
                  <label>OG image URL</label>
                  <input
                    value={form.seo?.ogImage ?? ""}
                    onChange={(e) => setSeo("ogImage", e.target.value)}
                    placeholder={form.featuredImage || "https://…/og-image.jpg"}
                  />
                </div>
              </div>

              <div className="bs-seocard">
                <h4>Twitter / X card</h4>
                <p className="sub">Blank fields fall back to the Open Graph fields above.</p>
                <div className="bs-field">
                  <label>Twitter title</label>
                  <input
                    value={form.seo?.twitterTitle ?? ""}
                    onChange={(e) => setSeo("twitterTitle", e.target.value)}
                    placeholder={form.seo?.ogTitle || form.seo?.metaTitle || form.title}
                  />
                </div>
                <div className="bs-field">
                  <label>Twitter description</label>
                  <textarea
                    value={form.seo?.twitterDescription ?? ""}
                    onChange={(e) => setSeo("twitterDescription", e.target.value)}
                    placeholder={form.seo?.ogDescription || form.seo?.metaDescription || form.excerpt}
                  />
                </div>
                <div className="bs-field">
                  <label>Twitter image URL</label>
                  <input
                    value={form.seo?.twitterImage ?? ""}
                    onChange={(e) => setSeo("twitterImage", e.target.value)}
                    placeholder={form.seo?.ogImage || form.featuredImage || "https://…/twitter-card.jpg"}
                  />
                </div>
              </div>

              <div className="bs-seocard">
                <h4>Structured data (JSON-LD)</h4>
                <p className="sub">
                  Optional. Paste a custom schema (e.g. <code>Article</code> or <code>FAQPage</code>) to
                  inject verbatim in a <code>&lt;script type="application/ld+json"&gt;</code> tag. Leave
                  blank to skip.
                </p>
                <div className="bs-field">
                  <textarea
                    className={`bs-jsonld${form.seo?.jsonLd?.trim() && !jsonLdValid ? " err" : ""}`}
                    value={form.seo?.jsonLd ?? ""}
                    onChange={(e) => setSeo("jsonLd", e.target.value)}
                    placeholder={'{\n  "@context": "https://schema.org",\n  "@type": "Article",\n  "headline": "…"\n}'}
                    spellCheck={false}
                  />
                  {form.seo?.jsonLd?.trim() && !jsonLdValid && (
                    <div className="bs-jsonld-err">Not valid JSON — check for a trailing comma or missing quote.</div>
                  )}
                </div>
              </div>

              {!isNew && form.slug && (
                <a
                  className="bs-tbtn bs-ghost"
                  href={`${RENDERER}/blog/${form.slug}?preview=1`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {Ic.ext}Open live preview
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Floating: slash menu ── */}
      {slash && (
        <div className="bs-slash show" style={{ left: slash.x, top: slash.y }}>
          {slashFiltered.length === 0 ? (
            <div className="bs-empty">No blocks match “{slash.q}”</div>
          ) : (
            (() => {
              let g = "";
              const out: React.ReactNode[] = [];
              slashFiltered.forEach((o, i) => {
                if (o.grp !== g) {
                  g = o.grp;
                  out.push(
                    <div key={"g" + i} className="grp">
                      {g}
                    </div>,
                  );
                }
                out.push(
                  <button
                    key={i}
                    className={`bs-opt${i === slash.sel ? " sel" : ""}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => chooseSlash(o)}
                  >
                    <div className="oic">{o.ic}</div>
                    <div>
                      <div className="tt">{o.tt}</div>
                      <div className="ds">{o.ds}</div>
                    </div>
                  </button>,
                );
              });
              return out;
            })()
          )}
        </div>
      )}

      {/* ── Floating: format toolbar ── */}
      {fmt && (
        <div className="bs-fmt show" style={{ left: fmt.x, top: fmt.y }}>
          {fmt.linking ? (
            <>
              <input
                autoFocus
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitLink();
                  if (e.key === "Escape") {
                    fmtLinking.current = false;
                    setFmt(null);
                  }
                }}
                placeholder="Paste a link…"
              />
              <button className="go" onMouseDown={(e) => e.preventDefault()} onClick={commitLink}>
                Link
              </button>
            </>
          ) : (
            <>
              {fmt.mode === "paragraph" && (
                <>
                  <button title="Bold" onMouseDown={(e) => e.preventDefault()} onClick={applyBold}>
                    <b>B</b>
                  </button>
                  <button title="Italic" onMouseDown={(e) => e.preventDefault()} onClick={applyItalic}>
                    <i>I</i>
                  </button>
                  <button title="Underline" onMouseDown={(e) => e.preventDefault()} onClick={applyUnderline}>
                    <span style={{ textDecoration: "underline" }}>U</span>
                  </button>
                </>
              )}
              <button title="Teal" onMouseDown={(e) => e.preventDefault()} onClick={wrapTeal}>
                <span className="bs-teal" style={{ fontWeight: 700 }}>
                  A
                </span>
              </button>
              {fmt.mode === "paragraph" && (
                <label
                  title="Text color"
                  style={{ width: 32, height: 32, borderRadius: 8, display: "grid", placeItems: "center", cursor: "pointer", position: "relative" }}
                >
                  <span style={{ fontWeight: 700, background: "linear-gradient(90deg,#ef4444,#3b82f6)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>A</span>
                  <input
                    type="color"
                    onChange={(e) => applyColor(e.target.value)}
                    style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
                  />
                </label>
              )}
              {fmt.mode === "paragraph" && (
                <>
                  <div className="sep" />
                  <button title="Link" onMouseDown={(e) => e.preventDefault()} onClick={startLink}>
                    🔗
                  </button>
                </>
              )}
              <div className="sep" />
              <button title="Clear" onMouseDown={(e) => e.preventDefault()} onClick={applyClear}>
                ⌫
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Floating: block context menu ── */}
      {ctx && ctxBlock && (
        <div className="bs-ctx show" style={{ left: ctx.x, top: ctx.y }}>
          {blockMode(ctxBlock.type) &&
            TURN_INTO.map((t) => (
              <button key={t} onClick={() => doCtx("turn", t)}>
                <span style={{ width: 18, textAlign: "center", fontWeight: 600 }}>
                  {SLASH_OPTS.find((o) => o.t === t)?.ic ?? "¶"}
                </span>
                {TYPE_LABEL[t]}
              </button>
            ))}
          {blockMode(ctxBlock.type) && <div className="sep" />}
          <button onClick={() => doCtx("dup")}>Duplicate</button>
          <button onClick={() => doCtx("up")}>Move up</button>
          <button onClick={() => doCtx("down")}>Move down</button>
          <div className="sep" />
          <button className="danger" onClick={() => doCtx("del")}>
            Delete
          </button>
        </div>
      )}

      {/* drop indicator */}
      {drop && (
        <div
          className="bs-drop"
          style={{ display: "block", left: drop.x, top: drop.y, width: drop.w }}
        />
      )}

      {/* ── Preview overlay ── */}
      {preview && (
        <div className="bs-preview show">
          <div className="bs-pvbar">
            <button className="bs-tbtn bs-ghost" onClick={() => setPreview(false)}>
              ← Back to editor
            </button>
            <div className="bs-spacer" />
            <div className="bs-teal" style={{ fontSize: 12, fontWeight: 600 }}>
              {form.slug ? "Live page preview" : "Reader preview (save to see the live page)"}
            </div>
          </div>
          <div className="bs-pvscroll">
            {form.slug ? (
              // Embed the actual rendered blog page so the preview always matches
              // the live site exactly (not a hand-built approximation). Shows the
              // last SAVED content — save the draft to reflect recent edits.
              <iframe
                title="Live blog preview"
                src={`${RENDERER}/blog/${form.slug}?preview=1`}
                style={{ width: "100%", height: "100%", border: "none", display: "block", background: "#fff" }}
              />
            ) : (
              <PreviewArticle form={form} blocks={blocks} />
            )}
          </div>
        </div>
      )}

      {/* ── Export modal ── */}
      {exportKind && (
        <div
          className="bs-scrim"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setExportKind(null);
          }}
        >
          <div className="bs-modal">
            <div className="bs-mhead">
              <h3>Export</h3>
              <button className="bs-tbtn bs-icon" onClick={() => setExportKind(null)}>
                {Ic.x}
              </button>
            </div>
            <div className="bs-mbody">
              <div className="bs-etabs">
                {(["html", "md", "json"] as const).map((k) => (
                  <button
                    key={k}
                    className={exportKind === k ? "on" : ""}
                    onClick={() => setExportKind(k)}
                  >
                    {k.toUpperCase()}
                  </button>
                ))}
              </div>
              <textarea
                className="bs-code-out"
                readOnly
                value={exportDoc(form, blocks, tagInput, exportKind)}
              />
            </div>
            <div className="bs-mfoot">
              <button className="bs-btn ghost" onClick={() => setExportKind(null)}>
                Close
              </button>
              <button
                className="bs-btn primary"
                onClick={() => {
                  navigator.clipboard?.writeText(exportDoc(form, blocks, tagInput, exportKind));
                  toast.success(`${exportKind.toUpperCase()} copied`);
                }}
              >
                Copy {exportKind.toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Publish OTP modal (unchanged flow) ── */}
      {publishOtp && (
        <div
          className="bs-scrim"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setPublishOtp(null);
              setOtpInput("");
            }
          }}
        >
          <div className="bs-modal" style={{ maxWidth: 400 }}>
            <div className="bs-mhead">
              <h3>Verify to publish</h3>
              <button
                className="bs-tbtn bs-icon"
                onClick={() => {
                  setPublishOtp(null);
                  setOtpInput("");
                }}
              >
                {Ic.x}
              </button>
            </div>
            {publishOtp.step === "email" ? (
              <div className="bs-mbody" style={{ display: "grid", gap: 12 }}>
                <p style={{ fontSize: 12.5, color: "var(--muted)" }}>
                  Enter your <b style={{ color: "var(--ink-2)" }}>@{OTP_EMAIL_DOMAIN}</b> email —
                  we'll send a 6-digit code to confirm this publish.
                </p>
                <input
                  className="bs-otp-in"
                  autoFocus
                  type="email"
                  value={publishOtp.email}
                  onChange={(e) =>
                    setPublishOtp((s) =>
                      s ? { ...s, email: e.target.value, error: undefined } : s,
                    )
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitPublishEmail();
                  }}
                  placeholder={`you@${OTP_EMAIL_DOMAIN}`}
                />
                {publishOtp.error && <p className="bs-err">{publishOtp.error}</p>}
                <button
                  className="bs-btn primary"
                  onClick={submitPublishEmail}
                  disabled={publishOtp.submitting || !isValidOtpEmail(publishOtp.email)}
                >
                  {publishOtp.submitting ? "Sending…" : "Send code"}
                </button>
              </div>
            ) : (
              <div className="bs-mbody" style={{ display: "grid", gap: 12 }}>
                <p style={{ fontSize: 12.5, color: "var(--muted)" }}>
                  {publishOtp.sentTo ? (
                    <>
                      Enter the 6-digit code sent to{" "}
                      <b style={{ color: "var(--ink-2)" }}>{publishOtp.sentTo}</b>.
                    </>
                  ) : (
                    "Sending code…"
                  )}
                </p>
                <input
                  className="bs-otp-in bs-otp-code"
                  autoFocus
                  inputMode="numeric"
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") verifyPublishOtp();
                  }}
                  placeholder="••••••"
                />
                {publishOtp.error && <p className="bs-err">{publishOtp.error}</p>}
                <button
                  className="bs-btn primary"
                  onClick={verifyPublishOtp}
                  disabled={publishOtp.submitting || otpInput.length !== 6 || !publishOtp.sessionId}
                >
                  {publishOtp.submitting ? "Verifying…" : "Verify & publish"}
                </button>
                <button
                  className="bs-btn ghost"
                  onClick={() =>
                    requestPublishOtp(
                      { slug: publishOtp.slug, payload: publishOtp.payload },
                      publishOtp.email,
                    )
                  }
                  disabled={publishOtp.submitting}
                >
                  Resend code
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function structuredCloneSafe(b: ContentBlock): ContentBlock {
  return JSON.parse(JSON.stringify(b)) as ContentBlock;
}

// ── Plain-text contentEditable (title / subtitle / kicker) ──────────
function PlainEditable({
  value,
  onChange,
  className,
  placeholder,
  tag = "div",
}: {
  value: string;
  onChange: (v: string) => void;
  className: string;
  placeholder: string;
  tag?: "div" | "h1";
}) {
  const initRef = (el: HTMLElement | null) => {
    if (el && el.dataset.init !== "1") {
      el.textContent = value;
      el.dataset.init = "1";
    }
  };
  const onInput = (e: React.FormEvent<HTMLElement>) => onChange(e.currentTarget.textContent ?? "");
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") e.preventDefault();
  };
  if (tag === "h1") {
    return (
      <h1
        ref={initRef}
        className={className}
        contentEditable
        suppressContentEditableWarning
        data-ph={placeholder}
        spellCheck={false}
        onInput={onInput}
        onKeyDown={onKeyDown}
      />
    );
  }
  return (
    <div
      ref={initRef}
      className={className}
      contentEditable
      suppressContentEditableWarning
      data-ph={placeholder}
      spellCheck={false}
      onInput={onInput}
      onKeyDown={onKeyDown}
    />
  );
}

// ── Cover image ─────────────────────────────────────────────────────
function Cover({
  url,
  onSet,
  onUpload,
}: {
  url: string;
  onSet: (u: string) => void;
  onUpload: (f: File) => Promise<string | null>;
}) {
  const [busy, setBusy] = useState(false);
  const pick = () =>
    pickFile(false, async (files) => {
      setBusy(true);
      const u = await onUpload(files[0]);
      setBusy(false);
      if (u) onSet(u);
    });
  return (
    <div className={`bs-cover${url ? " has" : ""}`}>
      {url ? (
        <>
          <img src={url} alt="" />
          <div className="bs-cover-tools">
            <button onClick={pick}>{busy ? "Uploading…" : "Replace"}</button>
            <button onClick={() => onSet("")}>Remove</button>
          </div>
        </>
      ) : (
        <div className="bs-cover-ph" onClick={pick}>
          {Ic.plus}
          <div>{busy ? "Uploading…" : "Add a cover image"}</div>
          <small>Click to upload, or paste a URL in settings</small>
        </div>
      )}
    </div>
  );
}

// ── Upload button (settings + blocks) ───────────────────────────────
function UploadBtn({
  label,
  value,
  onUpload,
  onDone,
  small,
}: {
  label: string;
  value?: string;
  onUpload: (f: File) => Promise<string | null>;
  onDone: (u: string) => void;
  small?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      className="bs-upbtn"
      disabled={busy}
      style={small ? { height: 30, fontSize: 12 } : { width: "100%", justifyContent: "center" }}
      onClick={() =>
        pickFile(false, async (f) => {
          setBusy(true);
          const u = await onUpload(f[0]);
          setBusy(false);
          if (u) onDone(u);
        })
      }
    >
      {busy ? "Uploading…" : value ? `Replace ${label.toLowerCase()}` : label}
    </button>
  );
}

// ── Block row (gutter + content) ────────────────────────────────────
interface BlockRowProps {
  block: ContentBlock;
  onGutterAdd: () => void;
  onGutterMenu: (anchor: HTMLElement) => void;
  onDrag: (e: React.PointerEvent) => void;
  menuOpen: boolean;
  registerRef: (id: string, el: HTMLElement | null) => void;
  onProseInput: (e: React.FormEvent, b: ContentBlock) => void;
  onProseKey: (e: React.KeyboardEvent, b: ContentBlock) => void;
  onSlashKey: (e: React.KeyboardEvent) => void;
  updateBlock: (id: string, patch: Partial<ContentBlock>) => void;
  uploadImg: (f: File) => Promise<string | null>;
}
function BlockRow(p: BlockRowProps) {
  const { block } = p;
  return (
    <div className={`bs-row${p.menuOpen ? " menu" : ""}`} data-id={block.id} data-type={block.type}>
      <div className="bs-gutter">
        <button className="bs-gbtn" title="Add block below" onClick={p.onGutterAdd}>
          {Ic.plus}
        </button>
        <button
          className="bs-gbtn drag"
          title="Drag to move · click for options"
          onPointerDown={p.onDrag}
          onClick={(e) => p.onGutterMenu(e.currentTarget)}
        >
          {Ic.drag}
        </button>
      </div>
      <div className="bs-bc">
        <BlockContent
          block={block}
          registerRef={p.registerRef}
          onProseInput={p.onProseInput}
          onProseKey={p.onProseKey}
          onSlashKey={p.onSlashKey}
          updateBlock={p.updateBlock}
          uploadImg={p.uploadImg}
        />
      </div>
    </div>
  );
}

// ── Block content by type ───────────────────────────────────────────
function BlockContent({
  block,
  registerRef,
  onProseInput,
  onProseKey,
  onSlashKey,
  updateBlock,
  uploadImg,
}: {
  block: ContentBlock;
  registerRef: (id: string, el: HTMLElement | null) => void;
  onProseInput: (e: React.FormEvent, b: ContentBlock) => void;
  onProseKey: (e: React.KeyboardEvent, b: ContentBlock) => void;
  onSlashKey: (e: React.KeyboardEvent) => void;
  updateBlock: (id: string, patch: Partial<ContentBlock>) => void;
  uploadImg: (f: File) => Promise<string | null>;
}) {
  const mode = blockMode(block.type);

  // Prose blocks: paragraph / heading2 / heading3 / quote
  if (mode) {
    const cls =
      block.type === "heading2"
        ? "bs-h2"
        : block.type === "heading3"
          ? "bs-h3"
          : block.type === "quote"
            ? "bs-quote"
            : "bs-p";
    const ph =
      block.type === "paragraph"
        ? "Write, or press “/” for commands"
        : block.type === "heading2"
          ? "Section heading"
          : block.type === "heading3"
            ? "Subsection heading"
            : "Quote";
    return (
      <>
        <ProseEditable
          key={block.id + block.type}
          block={block}
          mode={mode}
          className={cls}
          placeholder={ph}
          registerRef={registerRef}
          onInput={onProseInput}
          onKey={onProseKey}
          onSlashKey={onSlashKey}
        />
        {block.type === "quote" && <AttributionEditable block={block} updateBlock={updateBlock} />}
      </>
    );
  }

  if (block.type === "divider")
    return (
      <div className="bs-divider">
        <span />
        <span />
        <span />
      </div>
    );

  if (block.type === "list") return <ListBlock block={block} updateBlock={updateBlock} />;

  if (block.type === "image")
    return <ImageBlock block={block} updateBlock={updateBlock} uploadImg={uploadImg} />;

  if (block.type === "image-grid")
    return <GridBlock block={block} updateBlock={updateBlock} uploadImg={uploadImg} />;

  if (block.type === "faq") return <FaqBlock block={block} updateBlock={updateBlock} />;

  if (block.type === "html") return <HtmlBlock block={block} updateBlock={updateBlock} />;

  if (block.type === "youtube") return <YouTubeBlock block={block} updateBlock={updateBlock} />;

  return null;
}

// Uncontrolled contentEditable for prose; initial HTML set once per mount.
function ProseEditable({
  block,
  mode,
  className,
  placeholder,
  registerRef,
  onInput,
  onKey,
  onSlashKey,
}: {
  block: ContentBlock;
  mode: EditMode;
  className: string;
  placeholder: string;
  registerRef: (id: string, el: HTMLElement | null) => void;
  onInput: (e: React.FormEvent, b: ContentBlock) => void;
  onKey: (e: React.KeyboardEvent, b: ContentBlock) => void;
  onSlashKey: (e: React.KeyboardEvent) => void;
}) {
  const ref = (el: HTMLDivElement | null) => {
    registerRef(block.id, el);
    if (el && el.dataset.init !== "1") {
      el.innerHTML = mdToHtml(block.text ?? "", mode);
      el.dataset.init = "1";
    }
  };
  return (
    <div
      ref={ref}
      className={`bs-bc-edit ${className}`}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      data-ph={placeholder}
      data-block-id={block.id}
      data-mode={mode}
      onInput={(e) => onInput(e, block)}
      onKeyDown={(e) => {
        onSlashKey(e);
        if (!e.defaultPrevented) onKey(e, block);
      }}
    />
  );
}

function AttributionEditable({
  block,
  updateBlock,
}: {
  block: ContentBlock;
  updateBlock: (id: string, p: Partial<ContentBlock>) => void;
}) {
  const ref = (el: HTMLDivElement | null) => {
    if (el && el.dataset.init !== "1") {
      el.textContent = block.attribution ?? "";
      el.dataset.init = "1";
    }
  };
  return (
    <div
      ref={ref}
      className="bs-attrib"
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      onInput={(e) =>
        updateBlock(block.id, { attribution: (e.currentTarget as HTMLElement).textContent ?? "" })
      }
    />
  );
}

// ── List block (single list block, contentEditable items) ───────────
function ListBlock({
  block,
  updateBlock,
}: {
  block: ContentBlock;
  updateBlock: (id: string, p: Partial<ContentBlock>) => void;
}) {
  const items = block.items ?? [""];
  const ordered = !!block.ordered;
  const setItem = (i: number, v: string) => {
    const arr = [...items];
    arr[i] = v;
    updateBlock(block.id, { items: arr });
  };
  const addItem = (at: number) => {
    const arr = [...items];
    arr.splice(at + 1, 0, "");
    updateBlock(block.id, { items: arr });
  };
  const removeItem = (i: number) => {
    const arr = [...items];
    arr.splice(i, 1);
    updateBlock(block.id, { items: arr.length ? arr : [""] });
  };
  return (
    <div>
      <div className="bs-list-tools">
        <button
          className={!ordered ? "on" : ""}
          onClick={() => updateBlock(block.id, { ordered: false })}
        >
          • Bulleted
        </button>
        <button
          className={ordered ? "on" : ""}
          onClick={() => updateBlock(block.id, { ordered: true })}
        >
          1. Numbered
        </button>
      </div>
      {items.map((it, i) => (
        <div className="bs-li" key={i}>
          <span className="bs-li-mark">{ordered ? `${i + 1}.` : "•"}</span>
          <ListItem
            value={it}
            onChange={(v) => setItem(i, v)}
            onEnter={() => addItem(i)}
            onEmptyBackspace={() => {
              if (items.length > 1) removeItem(i);
            }}
          />
        </div>
      ))}
    </div>
  );
}
function ListItem({
  value,
  onChange,
  onEnter,
  onEmptyBackspace,
}: {
  value: string;
  onChange: (v: string) => void;
  onEnter: () => void;
  onEmptyBackspace: () => void;
}) {
  const ref = (el: HTMLDivElement | null) => {
    if (el && el.dataset.init !== "1") {
      el.textContent = value;
      el.dataset.init = "1";
    }
  };
  return (
    <div
      ref={ref}
      className="bs-li-text"
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      data-ph="List item…"
      onInput={(e) => onChange((e.currentTarget as HTMLElement).textContent ?? "")}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onEnter();
        } else if (e.key === "Backspace" && (e.currentTarget as HTMLElement).textContent === "") {
          e.preventDefault();
          onEmptyBackspace();
        }
      }}
    />
  );
}

// ── Image block ─────────────────────────────────────────────────────
function ImageBlock({
  block,
  updateBlock,
  uploadImg,
}: {
  block: ContentBlock;
  updateBlock: (id: string, p: Partial<ContentBlock>) => void;
  uploadImg: (f: File) => Promise<string | null>;
}) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const pick = () =>
    pickFile(false, async (f) => {
      setBusy(true);
      const u = await uploadImg(f[0]);
      setBusy(false);
      if (u) updateBlock(block.id, { url: u });
    });
  return (
    <div>
      <div className="bs-frame">
        {block.url ? (
          <>
            <img src={block.url} alt={block.alt ?? ""} />
            <div className="bs-imgtools">
              <button onClick={pick}>Replace</button>
              <button onClick={() => updateBlock(block.id, { url: "" })}>Remove</button>
            </div>
          </>
        ) : (
          <div className="bs-uz">
            <div className="bs-uprow">
              <button className="bs-upbtn" disabled={busy} onClick={pick}>
                {busy ? "Uploading…" : "Upload image"}
              </button>
              <span style={{ color: "var(--faint)", fontSize: 12 }}>or</span>
              <input
                className="bs-urlin"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="paste image URL"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && url.trim()) {
                    updateBlock(block.id, { url: url.trim() });
                    setUrl("");
                  }
                }}
              />
              <button
                className="bs-upbtn"
                onClick={() => {
                  if (url.trim()) {
                    updateBlock(block.id, { url: url.trim() });
                    setUrl("");
                  }
                }}
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>
      <input
        className="bs-cap"
        value={block.caption ?? ""}
        onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
        placeholder="Add a caption…"
      />
      <input
        className="bs-fieldin"
        style={{ marginTop: 6 }}
        value={block.alt ?? ""}
        onChange={(e) => updateBlock(block.id, { alt: e.target.value })}
        placeholder="Alt text for accessibility"
      />
    </div>
  );
}

// ── Image grid block ────────────────────────────────────────────────
function GridBlock({
  block,
  updateBlock,
  uploadImg,
}: {
  block: ContentBlock;
  updateBlock: (id: string, p: Partial<ContentBlock>) => void;
  uploadImg: (f: File) => Promise<string | null>;
}) {
  const images = block.images ?? [];
  const cols = block.columns ?? 2;
  const setImg = (i: number, patch: Partial<{ url: string; caption: string; alt: string }>) => {
    const arr = images.map((im, idx) => (idx === i ? { ...im, ...patch } : im));
    updateBlock(block.id, { images: arr });
  };
  const addImg = () =>
    updateBlock(block.id, { images: [...images, { url: "", caption: "", alt: "" }] });
  const delImg = (i: number) =>
    updateBlock(block.id, { images: images.filter((_, idx) => idx !== i) });
  const pick = (i: number) =>
    pickFile(false, async (f) => {
      const u = await uploadImg(f[0]);
      if (u) setImg(i, { url: u });
    });
  return (
    <div>
      <div className="bs-gal-head">
        <span className="bs-gal-lbl">
          Image grid · {images.length} image{images.length === 1 ? "" : "s"}
        </span>
        <div className="bs-cols">
          {([2, 3, 4] as const).map((c) => (
            <button
              key={c}
              className={cols === c ? "on" : ""}
              onClick={() => updateBlock(block.id, { columns: c })}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      {images.map((im, i) => (
        <div className="bs-galcell" key={i}>
          <div className="bs-rowbetween">
            <span style={{ fontSize: 12, color: "var(--muted)" }}>Image {i + 1}</span>
            {images.length > 1 && (
              <button className="bs-del" onClick={() => delImg(i)}>
                {Ic.x}
              </button>
            )}
          </div>
          {im.url && (
            <img src={im.url} alt="" style={{ width: "100%", borderRadius: 8, display: "block" }} />
          )}
          <UploadBtn
            label="Upload image"
            value={im.url}
            small
            onUpload={uploadImg}
            onDone={(u) => setImg(i, { url: u })}
          />
          <input
            className="bs-fieldin"
            value={im.caption ?? ""}
            onChange={(e) => setImg(i, { caption: e.target.value })}
            placeholder="Caption (optional)"
          />
          <input
            className="bs-fieldin"
            value={im.alt ?? ""}
            onChange={(e) => setImg(i, { alt: e.target.value })}
            placeholder="Alt text"
          />
        </div>
      ))}
      <button className="bs-addlink" onClick={addImg}>
        {Ic.plus} Add image
      </button>
    </div>
  );
}

// ── Custom HTML block ───────────────────────────────────────────────
function HtmlBlock({
  block,
  updateBlock,
}: {
  block: ContentBlock;
  updateBlock: (id: string, p: Partial<ContentBlock>) => void;
}) {
  const html = block.html ?? "";
  return (
    <div>
      <textarea
        className="bs-fieldin"
        style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12.5, minHeight: 120, resize: "vertical", lineHeight: 1.55 }}
        value={html}
        onChange={(e) => updateBlock(block.id, { html: e.target.value })}
        placeholder="<!-- Paste custom HTML or an embed snippet here -->"
        spellCheck={false}
      />
      {html.trim() ? (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--faint)", marginBottom: 6 }}>
            Live preview
          </div>
          {/* Inline (direct DOM) — same as how the live blog page renders it. */}
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      ) : (
        <p style={{ fontSize: 12, color: "var(--faint)", marginTop: 6 }}>
          Renders exactly as pasted on the live blog. Use for embeds (video, forms, iframes) or bespoke markup.
        </p>
      )}
    </div>
  );
}

function ytEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url.trim());
    let id = "";
    if (u.hostname === "youtu.be") id = u.pathname.slice(1);
    else if (u.pathname.startsWith("/shorts/")) id = u.pathname.split("/")[2] ?? "";
    else if (u.pathname.includes("/embed/")) id = u.pathname.split("/embed/")[1]?.split(/[/?#]/)[0] ?? "";
    else id = u.searchParams.get("v") ?? "";
    return id ? `https://www.youtube.com/embed/${id}?rel=0` : null;
  } catch {
    return null;
  }
}

function YouTubeBlock({
  block,
  updateBlock,
}: {
  block: ContentBlock;
  updateBlock: (id: string, p: Partial<ContentBlock>) => void;
}) {
  const url = block.url ?? "";
  const embed = url.trim() ? ytEmbedUrl(url) : null;
  return (
    <div>
      <input
        className="bs-fieldin"
        value={url}
        onChange={(e) => updateBlock(block.id, { url: e.target.value })}
        placeholder="Paste a YouTube link (youtube.com/watch?v=… , youtu.be/… , or /shorts/…)"
        spellCheck={false}
      />
      <input
        className="bs-fieldin"
        style={{ marginTop: 8 }}
        value={block.caption ?? ""}
        onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
        placeholder="Caption (optional)"
      />
      {url.trim() ? (
        embed ? (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--faint)", marginBottom: 6 }}>
              Live preview
            </div>
            <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", borderRadius: 10, overflow: "hidden", background: "#000" }}>
              <iframe
                src={embed}
                title="YouTube preview"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        ) : (
          <p style={{ fontSize: 12, color: "#dc2626", marginTop: 6 }}>
            That doesn’t look like a valid YouTube URL.
          </p>
        )
      ) : (
        <p style={{ fontSize: 12, color: "var(--faint)", marginTop: 6 }}>
          Renders as a responsive 16:9 embedded player on the live blog.
        </p>
      )}
    </div>
  );
}

function FaqBlock({
  block,
  updateBlock,
}: {
  block: ContentBlock;
  updateBlock: (id: string, p: Partial<ContentBlock>) => void;
}) {
  const faqItems = block.faqItems ?? [];
  const setItem = (i: number, patch: Partial<{ q: string; a: string }>) =>
    updateBlock(block.id, {
      faqItems: faqItems.map((f, idx) => (idx === i ? { ...f, ...patch } : f)),
    });
  return (
    <div>
      <input
        className="bs-fieldin"
        style={{ marginBottom: 8 }}
        value={block.text ?? ""}
        onChange={(e) => updateBlock(block.id, { text: e.target.value })}
        placeholder="Section title (e.g. Frequently Asked Questions)"
      />
      {faqItems.map((it, i) => (
        <div className="bs-faqcard" key={i}>
          <div className="bs-rowbetween">
            <span style={{ fontSize: 12, fontWeight: 500, color: "var(--muted)" }}>Q {i + 1}</span>
            <button
              className="bs-del"
              onClick={() =>
                updateBlock(block.id, { faqItems: faqItems.filter((_, idx) => idx !== i) })
              }
            >
              {Ic.x}
            </button>
          </div>
          <input
            className="bs-fieldin"
            value={it.q}
            onChange={(e) => setItem(i, { q: e.target.value })}
            placeholder="Question…"
          />
          <textarea
            className="bs-fieldin"
            style={{ resize: "vertical", minHeight: 60 }}
            value={it.a}
            onChange={(e) => setItem(i, { a: e.target.value })}
            placeholder="Answer…"
          />
        </div>
      ))}
      <button
        className="bs-addlink"
        onClick={() => updateBlock(block.id, { faqItems: [...faqItems, { q: "", a: "" }] })}
      >
        {Ic.plus} Add FAQ item
      </button>
    </div>
  );
}

// ── In-app preview (mirrors renderer markup) ────────────────────────
function inlineHtml(md: string | undefined): string {
  return mdToHtml(md ?? "", "paragraph");
}
function headingHtml(md: string | undefined): string {
  return mdToHtml(md ?? "", "heading");
}
function PreviewArticle({ form, blocks }: { form: Omit<BlogPost, "_id">; blocks: ContentBlock[] }) {
  return (
    <div className="bs-article">
      {form.category && <div className="k">{form.category}</div>}
      <h1>{form.title || "Untitled post"}</h1>
      {form.excerpt && <div className="s">{form.excerpt}</div>}
      <div className="bs-byline" style={{ border: "none", padding: "0 0 18px" }}>
        <div className="bs-av">{(form.author?.trim()[0] || "A").toUpperCase()}</div>
        <div>
          by <b style={{ color: "var(--ink-2)" }}>{form.author || "Author"}</b> ·{" "}
          {form.readTime || `${Math.max(1, Math.ceil(countWords(blocks) / 220))} min read`}
        </div>
      </div>
      {form.featuredImage && <img src={form.featuredImage} alt="" />}
      {blocks.map((b) => {
        switch (b.type) {
          case "paragraph":
            return <p key={b.id} dangerouslySetInnerHTML={{ __html: inlineHtml(b.text) }} />;
          case "heading2":
            return <h2 key={b.id} dangerouslySetInnerHTML={{ __html: headingHtml(b.text) }} />;
          case "heading3":
            return <h3 key={b.id} dangerouslySetInnerHTML={{ __html: headingHtml(b.text) }} />;
          case "quote":
            return (
              <blockquote key={b.id}>
                “{b.text}”
                {b.attribution && (
                  <cite
                    style={{
                      display: "block",
                      marginTop: 8,
                      fontSize: 13,
                      fontStyle: "normal",
                      color: "var(--muted)",
                    }}
                  >
                    {b.attribution}
                  </cite>
                )}
              </blockquote>
            );
          case "list": {
            const items = (b.items ?? []).filter(Boolean);
            return b.ordered ? (
              <ol key={b.id}>
                {items.map((it, i) => (
                  <li key={i}>{it}</li>
                ))}
              </ol>
            ) : (
              <ul key={b.id}>
                {items.map((it, i) => (
                  <li key={i}>{it}</li>
                ))}
              </ul>
            );
          }
          case "divider":
            return <hr key={b.id} />;
          case "image":
            return b.url ? (
              <figure key={b.id}>
                <img src={b.url} alt={b.alt ?? ""} />
                {b.caption && <figcaption>{b.caption}</figcaption>}
              </figure>
            ) : null;
          case "image-grid": {
            const imgs = (b.images ?? []).filter((i) => i.url);
            return imgs.length ? (
              <div
                key={b.id}
                className="bs-pvgrid"
                style={{ gridTemplateColumns: `repeat(${b.columns ?? 2},1fr)` }}
              >
                {imgs.map((im, i) => (
                  <img key={i} src={im.url} alt={im.alt ?? ""} />
                ))}
              </div>
            ) : null;
          }
          case "faq":
            return (b.faqItems ?? []).length ? (
              <div key={b.id}>
                {b.text && <h3>{b.text}</h3>}
                {(b.faqItems ?? []).map((f, i) => (
                  <div key={i} style={{ margin: "14px 0" }}>
                    <p style={{ fontWeight: 600, margin: "0 0 4px" }}>{f.q}</p>
                    <p style={{ margin: 0 }}>{f.a}</p>
                  </div>
                ))}
              </div>
            ) : null;
          case "html":
            return (b.html ?? "").trim() ? (
              <div key={b.id} dangerouslySetInnerHTML={{ __html: b.html as string }} />
            ) : null;
          default:
            return null;
        }
      })}
    </div>
  );
}

// ── Export (HTML / Markdown / JSON) ─────────────────────────────────
function mdInline(md: string | undefined): string {
  return md ?? "";
}
function exportDoc(
  form: Omit<BlogPost, "_id">,
  blocks: ContentBlock[],
  tagInput: string,
  kind: "html" | "md" | "json",
): string {
  if (kind === "json")
    return JSON.stringify(
      {
        ...form,
        tags: tagInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      },
      null,
      2,
    );
  if (kind === "md") {
    let md = "---\n";
    md += `title: ${JSON.stringify(form.title)}\nslug: ${form.slug}\ndescription: ${JSON.stringify(form.excerpt)}\nauthor: ${form.author ?? ""}\ntags: [${tagInput}]\n`;
    if (form.featuredImage) md += `cover: ${form.featuredImage}\n`;
    md += "---\n\n";
    blocks.forEach((b) => {
      switch (b.type) {
        case "paragraph":
          if ((b.text ?? "").trim()) md += mdInline(b.text) + "\n\n";
          break;
        case "heading2":
          md += "## " + mdInline(b.text) + "\n\n";
          break;
        case "heading3":
          md += "### " + mdInline(b.text) + "\n\n";
          break;
        case "quote":
          md += "> " + (b.text ?? "") + "\n\n";
          break;
        case "list":
          (b.items ?? []).forEach((it) => {
            md += (b.ordered ? "1. " : "- ") + it + "\n";
          });
          md += "\n";
          break;
        case "image":
          if (b.url) md += `![${b.caption ?? ""}](${b.url})\n\n`;
          break;
        case "image-grid":
          (b.images ?? []).forEach((im, i) => {
            if (im.url) md += `![${im.caption ?? "image " + (i + 1)}](${im.url})\n`;
          });
          md += "\n";
          break;
        case "faq":
          if (b.text) md += `**${b.text}**\n\n`;
          (b.faqItems ?? []).forEach((f) => {
            md += `**${f.q}**\n\n${f.a}\n\n`;
          });
          break;
        case "divider":
          md += "---\n\n";
          break;
        case "html":
          if ((b.html ?? "").trim()) md += (b.html as string) + "\n\n";
          break;
      }
    });
    return md.trim() + "\n";
  }
  // html
  let body = "";
  blocks.forEach((b) => {
    switch (b.type) {
      case "paragraph":
        if ((b.text ?? "").trim()) body += `  <p>${inlineHtml(b.text)}</p>\n`;
        break;
      case "heading2":
        body += `  <h2>${headingHtml(b.text)}</h2>\n`;
        break;
      case "heading3":
        body += `  <h3>${headingHtml(b.text)}</h3>\n`;
        break;
      case "quote":
        body += `  <blockquote>${escapeHtml(b.text ?? "")}</blockquote>\n`;
        break;
      case "list": {
        const t = b.ordered ? "ol" : "ul";
        body += `  <${t}>${(b.items ?? []).map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</${t}>\n`;
        break;
      }
      case "image":
        if (b.url)
          body += `  <figure><img src="${escapeAttr(b.url)}" alt="${escapeAttr(b.alt ?? "")}">${b.caption ? `<figcaption>${escapeHtml(b.caption)}</figcaption>` : ""}</figure>\n`;
        break;
      case "image-grid": {
        const imgs = (b.images ?? []).filter((i) => i.url);
        if (imgs.length)
          body += `  <div class="grid cols-${b.columns ?? 2}">${imgs.map((im) => `<img src="${escapeAttr(im.url)}" alt="${escapeAttr(im.alt ?? "")}">`).join("")}</div>\n`;
        break;
      }
      case "faq":
        body += `  <section>${b.text ? `<h3>${escapeHtml(b.text)}</h3>` : ""}${(b.faqItems ?? []).map((f) => `<p><b>${escapeHtml(f.q)}</b></p><p>${escapeHtml(f.a)}</p>`).join("")}</section>\n`;
        break;
      case "divider":
        body += "  <hr>\n";
        break;
      case "html":
        if ((b.html ?? "").trim()) body += `  ${b.html}\n`;
        break;
    }
  });
  return `<article>\n${form.featuredImage ? `  <img class="cover" src="${escapeAttr(form.featuredImage)}" alt="">\n` : ""}  <h1>${escapeHtml(form.title)}</h1>\n${form.excerpt ? `  <p class="excerpt">${escapeHtml(form.excerpt)}</p>\n` : ""}${body}</article>`;
}
