# Rich Text — marketing-site (Salescode-self-serve) handoff

The admin panel now emits **rich text as a TipTap/ProseMirror JSON doc** for the
`rich-heading` and `rich-paragraph` widgets. The live marketing site must be updated to
render this format, or those two widget types will break once an editor saves them.

## What changed in adminpanel
- New field UI: `src/components/builder/RichTextInput.tsx` (TipTap editor + toolbar).
- New format + renderer: `src/components/builder/rich-text.tsx` — **dependency-free, copy this file into the marketing repo verbatim.**
- `Block.fields.text` for `rich-heading` / `rich-paragraph` is now either:
  - a **legacy string** (old content, incl. `**word**` accent) — still supported, OR
  - a **`RichDoc` JSON object** (new content).

## ⚠️ Breaking risk — act before enabling in production
The marketing site currently reads `text` as a **string** and runs its own `**word**` parser.
The moment an editor edits a `rich-heading`/`rich-paragraph` in the new UI, `text` becomes a
JSON object. A string parser will render `[object Object]`.

**Fix:** in the marketing repo, replace the string render of these two widgets with:

```tsx
import { renderRichText } from "./rich-text"; // copied file

// heading (inline, no <p> wrapper):
<h2 style={...}>{renderRichText(block.fields.text, { accentColor, inline: true })}</h2>

// paragraph (block content — paragraphs, lists, breaks):
<div className="rte">{renderRichText(block.fields.text, { accentColor })}</div>
```

`renderRichText` accepts **both** legacy strings and the new JSON, so you can deploy it first
(safe for existing string content) and the admin change second.

## Format reference
See `rich-text.tsx` types (`RichDoc`, `RichNode`, `RichMark`). Marks supported:
`bold`, `italic`, `underline`, `strike`, and `textStyle` with `{ color, fontFamily, fontSize }`.
Blocks: `paragraph`, `heading`, `bulletList`/`orderedList`+`listItem`, `hardBreak`.

## List CSS
`renderRichText` outputs plain `<ul>/<ol>/<p>`. Add list-style CSS on the marketing side
(Tailwind resets strip it) — see `.pb-rte-render` rules in `WidgetPreviews.tsx` for reference.

## Coverage (both repos)
- **Top-level slick fields** — 1,241 (headings, subtext, single fields, stat values, split-groups).
- **Array/repeater-item fields** — 550 in ContentEditor + 16 in widgets (testimonials, features, FAQ, list items…), bound via `richItemProps(item, key, update)` → `${key}Rich` on the item.
- **Page-builder widgets** — 38 single fields; previews render rich centrally via `WidgetRenderer`
  (`resolveRichFields(widget.props)`) + a rich-aware `str()` in `WidgetPreviews.tsx` (both repos).
- **`resolveRichFields` is recursive** — resolves `${base}Rich` at every object level incl. inside
  arrays, so nested item fields render.
- Excluded (stay plain, correct): URLs/hrefs, alt text, icon/emoji, colors, `styleVars`, media, and
  array-container fields.

## Marketing renderer — DONE (Salescode-self-serve)
Wired centrally, not per-component:
- Copied `rich-text.tsx` → `Salescode-self-serve/src/lib/rich-text.tsx`.
- `src/lib/BlockRenderer.tsx`: `const f = resolveRichFields(block.fields ...)` at the one choke
  point (line ~512) that feeds all 272 `slick-*` components.
- `resolveRichFields` replaces any `${key}Rich` doc with a rendered React node on the **same `key`**
  (no regrouping / no sibling-blanking). Split fields stay independent, so components that style a
  segment specially (gradient span, `<br/>`, badge) keep working. **Inert when no `*Rich` field
  exists**, so all existing content renders exactly as before.
- Verified: `tsc` clean for the changed files (pre-existing repo errors unrelated).

