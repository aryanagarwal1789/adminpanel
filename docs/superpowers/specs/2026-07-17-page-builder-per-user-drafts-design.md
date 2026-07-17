# Page Builder — Per-User Drafts, Presence & Rebase-on-Publish

- **Date:** 2026-07-17
- **Status:** Design (approved in brainstorming, pending spec review)
- **Repos touched:** `adminpanel` (frontend), `salescodemarketplace` (backend) — additive only
- **Branch:** `feature/nocode-builder-v2-design`

## 1. Problem

The no-code page builder ([`PageBuilder.tsx`](../../../src/components/builder/PageBuilder.tsx)) keeps all edits in an in-memory undo/redo stack. Nothing persists until the user clicks **Publish**, which does `PUT ${BACKEND}/site/builder/pages/:pageKey` with `{ blocks, theme }` and overwrites the live page directly.

Consequences today:
- Two people editing the same page can't see each other. Last Publish silently clobbers the other's work.
- A refresh or crash loses all in-progress edits.
- There is no notion of "whose draft is this" — the frontend sends no identity, and the builder routes are unauthenticated.

## 2. Goals

1. **No lost work** — every editor's in-progress edits are auto-saved to their own private draft.
2. **Isolation** — one draft slot per **(user, page)**; drafts never clobber each other.
3. **Presence** — a banner shows who else has a draft on this page and how long ago they last edited.
4. **Safe convergence on Publish** — publishing never silently overwrites; conflicting editors are rebased onto the latest, never forced to lose work.

## 3. Non-goals (YAGNI)

- Real-time collaborative editing (CRDT / OT). Drafts are per-user snapshots, not live shared cursors.
- WebSockets. Presence and publish-detection use polling.
- One global draft per user across all pages. Drafts are per (user, page).
- A hard edit-lock. The existing soft-lock stays available but is **not** the mechanism (isolation + rebase is).
- Block-content field-level 3-way *text* merge. The merge is block-level (per stable block `id`) + theme field-level, with a deterministic "mine wins" default and a review/undo UI.

## 4. Decisions locked during brainstorming

| Decision | Choice |
|---|---|
| Core outcome | Isolation + no lost work, plus presence |
| Draft storage | New `BuilderDraft` Mongo collection, keyed by `(pageKey, ownerId)` |
| User identity | Reuse the **already-wired** SSO in the adminpanel (`getAuth()` / `getAppToken()`); backend derives a trusted owner from the JWT |
| Publish vs others' drafts | Never blocks; other editors get an actionable pull-and-rebase prompt |
| Conflict resolution | Block-level 3-way rebase; default **mine wins**; review + per-change undo/reapply |
| Delivery | Phase 1 (drafts + presence + simple 409 choice), then Phase 2 (rebase engine + review UI, powering both triggers) |

## 5. Identity model

Identity already exists and requires **no new auth work**:

- [`src/lib/auth.ts`](../../../src/lib/auth.ts) implements Google SSO → `dev-auth.salescode.ai` → `exchangeSso()` → marketplace `POST /auth/exchange-sso`, which enforces **`@salescode.ai` + PortalUser allowlist** and returns an app JWT `{ userId, email, role }`.
- [`__root.tsx`](../../../src/routes/__root.tsx) already gates the whole app (unauth → `/login`).
- `getAuth()` → `{ userId, email, role, token }`; `getAppToken()` → the Bearer JWT.

**Draft owner = the JWT's `userId`** (with `email` for display). The frontend sends `Authorization: Bearer <appToken>`; the backend verifies with `jwt.verify(token, JWT_SECRET_KEY)` — the same mechanism already used by `configUpdateAuth`'s `developer` branch — and reads the owner from the verified payload. **Owner is never taken from the request body.**

### Interim caveat (must be documented in code)

A temporary hardcoded login (`loginWithCredentials`, `admin` / `PageCraft@2026`) issues `email: admin@salescode.ai`, `token: "local-dev"`. `"local-dev"` is not a valid JWT.

- Backend guard: verify the JWT when present and valid → trusted owner. When the token is `"local-dev"` (or otherwise unverifiable), **fall back** to a client-supplied `ownerId` (from `getAuth().userId`, which is `admin` for the hardcoded path).
- This keeps the feature working today and is **no regression** — the builder routes are fully unauthenticated at present.
- **Limitation:** while everyone logs in via the hardcoded path they share the `admin` identity and therefore share one draft. Per-user drafts become truly per-person once Google SSO is the enforced login. This is expected, not a bug.

## 6. Data model — `BuilderDraft`

New collection in `salescodemarketplace` (mirrors [`builderPage.ts`](../../../../salescodemarketplace/src/models/builderPage.ts) block/theme shapes):