### Residual risks (marketing side)
- Components that do string ops on a field (`.replace`, template `${x}`) will break IF that
  field gets rich content (rare; e.g. `AbHero` sub.replace). Fix those per-component if hit.
- `resolveRichFields` renders **inline** (safe inside `<h*>/<p>`), so lists inside an injected
  field won't show `<ul>` structure. Fine for headings/short text.
- Accent that was a hardcoded gradient span becomes solid inline color (editor now controls it).
- **Not visually QA'd** — needs the app running.

## Rollout order
1. Marketing repo change above → deploy (safe: inert for current content).
2. Admin repo (this change): live-safe; editors use rich text; formatting shows once step 1 ships.

---

# Split-field migration (`slick-*` blocks) — 243 groups

The `slick-*` block editors in `ContentEditor.tsx` used to split one line into
`headingPre` + `headingAccent` + `headingSuffix` (etc.) because there was no inline
styling. **243 such groups across the block types are now a single `RichFieldGroup`.**

Recognized segment-name vocabulary (after stripping the base):
- **accent/highlighted:** `Bold`,`Bold1/2/3`,`Accent`,`Accent2`,`Grad`,`Grad1/2`,`Gradient`,`Highlight`,`Hl`,`Mid`,`Teal`,`Badge`,`Em`
- **plain/wrapper:** `` (plain base),`Pre`,`Pre2`,`Prefix`,`Normal`,`White`,`Tail`,`Suffix`,`Post`,`LastLine`,`Rest`,`Line1/2/3`,`Part1/2`,`Start`,`End`,`Lead`

### How it stores
- Each merged group writes rich JSON to a **new key `${base}Rich`** (e.g. `headingRich`, `subRich`).
- **Legacy keys are left untouched** and are NOT overwritten.
- The rich value is **seeded** from the legacy parts (accent segment → bold + accent color,
  derived from `f.accentColor` / `styleVars['--accent']` / default teal) but **only persisted
  when an editor actually edits the field.** Untouched content stays legacy-only.

### Marketing repo render change (per merged group)
Use `pickGroupRich` (in `rich-text.tsx`): render `${base}Rich` if present, else compose the
legacy parts. This is safe for existing content (renders identically to before) and future-proof:

```tsx
import { renderRichText, pickGroupRich } from "./rich-text";

// e.g. a heading previously rendered as headingPre + <accent>headingAccent</accent> + headingSuffix:
const doc = pickGroupRich(f.headingRich, [
  { text: f.headingPre ?? "" },
  { text: f.headingAccent ?? "", accent: true },
  { text: f.headingSuffix ?? "" },
], accentColorForThisBlock);

<h2>{renderRichText(doc, { inline: true })}</h2>
```

The segment list + accent flags per block match what the admin writes — see the
`<RichFieldGroup ... segments={[...]}/>` calls in `ContentEditor.tsx` for the exact mapping.

### ⚠️ ~64 split inputs were intentionally NOT merged
The codemod was conservative. Left untouched (still individual inputs) because they were
non-contiguous (interrupted by other JSX) or lacked a clear accent middle:
- Non-contiguous `body*` / `sub*` triplets: `slick-da-split`, `slick-pe-darkpanel`,
  `slick-rs-split`, `slick-sv-darkpanel`, `slick-sv-split`, `slick-sn-darkcard`,
  `slick-su-engine`, `slick-scai-vision-hero`.
- `headingPre + headingSuffix` with no middle (unknown what sits between): e.g.
  `slick-sc-integrations`, `slick-sc-brand-strip`, `slick-sc-saudi-presence`.
- Various lone `*Highlight` / `*Bold` accents without an adjacent plain lead.

These need manual conversion (decide the middle content/order) — see
`scratchpad/analysis.txt` for the full flagged list.

### Verification done in admin repo
`tsc` (no new errors) + `npm run build` (client + SSR) both pass.
**Not done:** live visual QA of the editor forms — needs the running app + backend auth.