```ts
interface IBuilderDraft {
  pageKey: string;            // which page this draft is for
  ownerId: string;            // trusted owner (JWT userId; interim: client ownerId)
  ownerEmail: string;         // for display in presence
  ownerName: string;          // display name (SSO name or email local-part)

  blocks: IBuilderBlock[];    // my current editor state
  theme: IBuilderTheme;

  // Base snapshot — the published content this draft branched from.
  // Immutable for the life of the draft; only a rebase ("save as draft")
  // or a publish/discard resets it. Required for a clean 3-way merge.
  baseBlocks: IBuilderBlock[];
  baseTheme: IBuilderTheme;
  basePageUpdatedAt: Date;    // page.updatedAt at branch time

  createdAt: Date;            // timestamps: true
  updatedAt: Date;
}
```

- Unique compound index `{ pageKey: 1, ownerId: 1 }` → enforces "one draft per user per page."
- Index `{ pageKey: 1, updatedAt: -1 }` → efficient presence listing.
- The published `BuilderPage` document and its GET route are **untouched** — the renderer keeps reading published content exactly as today.

## 7. Backend API (`salescodemarketplace`, `BuilderPagesController` @ `/site/builder`)

All new routes are JWT-verified (§5). GET of the published page stays public (renderer needs it).

| Method | Path | Purpose |
|---|---|---|
| `PUT` | `/pages/:pageKey/draft` | Upsert my draft (autosave). Body `{ blocks, theme, base? }`. Owner from token. `base` (baseBlocks/baseTheme/basePageUpdatedAt) is set only on **first** save of a new draft. Returns `{ draft: { updatedAt } }`. |
| `GET` | `/pages/:pageKey/draft` | Get **my** draft (restore-on-open). Returns `{ draft \| null }`. |
| `DELETE` | `/pages/:pageKey/draft` | Discard my draft. |
| `GET` | `/pages/:pageKey/drafts` | **Presence + head.** Returns `{ page: { updatedAt, lastUpdatedBy }, drafts: [{ ownerId, ownerName, ownerEmail, updatedAt, isMe }] }`. Metadata only — no blocks. |
| `POST` | `/pages/:pageKey/rebase-save` | Re-baseline my draft onto the latest published version (used by the proactive "someone republished" flow). Body = the merged `{ blocks, theme }`. Sets `baseBlocks/baseTheme ← current published`, `basePageUpdatedAt ← current page.updatedAt`, `blocks/theme ← merged`. Returns updated draft. |

**Publish** — extend the existing `PUT /pages/:pageKey`:
- Require the JWT guard.
- Continue to accept `editorId / editorName / lastKnownUpdatedAt` (already implemented: 409 on stale base, 423 on lock).
- **On success, delete only the caller's own draft.** Other editors' drafts survive (they will be rebased via §9).

The existing soft-lock endpoints (`POST /pages/:pageKey/lock` and `/unlock`) are left in place but unused by this feature.

## 8. Frontend behavior (`adminpanel`, `PageBuilder.tsx`)

Identity: `const auth = getAuth()` → `ownerId = auth.userId`, `ownerName = auth.email` (local-part for display); Bearer via `getAppToken()`. All builder API calls in this feature send `Authorization: Bearer <token>`.

- **Autosave** — debounce ~2s after the last blocks/theme change → `PUT …/draft`. Also flush on page-switch and on `beforeunload` (keepalive fetch). Status chip in the header: `Saving… / Saved · 2m ago / Unsaved changes` (last on failure).
- **Restore on open** — after bootstrap loads the published page, `GET …/draft`. If a draft exists, load it into the editor and show: *"Restored your draft (saved 2m ago) · [Use published instead]"*. "Use published instead" discards the draft and loads published content.
- **Presence banner (top)** — `GET …/drafts` on open + poll every ~25s. Renders: *"You have a draft · saved 2m ago"* and *"Also drafting: Priya (5m), Sam (just now)"*. Turns amber when others are present. Informational, not blocking.
- **Publish** — sends `{ blocks, theme, editorId: ownerId, editorName: ownerName, lastKnownUpdatedAt }`. On success → toast, clear my draft, refresh presence. On **409/423** → the conflict flow (§9).

## 9. Conflict & rebase model

The merge is a single pure function reused by both triggers:

```
merge(base, theirs, mine) -> { merged, changes[] }
```

Computed per block `id` and per theme field:

| Situation | Rule |
|---|---|
| Block I **added** (id not in base) | insert into theirs |
| Block I **removed** (in base, not in mine) | remove from theirs if still present |
| Block I **edited** (fields/style/hidden changed vs base) | apply my version; if theirs also edited it since base → **conflict**, default **mine wins**, flagged |
| **Order** changed | theirs' order is the base; my moved blocks are re-placed to my positions |
| **Theme** field | field-level; if both changed the same field since base → conflict, mine wins, flagged |

`changes[]` records each applied delta with **origin** (`mine` / `theirs` / `conflict`) and **location** (block `id` + index). This drives the review UI.

**Deterministic edge-case rules (surfaced as conflicts, never silent):**
- I edited a block **they deleted** → conflict: *re-add mine* or *drop it*.
- Both added new blocks → keep both; deterministic ordering (stable sort by intended index, then by owner id as tiebreak).
- Both reordered the same block → mine wins.

### Trigger A — reactive (I publish onto a moved page → 409)

1. My draft is already safe (autosaved). Say so — no data-loss panic.
2. Fetch the current published page (theirs).
3. `merge(myDraft.base, theirs, myDraft.blocks/theme)` → merged + changes.
4. Show the **merge-review UI** (§10). Terminal action = **Publish**: re-PUT with a refreshed `lastKnownUpdatedAt`, banner *"We applied your changes on top of the latest (published by X, 3m ago)."* On success, my draft is deleted.

### Trigger B — proactive (someone else publishes while I'm editing)

1. The presence poll returns the page head (`page.updatedAt`, `lastUpdatedBy`). When `publishedUpdatedAt` advances past my draft's `basePageUpdatedAt`, a publish happened.
2. **Non-blocking banner** (does not interrupt editing): *"Priya just published new changes to this page. Your draft is based on an older version. [Pull latest & apply my draft] · [Keep editing]"*.
3. **Pull latest & apply my draft** → same `merge()` → same review UI. Terminal action = **Save as draft** (`POST …/rebase-save`): re-baselines my draft (`base ← latest`, `blocks/theme ← merged`, `basePageUpdatedAt ← latest`). I stay in draft mode; my next Publish won't 409 (unless another publish lands).
4. If I ignore the banner and keep editing, Trigger A is the backstop on my next Publish.

Both triggers share the merge function and review UI; **only the terminal button differs** (Publish vs Save as draft).

## 10. Merge-review UI (Phase 2)

Entered from either trigger. Shows the merged page in the builder preview plus a review panel:
- **What changed & where** — two grouped lists: *From latest (Priya)* and *Applied from your draft*, each item located by block ("edited Hero", "added Testimonials at #3", "removed Footer CTA").
- **Per-change undo / reapply** — each *mine* delta has a toggle. Toggling off re-runs `merge()` without that delta and re-renders; toggle on to reapply. Lets the user drop only the pieces they don't want.
- **Conflicts** — flagged items default to mine; a control flips a conflict to theirs.
- **Terminal action** — Publish (Trigger A) or Save as draft (Trigger B).

## 11. Error handling

- Autosave failure (offline/5xx) → retry with backoff; chip shows `Unsaved changes`; a final flush is attempted on `beforeunload`.
- `401 / 403` (expired/invalid session) → route to `/login` (reuse existing guard); local unsaved state preserved in memory where possible.
- `409` on publish → merge-review flow (§9 A), never silent overwrite.
- `423` (locked, if a lock is ever held) → surface holder + expiry; offer merge-review once free.
- Presence-poll failure → fail silent; banner simply goes stale until the next successful poll.

## 12. Phasing

**Phase 1 — safety net (ships first):**
- `BuilderDraft` model + `PUT/GET/DELETE …/draft` + `GET …/drafts` (with head) + JWT guard (with interim fallback).
- Frontend: autosave, restore-on-open, presence banner, auth'd publish.
- Simple 409 handling: **overwrite / take-latest** dialog (no merge yet).

**Phase 2 — rebase engine:**
- `merge(base, theirs, mine)` pure function + `changes[]`.
- Merge-review UI.
- `POST …/rebase-save`.
- Wire both triggers (409 reactive → Publish; proactive republished banner → Save as draft), replacing the Phase 1 simple 409 dialog.

## 13. Testing

**Backend (`salescodemarketplace`):**
- Draft upsert/get/delete; unique-index enforcement (one draft per user+page).
- Presence list shape + `isMe` flag + head (`updatedAt`, `lastUpdatedBy`).
- Publish deletes only the caller's draft; others survive.
- JWT owner derivation; interim `"local-dev"` fallback to client `ownerId`.
- `rebase-save` re-baselines base + updatedAt correctly.

**Frontend (`adminpanel`):**
- Autosave debounce + flush on page-switch/unload.
- Restore-on-open, and "Use published instead".
- Presence rendering (self vs others; amber when others present).
- Phase 2: `merge()` unit tests (add/remove/edit/reorder/theme/conflicts + edge rules); per-change undo/reapply re-computes; both terminal actions.
- 409 handling (Phase 1 dialog; Phase 2 review).

## 14. Open questions / future

- **Draft TTL / cleanup** — should abandoned drafts expire (e.g., 30-day TTL index)? Deferred; not required for correctness.
- **Enforcing SSO** — removing the hardcoded login (once the SSO origin allowlist covers the admin panel) makes drafts truly per-person and lets the backend drop the interim `ownerId` fallback.
- **Presence liveness** — presence currently means "has a draft," not "actively viewing." A `lastSeenAt` heartbeat could distinguish active editors later.
