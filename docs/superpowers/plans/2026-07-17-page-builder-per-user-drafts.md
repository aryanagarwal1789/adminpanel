# Page Builder — Per-User Drafts, Presence & Rebase-on-Publish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the no-code page builder one auto-saved draft per (user, page) with a presence banner and a block-level 3-way rebase so concurrent editors never clobber each other.

**Architecture:** Frontend (`adminpanel`, TanStack Start + React 19) auto-saves editor state to a new backend draft store; backend (`salescodemarketplace`, Express + Mongoose, decorator routing) stores one `BuilderDraft` per `(pageKey, ownerId)` separate from the published `BuilderPage`. Publishing promotes a draft to the live page and deletes only the caller's own draft; conflicting editors are reconciled with a pure `merge(base, theirs, mine)` function that powers both publish-time (409) and proactive ("someone republished") flows.

**Tech Stack:** React 19, TanStack Router/Start, Vite, TypeScript, Express 4, Mongoose, reflect-metadata route decorators. Vitest is added to `adminpanel` **only** for the pure merge module.

## Global Constraints

- **Spec:** `docs/superpowers/specs/2026-07-17-page-builder-per-user-drafts-design.md` — the authority. Every task implicitly includes it.
- **Additive only.** Do not change the published `BuilderPage` document shape's existing fields, its `GET` route, or the renderer contract. New backend routes hang off the existing `BuilderPagesController` (base `/site/builder`); they auto-register via `@Route` — no `server.ts` edit.
- **Identity is client-supplied (SSO hardening deferred, spec §5).** The frontend derives `{ ownerId, ownerEmail, ownerName }` from `getAuth()` and sends them; the backend trusts them and never verifies a JWT. Owner is keyed on `getAuth().userId`.
- **One draft per (user, page).** Enforced by a unique compound index `{ pageKey: 1, ownerId: 1 }`.
- **No test runner exists in either repo** (`adminpanel` has no `test` script; `salescodemarketplace` `test` is a stub). Follow that convention: add automated tests **only** for the pure `src/components/builder/merge.ts` module (Task 11, via Vitest). All other tasks verify with `npx tsc --noEmit` (typecheck) + `curl` (backend routes) + browser (UI), with exact commands and expected output given per step.
- **Local ports:** marketplace backend runs on `http://localhost:3002` (adminpanel `.env` `VITE_MARKETPLACE_URL`); adminpanel dev server is Vite's default `http://localhost:8080` or `:5173` (whatever `vite dev` prints). Backend needs MongoDB reachable via its `.env` `MONGO_CONNECTION` and must be started with `SERVER_PORT=3002`.
- **Merge default is "mine wins"** on any conflict; conflicts are flagged in `changes[]`, never silently dropped.
- **Commits:** one per task step as written. Work on a feature branch in each repo (`adminpanel` is already on `feature/nocode-builder-v2-design`; in the marketplace repo create/checkout `feature/builder-per-user-drafts` before Task 1).

## File Structure

**Backend — `/Users/salescode/Desktop/Work/salescodemarketplace`:**
- Create `src/models/builderDraft.ts` — `BuilderDraftModel` + `IBuilderDraft` (Task 1).
- Modify `src/controller/builderPagesController.ts` — add draft CRUD, presence, rebase-save routes; make publish delete the caller's draft (Tasks 2–4, 12).

**Frontend — `/Users/salescode/Desktop/Work/adminpanel`:**
- Create `src/lib/builder-drafts.ts` — identity helper + draft API client (Task 5).
- Create `src/components/builder/useDraftAutosave.ts` — debounced autosave hook + save status (Task 6).
- Create `src/components/builder/PresenceBanner.tsx` — presence + republished banner (Tasks 8, 15).
- Create `src/components/builder/merge.ts` — pure 3-way merge (Task 11) + `src/components/builder/merge.test.ts`.
- Create `src/components/builder/MergeReviewModal.tsx` — review UI (Task 13).
- Modify `src/components/builder/PageBuilder.tsx` — wire identity, autosave, restore, presence, publish + conflict flows (Tasks 6, 7, 8, 9, 14, 15).
- Modify `package.json` + create `vitest.config.ts` — Vitest for merge only (Task 10).

Data shapes (used across tasks):

```ts
// blocks/theme already defined in adminpanel src/components/builder/types.ts as Block, Theme.
// Block has: id: string; type: string; fields: Record<string,unknown>; style: Record<string,unknown>; order: number; hidden?: boolean

// Draft API DTOs (src/lib/builder-drafts.ts)
export interface EditorIdentity { ownerId: string; ownerEmail: string; ownerName: string; }
export interface DraftDto {
  pageKey: string; ownerId: string; ownerEmail: string; ownerName: string;
  blocks: Block[]; theme: Theme;
  baseBlocks: Block[]; baseTheme: Theme; basePageUpdatedAt: string | null;
  updatedAt: string;
}
export interface PresenceEntry { ownerId: string; ownerName: string; ownerEmail: string; updatedAt: string; isMe: boolean; }
export interface DraftsResponse { page: { updatedAt: string | null; lastUpdatedBy?: string }; drafts: PresenceEntry[]; }

// Merge (src/components/builder/merge.ts)
export type ChangeOrigin = 'mine' | 'theirs' | 'conflict';
export type ChangeKind = 'add' | 'remove' | 'edit' | 'reorder' | 'theme';
export interface MergeChange { id: string; origin: ChangeOrigin; kind: ChangeKind; blockId?: string; field?: string; index?: number; label: string; }
export interface MergeResult { mergedBlocks: Block[]; mergedTheme: Theme; changes: MergeChange[]; }
```

---

## PHASE 1 — Safety net (drafts + presence + autosave/restore + simple 409)

### Task 1: Backend — `BuilderDraft` model

**Files:**
- Create: `/Users/salescode/Desktop/Work/salescodemarketplace/src/models/builderDraft.ts`

**Interfaces:**
- Produces: `BuilderDraftModel` (Mongoose model), `IBuilderDraft` interface. Consumed by all backend tasks.

- [ ] **Step 1: Create the model file**

```ts
import { Document, model, Schema } from 'mongoose';
import { IBuilderBlock, IBuilderTheme } from './builderPage';

export interface IBuilderDraft extends Document {
  pageKey: string;
  ownerId: string;
  ownerEmail: string;
  ownerName: string;
  blocks: IBuilderBlock[];
  theme: IBuilderTheme;
  // Base snapshot: the published content this draft branched from. Immutable
  // for the life of the draft; reset only by rebase-save or publish/discard.
  baseBlocks: IBuilderBlock[];
  baseTheme: IBuilderTheme;
  basePageUpdatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MixedBlockArray = { type: Schema.Types.Mixed, default: [] as unknown[] };

const BuilderDraftSchema = new Schema<IBuilderDraft>(
  {
    pageKey:   { type: String, required: true, index: true },
    ownerId:   { type: String, required: true },
    ownerEmail:{ type: String, default: '' },
    ownerName: { type: String, default: '' },
    blocks:    MixedBlockArray,
    theme:     { type: Schema.Types.Mixed, default: () => ({}) },
    baseBlocks:MixedBlockArray,
    baseTheme: { type: Schema.Types.Mixed, default: () => ({}) },
    basePageUpdatedAt: { type: Date },
  },
  { timestamps: true, versionKey: false, minimize: false }
);

// One draft per user per page.
BuilderDraftSchema.index({ pageKey: 1, ownerId: 1 }, { unique: true });
// Fast presence listing (most-recent first).
BuilderDraftSchema.index({ pageKey: 1, updatedAt: -1 });

export const BuilderDraftModel = model<IBuilderDraft>('BuilderDraft', BuilderDraftSchema);
```

> Note: `blocks`/`baseBlocks` use `Schema.Types.Mixed` (not the strict `BuilderBlockSchema`) so drafts store whatever block shape the editor holds mid-edit without validation friction. This mirrors how the editor keeps blocks in memory.

- [ ] **Step 2: Typecheck**

Run: `cd /Users/salescode/Desktop/Work/salescodemarketplace && npx tsc --noEmit`
Expected: exit 0, no errors referencing `builderDraft.ts`.

- [ ] **Step 3: Commit**

```bash
cd /Users/salescode/Desktop/Work/salescodemarketplace
git checkout -b feature/builder-per-user-drafts 2>/dev/null || git checkout feature/builder-per-user-drafts
git add src/models/builderDraft.ts
git commit -m "feat(builder): add BuilderDraft model (one draft per user+page)"
```

---

### Task 2: Backend — draft CRUD routes (`PUT`/`GET`/`DELETE /pages/:pageKey/draft`)

**Files:**
- Modify: `/Users/salescode/Desktop/Work/salescodemarketplace/src/controller/builderPagesController.ts`

**Interfaces:**
- Consumes: `BuilderDraftModel`, `isValidPageKey` (already in the controller).
- Produces routes: `PUT /site/builder/pages/:pageKey/draft`, `GET …/draft`, `DELETE …/draft`.

- [ ] **Step 1: Import the model**

At the top of `builderPagesController.ts`, add after the existing `BuilderPageModel` import:

```ts
import { BuilderDraftModel } from '../models/builderDraft';
```

- [ ] **Step 2: Add the three draft methods**

Insert these methods inside the `BuilderPagesController` class, immediately after the `deletePage` method:

```ts
  // --- Per-user drafts ---------------------------------------------------

  // Upsert MY draft (autosave). Owner is client-supplied (SSO hardening
  // deferred). `base` is written only when the draft is first created.
  @Route('put', '/pages/:pageKey/draft')
  async putDraft(req: Request, res: Response, _next: NextFunction) {
    try {
      const { pageKey } = req.params;
      if (!isValidPageKey(pageKey)) return res.status(400).json({ error: 'Invalid page key' });
      const { ownerId, ownerEmail, ownerName, blocks, theme, base } = req.body as {
        ownerId?: string; ownerEmail?: string; ownerName?: string;
        blocks?: unknown[]; theme?: unknown;
        base?: { blocks?: unknown[]; theme?: unknown; pageUpdatedAt?: string };
      };
      if (!ownerId) return res.status(400).json({ error: 'ownerId required' });

      const set: Record<string, unknown> = {
        ownerEmail: ownerEmail ?? '',
        ownerName: ownerName ?? '',
      };
      if (blocks !== undefined) set.blocks = blocks;
      if (theme !== undefined) set.theme = theme;

      const setOnInsert: Record<string, unknown> = {
        baseBlocks: base?.blocks ?? [],
        baseTheme: base?.theme ?? {},
        basePageUpdatedAt: base?.pageUpdatedAt ? new Date(base.pageUpdatedAt) : undefined,
      };

      const draft = await BuilderDraftModel.findOneAndUpdate(
        { pageKey, ownerId },
        { $set: set, $setOnInsert: setOnInsert },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).lean();

      return res.status(200).json({ draft });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // Get MY draft (restore-on-open). ownerId via query string.
  @Route('get', '/pages/:pageKey/draft')
  async getDraft(req: Request, res: Response, _next: NextFunction) {
    try {
      const { pageKey } = req.params;
      const ownerId = (req.query.ownerId as string | undefined)?.trim();
      if (!isValidPageKey(pageKey)) return res.status(400).json({ error: 'Invalid page key' });
      if (!ownerId) return res.status(400).json({ error: 'ownerId required' });
      const draft = await BuilderDraftModel.findOne({ pageKey, ownerId }).lean();
      return res.status(200).json({ draft: draft ?? null });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // Discard MY draft.
  @Route('delete', '/pages/:pageKey/draft')
  async deleteDraft(req: Request, res: Response, _next: NextFunction) {
    try {
      const { pageKey } = req.params;
      const ownerId = (req.body?.ownerId ?? req.query.ownerId) as string | undefined;
      if (!isValidPageKey(pageKey)) return res.status(400).json({ error: 'Invalid page key' });
      if (!ownerId) return res.status(400).json({ error: 'ownerId required' });
      await BuilderDraftModel.deleteOne({ pageKey, ownerId });
      return res.status(200).json({ ok: true });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
```

- [ ] **Step 3: Typecheck**

Run: `cd /Users/salescode/Desktop/Work/salescodemarketplace && npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 4: Verify against a running server**

Start the backend (separate terminal; requires Mongo reachable via `.env`):
`cd /Users/salescode/Desktop/Work/salescodemarketplace && SERVER_PORT=3002 npm run dev`
Wait for `Server Started: localhost:3002` and `Loading route: put /site/builder/pages/:pageKey/draft` in the log.

Then:

```bash
# Create/upsert a draft
curl -s -X PUT http://localhost:3002/site/builder/pages/landing/draft \
  -H 'Content-Type: application/json' \
  -d '{"ownerId":"u1","ownerEmail":"a@salescode.ai","ownerName":"a","blocks":[{"id":"b1","type":"hero","fields":{},"style":{},"order":0}],"theme":{"accent":"#f00"},"base":{"blocks":[],"theme":{},"pageUpdatedAt":"2026-07-17T00:00:00.000Z"}}' | head -c 400
# Expected: {"draft":{...,"ownerId":"u1","blocks":[{"id":"b1"...}],"baseBlocks":[],...}}

# Read it back
curl -s "http://localhost:3002/site/builder/pages/landing/draft?ownerId=u1" | head -c 300
# Expected: {"draft":{...,"ownerId":"u1",...}}

# Second save must NOT change base (setOnInsert only on create)
curl -s -X PUT http://localhost:3002/site/builder/pages/landing/draft \
  -H 'Content-Type: application/json' \
  -d '{"ownerId":"u1","blocks":[{"id":"b1","type":"hero","fields":{"x":1},"style":{},"order":0}],"base":{"blocks":[{"id":"IGNORED"}]}}' | grep -o '"baseBlocks":\[\]'
# Expected: prints "baseBlocks":[]  (base unchanged)

# Delete
curl -s -X DELETE "http://localhost:3002/site/builder/pages/landing/draft?ownerId=u1"
# Expected: {"ok":true}
```

- [ ] **Step 5: Commit**

```bash
cd /Users/salescode/Desktop/Work/salescodemarketplace
git add src/controller/builderPagesController.ts
git commit -m "feat(builder): add per-user draft CRUD routes"
```

---

### Task 3: Backend — presence list + page head (`GET /pages/:pageKey/drafts`)

**Files:**
- Modify: `/Users/salescode/Desktop/Work/salescodemarketplace/src/controller/builderPagesController.ts`

**Interfaces:**
- Produces route `GET /site/builder/pages/:pageKey/drafts` → `{ page: { updatedAt, lastUpdatedBy }, drafts: PresenceEntry[] }`.

- [ ] **Step 1: Add the method**

Insert inside `BuilderPagesController`, after `deleteDraft`:

```ts
  // Presence + page head. Metadata only (no blocks). `?me=<ownerId>` flags isMe.
  @Route('get', '/pages/:pageKey/drafts')
  async listDrafts(req: Request, res: Response, _next: NextFunction) {
    try {
      const { pageKey } = req.params;
      if (!isValidPageKey(pageKey)) return res.status(400).json({ error: 'Invalid page key' });
      const me = (req.query.me as string | undefined)?.trim();

      const [page, drafts] = await Promise.all([
        BuilderPageModel.findOne({ pageKey }, { updatedAt: 1, lastUpdatedBy: 1 }).lean(),
        BuilderDraftModel.find(
          { pageKey },
          { ownerId: 1, ownerName: 1, ownerEmail: 1, updatedAt: 1, _id: 0 }
        ).sort({ updatedAt: -1 }).lean(),
      ]);

      return res.status(200).json({
        page: {
          updatedAt: (page as any)?.updatedAt ?? null,
          lastUpdatedBy: (page as any)?.lastUpdatedBy,
        },
        drafts: drafts.map((d: any) => ({
          ownerId: d.ownerId,
          ownerName: d.ownerName || d.ownerEmail || d.ownerId,
          ownerEmail: d.ownerEmail || '',
          updatedAt: d.updatedAt,
          isMe: !!me && d.ownerId === me,
        })),
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
```

- [ ] **Step 2: Typecheck**

Run: `cd /Users/salescode/Desktop/Work/salescodemarketplace && npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Verify (server running from Task 2)**

```bash
curl -s -X PUT http://localhost:3002/site/builder/pages/landing/draft -H 'Content-Type: application/json' -d '{"ownerId":"u1","ownerName":"Aditya","blocks":[]}' >/dev/null
curl -s -X PUT http://localhost:3002/site/builder/pages/landing/draft -H 'Content-Type: application/json' -d '{"ownerId":"u2","ownerName":"Priya","blocks":[]}' >/dev/null
curl -s "http://localhost:3002/site/builder/pages/landing/drafts?me=u1" | head -c 500
# Expected: {"page":{"updatedAt":...},"drafts":[{"ownerId":"u2","ownerName":"Priya",...,"isMe":false},{"ownerId":"u1","ownerName":"Aditya",...,"isMe":true}]}
# (no "blocks" key present in entries)
```

- [ ] **Step 4: Commit**

```bash
cd /Users/salescode/Desktop/Work/salescodemarketplace
git add src/controller/builderPagesController.ts
git commit -m "feat(builder): add presence + page-head listing for drafts"
```

---

### Task 4: Backend — publish deletes the caller's own draft

**Files:**
- Modify: `/Users/salescode/Desktop/Work/salescodemarketplace/src/controller/builderPagesController.ts` (the existing `updatePage` / `PUT /pages/:pageKey`)

**Interfaces:**
- Consumes: existing `updatePage` body already reads `editorId, editorName, lastKnownUpdatedAt`.
- Produces: on a successful publish, `BuilderDraftModel.deleteOne({ pageKey, ownerId: editorId })`.

- [ ] **Step 1: Delete the caller's draft after a successful update**

In `updatePage`, find the block that performs the update and returns the page:

```ts
      const page = await BuilderPageModel.findOneAndUpdate(
        { pageKey },
        { $set: update },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return res.status(200).json({ page });
```

Replace it with:

```ts
      const page = await BuilderPageModel.findOneAndUpdate(
        { pageKey },
        { $set: update },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      // Publishing consumes MY draft — others' drafts survive (they get rebased).
      if (editorId) {
        await BuilderDraftModel.deleteOne({ pageKey, ownerId: editorId });
      }
      return res.status(200).json({ page });
```

- [ ] **Step 2: Typecheck**

Run: `cd /Users/salescode/Desktop/Work/salescodemarketplace && npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Verify (server running)**

```bash
# u1 has a draft; u2 has a draft. u1 publishes -> only u1's draft is deleted.
curl -s -X PUT http://localhost:3002/site/builder/pages/landing/draft -H 'Content-Type: application/json' -d '{"ownerId":"u1","ownerName":"Aditya","blocks":[]}' >/dev/null
curl -s -X PUT http://localhost:3002/site/builder/pages/landing/draft -H 'Content-Type: application/json' -d '{"ownerId":"u2","ownerName":"Priya","blocks":[]}' >/dev/null
curl -s -X PUT http://localhost:3002/site/builder/pages/landing -H 'Content-Type: application/json' -d '{"blocks":[],"theme":{},"editorId":"u1","editorName":"Aditya"}' >/dev/null
curl -s "http://localhost:3002/site/builder/pages/landing/drafts?me=u1" | grep -o '"ownerId":"[^"]*"'
# Expected: only "ownerId":"u2"  (u1's draft was consumed by publish)
```

- [ ] **Step 4: Commit**

```bash
cd /Users/salescode/Desktop/Work/salescodemarketplace
git add src/controller/builderPagesController.ts
git commit -m "feat(builder): publish consumes the caller's own draft"
```

---

### Task 5: Frontend — identity helper + draft API client

**Files:**
- Create: `/Users/salescode/Desktop/Work/adminpanel/src/lib/builder-drafts.ts`

**Interfaces:**
- Consumes: `getAuth` from `@/lib/auth`; `MARKETPLACE_URL` from `@/lib/config`; `Block`, `Theme` from `@/components/builder/types`.
- Produces: `getEditorIdentity()`, `getMyDraft()`, `saveMyDraft()`, `deleteMyDraft()`, `listDrafts()`, `publishPage()`, and the DTO types in the File Structure section.

- [ ] **Step 1: Create the client module**

```ts
import { getAuth } from '@/lib/auth';
import { MARKETPLACE_URL } from '@/lib/config';
import type { Block, Theme } from '@/components/builder/types';

const BASE = `${MARKETPLACE_URL}/site/builder/pages`;

export interface EditorIdentity { ownerId: string; ownerEmail: string; ownerName: string; }
export interface DraftDto {
  pageKey: string; ownerId: string; ownerEmail: string; ownerName: string;
  blocks: Block[]; theme: Theme;
  baseBlocks: Block[]; baseTheme: Theme; basePageUpdatedAt: string | null;
  updatedAt: string;
}
export interface PresenceEntry { ownerId: string; ownerName: string; ownerEmail: string; updatedAt: string; isMe: boolean; }
export interface DraftsResponse { page: { updatedAt: string | null; lastUpdatedBy?: string }; drafts: PresenceEntry[]; }

/** Identity for the current editor, from the already-wired SSO session. */
export function getEditorIdentity(): EditorIdentity {
  const auth = getAuth();
  const email = auth?.email ?? '';
  const ownerId = auth?.userId ?? email ?? 'anonymous';
  const ownerName = email ? email.split('@')[0] : ownerId;
  return { ownerId, ownerEmail: email, ownerName };
}

export async function getMyDraft(pageKey: string): Promise<DraftDto | null> {
  const { ownerId } = getEditorIdentity();
  const res = await fetch(`${BASE}/${pageKey}/draft?ownerId=${encodeURIComponent(ownerId)}`);
  if (!res.ok) return null;
  const { draft } = (await res.json()) as { draft: DraftDto | null };
  return draft;
}

export async function saveMyDraft(
  pageKey: string,
  blocks: Block[],
  theme: Theme,
  base?: { blocks: Block[]; theme: Theme; pageUpdatedAt: string | null }
): Promise<{ updatedAt: string } | null> {
  const id = getEditorIdentity();
  const res = await fetch(`${BASE}/${pageKey}/draft`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...id, blocks, theme, base }),
  });
  if (!res.ok) throw new Error(`saveMyDraft failed: ${res.status}`);
  const { draft } = (await res.json()) as { draft: DraftDto };
  return { updatedAt: draft.updatedAt };
}

export async function deleteMyDraft(pageKey: string): Promise<void> {
  const { ownerId } = getEditorIdentity();
  await fetch(`${BASE}/${pageKey}/draft?ownerId=${encodeURIComponent(ownerId)}`, { method: 'DELETE' });
}

export async function listDrafts(pageKey: string): Promise<DraftsResponse> {
  const { ownerId } = getEditorIdentity();
  const res = await fetch(`${BASE}/${pageKey}/drafts?me=${encodeURIComponent(ownerId)}`);
  if (!res.ok) throw new Error(`listDrafts failed: ${res.status}`);
  return (await res.json()) as DraftsResponse;
}

export type PublishResult =
  | { ok: true }
  | { ok: false; conflict: true; updatedAt: string; updatedBy?: string }
  | { ok: false; conflict: false; status: number };

/** Publish (promote editor state to the live page). Sends editor identity +
 *  the page.updatedAt this editor last loaded so the backend can 409 on stale. */
export async function publishPage(
  pageKey: string, blocks: Block[], theme: Theme, lastKnownUpdatedAt: string | null
): Promise<PublishResult> {
  const id = getEditorIdentity();
  const res = await fetch(`${BASE}/${pageKey}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      blocks, theme,
      editorId: id.ownerId, editorName: id.ownerName,
      lastKnownUpdatedAt: lastKnownUpdatedAt ?? undefined,
    }),
  });
  if (res.ok) return { ok: true };
  if (res.status === 409) {
    const body = await res.json().catch(() => ({}));
    return { ok: false, conflict: true, updatedAt: body.updatedAt, updatedBy: body.updatedBy };
  }
  return { ok: false, conflict: false, status: res.status };
}
```

- [ ] **Step 2: Typecheck**

Run: `cd /Users/salescode/Desktop/Work/adminpanel && npx tsc --noEmit`
Expected: exit 0. If `@/components/builder/types` does not export `Block`/`Theme`, open that file and use the exact exported names (do not invent new ones).

- [ ] **Step 3: Commit**

```bash
cd /Users/salescode/Desktop/Work/adminpanel
git add src/lib/builder-drafts.ts
git commit -m "feat(builder): add draft API client + editor identity helper"
```

---

### Task 6: Frontend — autosave hook + status chip

**Files:**
- Create: `/Users/salescode/Desktop/Work/adminpanel/src/components/builder/useDraftAutosave.ts`
- Modify: `/Users/salescode/Desktop/Work/adminpanel/src/components/builder/PageBuilder.tsx`

**Interfaces:**
- Consumes: `saveMyDraft` from `@/lib/builder-drafts`.
- Produces: `useDraftAutosave({ pageKey, blocks, theme, base, enabled }) => { status, savedAt, flush }` where `status: 'idle' | 'saving' | 'saved' | 'error'`.

- [ ] **Step 1: Create the hook**

```ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { saveMyDraft } from '@/lib/builder-drafts';
import type { Block, Theme } from '@/components/builder/types';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface Args {
  pageKey: string;
  blocks: Block[];
  theme: Theme;
  base: { blocks: Block[]; theme: Theme; pageUpdatedAt: string | null } | null;
  enabled: boolean;
  debounceMs?: number;
}

export function useDraftAutosave({ pageKey, blocks, theme, base, enabled, debounceMs = 2000 }: Args) {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef({ pageKey, blocks, theme, base });
  latest.current = { pageKey, blocks, theme, base };
  const dirty = useRef(false);
  const baseSent = useRef(false);

  const doSave = useCallback(async () => {
    const cur = latest.current;
    setStatus('saving');
    try {
      await saveMyDraft(cur.pageKey, cur.blocks, cur.theme, baseSent.current ? undefined : cur.base ?? undefined);
      baseSent.current = true;
      dirty.current = false;
      setStatus('saved');
      setSavedAt(Date.now());
    } catch {
      setStatus('error');
    }
  }, []);

  // Reset base-sent latch when switching pages.
  useEffect(() => { baseSent.current = false; }, [pageKey]);

  // Debounced autosave on content change.
  useEffect(() => {
    if (!enabled) return;
    dirty.current = true;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(doSave, debounceMs);
    return () => { if (timer.current) clearTimeout(timer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks, theme, pageKey, enabled]);

  // Best-effort flush on unload.
  useEffect(() => {
    const handler = () => {
      if (!enabled || !dirty.current) return;
      const cur = latest.current;
      const id = JSON.parse(localStorage.getItem('auth_cookie') || '{}');
      const body = JSON.stringify({
        ownerId: id.userId, ownerEmail: id.email,
        ownerName: id.email ? String(id.email).split('@')[0] : id.userId,
        blocks: cur.blocks, theme: cur.theme,
      });
      navigator.sendBeacon?.(
        `${import.meta.env.VITE_MARKETPLACE_URL ?? 'https://salescode-marketplace.salescode.ai'}/site/builder/pages/${cur.pageKey}/draft`,
        new Blob([body], { type: 'application/json' })
      );
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [enabled]);

  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    if (dirty.current) return doSave();
    return Promise.resolve();
  }, [doSave]);

  return { status, savedAt, flush };
}
```

> Note: `sendBeacon` issues a POST, but the draft route is a PUT. Beacon is a best-effort last-ditch flush; if the backend rejects the POST it is harmless (the debounced PUT already covers normal edits). Do not rely on it for correctness.

- [ ] **Step 2: Wire the hook into PageBuilder**

In `PageBuilder.tsx`, add imports near the other `@/lib` imports:

```ts
import { useDraftAutosave } from '@/components/builder/useDraftAutosave';
import { getEditorIdentity } from '@/lib/builder-drafts';
```

Add state near the other `useState` calls (after line ~198). This holds the published `updatedAt` the current page was loaded from (used as autosave base + publish `lastKnownUpdatedAt`):

```ts
  const [pageBaseUpdatedAt, setPageBaseUpdatedAt] = useState<string | null>(null);
  const [pageBaseSnapshot, setPageBaseSnapshot] = useState<{ blocks: Block[]; theme: Theme } | null>(null);
```

After `const blocks = pageBlocks[activePage] ?? [];` (line ~433), add:

```ts
  const { status: saveStatus, savedAt } = useDraftAutosave({
    pageKey: activePage,
    blocks,
    theme,
    base: pageBaseSnapshot ? { ...pageBaseSnapshot, pageUpdatedAt: pageBaseUpdatedAt } : null,
    enabled: !loading,
  });
```

- [ ] **Step 3: Render the status chip**

In the `<header>` (line ~819), just before the Publish `<button>` (line ~672), add:

```tsx
          <span className="text-xs pb-muted px-2" title="Draft autosave">
            {saveStatus === 'saving' ? 'Saving…'
              : saveStatus === 'error' ? 'Unsaved changes'
              : savedAt ? `Saved · ${Math.max(0, Math.round((Date.now() - savedAt) / 60000))}m ago`
              : 'Draft'}
          </span>
```

- [ ] **Step 4: Typecheck**

Run: `cd /Users/salescode/Desktop/Work/adminpanel && npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 5: Verify in browser**

Prereq: marketplace running on :3002. Run `cd /Users/salescode/Desktop/Work/adminpanel && npm run dev`, open the page builder, log in (hardcoded `admin`/`PageCraft@2026` is fine).
- Edit any block. Within ~2s the chip shows "Saving…" then "Saved · 0m ago".
- Open devtools Network → confirm `PUT …/pages/<key>/draft` with 200 and your `ownerId` in the payload.

- [ ] **Step 6: Commit**

```bash
cd /Users/salescode/Desktop/Work/adminpanel
git add src/components/builder/useDraftAutosave.ts src/components/builder/PageBuilder.tsx
git commit -m "feat(builder): debounced draft autosave + save-status chip"
```

---

### Task 7: Frontend — restore my draft on open

**Files:**
- Modify: `/Users/salescode/Desktop/Work/adminpanel/src/components/builder/PageBuilder.tsx`

**Interfaces:**
- Consumes: `getMyDraft`, `deleteMyDraft` from `@/lib/builder-drafts`.

- [ ] **Step 1: Capture the published base when a page loads**

In the bootstrap effect (line ~391) where the first page is loaded, right after `const { page } = await pageRes.json() ...` and before `commit({...})`, record the base:

```ts
        setPageBaseUpdatedAt(((page as any).updatedAt as string) ?? null);
        setPageBaseSnapshot({ blocks: (page.blocks ?? []) as Block[], theme: (page.theme ?? {}) as Theme });
```

Do the same inside the page-switch effect (line ~458) after its `.then(({ page }) => {`:

```ts
        setPageBaseUpdatedAt((page?.updatedAt as string) ?? null);
        setPageBaseSnapshot({ blocks: (page?.blocks ?? []) as Block[], theme: (page?.theme ?? {}) as Theme });
```

> If the load `fetch` does not currently request `updatedAt`, the GET page route already returns the full page document (which includes `updatedAt` via Mongoose timestamps), so no backend change is needed.

- [ ] **Step 2: Add draft-restore state + banner state**

Near the other `useState` (line ~198):

```ts
  const [restoredDraftAt, setRestoredDraftAt] = useState<string | null>(null);
```

- [ ] **Step 3: Restore effect**

Add this effect after the page-switch effect (line ~484). It loads my draft for the active page and, if present, overlays it into the editor:

```ts
  // Restore MY draft for the active page (after the published page is in state).
  useEffect(() => {
    if (loading) return;
    if (pageBlocks[activePage] === undefined) return; // wait for published load
    let cancelled = false;
    (async () => {
      const draft = await getMyDraft(activePage);
      if (cancelled || !draft) { setRestoredDraftAt(null); return; }
      commit({
        ...state,
        pageBlocks: { ...pageBlocks, [activePage]: (draft.blocks ?? []) as Block[] },
      });
      if (draft.theme && Object.keys(draft.theme).length) setTheme({ ...DEFAULT_THEME, ...(draft.theme as Theme) });
      setRestoredDraftAt(draft.updatedAt);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage, loading, pageBlocks[activePage] !== undefined]);
```

- [ ] **Step 4: Render the restore bar + "Use published instead"**

Directly under the `<header>` element (after its closing `</header>`, line ~692), add:

```tsx
      {restoredDraftAt && (
        <div className="px-4 py-1.5 text-xs flex items-center gap-3" style={{ background: '#1e293b', color: '#cbd5e1' }}>
          <span>Restored your draft (saved {new Date(restoredDraftAt).toLocaleString()}).</span>
          <button
            className="underline"
            onClick={async () => {
              await deleteMyDraft(activePage);
              commit({ ...state, pageBlocks: { ...pageBlocks, [activePage]: (pageBaseSnapshot?.blocks ?? []) as Block[] } });
              if (pageBaseSnapshot?.theme) setTheme({ ...DEFAULT_THEME, ...(pageBaseSnapshot.theme as Theme) });
              setRestoredDraftAt(null);
            }}
          >Use published instead</button>
        </div>
      )}
```

Add imports:

```ts
import { getMyDraft, deleteMyDraft } from '@/lib/builder-drafts';
```

- [ ] **Step 5: Typecheck**

Run: `cd /Users/salescode/Desktop/Work/adminpanel && npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 6: Verify in browser**

- Edit a block, wait for "Saved", refresh the page. The edit is restored and the bar reads "Restored your draft…".
- Click "Use published instead" → editor reverts to published content, draft deleted (Network shows `DELETE …/draft`).

- [ ] **Step 7: Commit**

```bash
cd /Users/salescode/Desktop/Work/adminpanel
git add src/components/builder/PageBuilder.tsx
git commit -m "feat(builder): restore my draft on open with revert-to-published"
```

---

### Task 8: Frontend — presence banner + polling

**Files:**
- Create: `/Users/salescode/Desktop/Work/adminpanel/src/components/builder/PresenceBanner.tsx`
- Modify: `/Users/salescode/Desktop/Work/adminpanel/src/components/builder/PageBuilder.tsx`

**Interfaces:**
- Consumes: `listDrafts`, `DraftsResponse`, `PresenceEntry` from `@/lib/builder-drafts`.
- Produces: `<PresenceBanner pageKey={...} onHead={(head) => void} />`. `onHead` reports the latest `{ updatedAt, lastUpdatedBy }` each poll (used by Task 15).

- [ ] **Step 1: Create the component**

```tsx
import { useEffect, useRef, useState } from 'react';
import { listDrafts, type PresenceEntry } from '@/lib/builder-drafts';

function ago(iso: string): string {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  return m === 0 ? 'just now' : `${m}m ago`;
}

interface Props {
  pageKey: string;
  pollMs?: number;
  onHead?: (head: { updatedAt: string | null; lastUpdatedBy?: string }) => void;
}

export function PresenceBanner({ pageKey, pollMs = 25000, onHead }: Props) {
  const [drafts, setDrafts] = useState<PresenceEntry[]>([]);
  const onHeadRef = useRef(onHead);
  onHeadRef.current = onHead;

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval>;
    const poll = async () => {
      try {
        const res = await listDrafts(pageKey);
        if (cancelled) return;
        setDrafts(res.drafts);
        onHeadRef.current?.(res.page);
      } catch { /* fail silent — banner goes stale */ }
    };
    poll();
    timer = setInterval(poll, pollMs);
    return () => { cancelled = true; clearInterval(timer); };
  }, [pageKey, pollMs]);

  const mine = drafts.find((d) => d.isMe);
  const others = drafts.filter((d) => !d.isMe);
  if (!mine && others.length === 0) return null;

  return (
    <div
      className="px-4 py-1.5 text-xs flex items-center gap-3 flex-wrap"
      style={{ background: others.length ? '#78350f' : '#0f172a', color: '#fde68a' }}
    >
      {mine && <span>You have a draft · saved {ago(mine.updatedAt)}.</span>}
      {others.length > 0 && (
        <span>Also drafting: {others.map((o) => `${o.ownerName} (${ago(o.updatedAt)})`).join(', ')}.</span>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Mount it in PageBuilder**

Add import:

```ts
import { PresenceBanner } from '@/components/builder/PresenceBanner';
```

Add state near the others (line ~198) to hold the latest head for Task 15's use (and to keep `lastKnownUpdatedAt` fresh for publish):

```ts
  const [pageHead, setPageHead] = useState<{ updatedAt: string | null; lastUpdatedBy?: string }>({ updatedAt: null });
```

Render the banner directly below the restore bar (after the `{restoredDraftAt && …}` block from Task 7):

```tsx
      <PresenceBanner pageKey={activePage} onHead={setPageHead} />
```

- [ ] **Step 3: Typecheck**

Run: `cd /Users/salescode/Desktop/Work/adminpanel && npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 4: Verify in browser (two identities)**

- In a normal window (logged in as `admin`) edit a block → wait for save. The banner shows "You have a draft · saved just now."
- Simulate a second editor: `curl -s -X PUT http://localhost:3002/site/builder/pages/<key>/draft -H 'Content-Type: application/json' -d '{"ownerId":"u2","ownerName":"Priya","blocks":[]}'`
- Within 25s the banner turns amber and shows "Also drafting: Priya (just now)."

- [ ] **Step 5: Commit**

```bash
cd /Users/salescode/Desktop/Work/adminpanel
git add src/components/builder/PresenceBanner.tsx src/components/builder/PageBuilder.tsx
git commit -m "feat(builder): presence banner with 25s polling + page-head reporting"
```

---

### Task 9: Frontend — auth'd publish + simple 409 dialog

**Files:**
- Modify: `/Users/salescode/Desktop/Work/adminpanel/src/components/builder/PageBuilder.tsx`

**Interfaces:**
- Consumes: `publishPage`, `deleteMyDraft` from `@/lib/builder-drafts`; `pageHead`, `pageBaseUpdatedAt` state.

- [ ] **Step 1: Replace the Publish button's onClick**

Find the Publish `<button onClick={async () => { ... }}>` (line ~672) whose body does `fetch(\`${BACKEND}/site/builder/pages/${activePage}\`, { method: "PUT", ... body: JSON.stringify({ blocks, theme }) })`. Replace its entire `onClick` with:

```tsx
            onClick={async () => {
              const result = await publishPage(activePage, blocks, theme, pageBaseUpdatedAt);
              if (result.ok) {
                toast.success('Page published successfully');
                await deleteMyDraft(activePage);
                setRestoredDraftAt(null);
                // Adopt what we just published as the new base.
                setPageBaseSnapshot({ blocks, theme });
                return;
              }
              if (result.conflict) {
                const who = result.updatedBy ? ` by ${result.updatedBy}` : '';
                const takeLatest = window.confirm(
                  `The live page changed${who} since you loaded it.\n\n` +
                  `OK = discard the live change and publish yours anyway.\n` +
                  `Cancel = keep the live version (your draft is safe).`
                );
                if (takeLatest) {
                  // Overwrite: re-publish using the server's newer updatedAt as the base.
                  const retry = await publishPage(activePage, blocks, theme, result.updatedAt);
                  if (retry.ok) {
                    toast.success('Published (overwrote the newer version)');
                    await deleteMyDraft(activePage);
                    setPageBaseSnapshot({ blocks, theme });
                  } else {
                    toast.error('Publish still failed — reload and retry.');
                  }
                } else {
                  toast('Kept the live version. Your draft is preserved.');
                }
                return;
              }
              toast.error(`Publish failed (status ${result.status}) — is the backend running?`);
            }}
```

Add imports (extend the existing `@/lib/builder-drafts` import):

```ts
import { publishPage } from '@/lib/builder-drafts';
```

> This is the **Phase 1** simple 409 behavior. Task 14 replaces the `window.confirm` with the merge-review flow.

- [ ] **Step 2: Typecheck**

Run: `cd /Users/salescode/Desktop/Work/adminpanel && npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Verify (force a 409)**

- Load the builder for a page (records `pageBaseUpdatedAt`).
- In a terminal, publish a change as someone else so the live `updatedAt` advances:
  `curl -s -X PUT http://localhost:3002/site/builder/pages/<key> -H 'Content-Type: application/json' -d '{"blocks":[],"theme":{},"editorId":"u2","editorName":"Priya"}'`
- Back in the builder, click Publish → confirm dialog appears naming Priya. Cancel → toast "Kept the live version". OK → publishes and toast "overwrote the newer version".

- [ ] **Step 4: Commit**

```bash
cd /Users/salescode/Desktop/Work/adminpanel
git add src/components/builder/PageBuilder.tsx
git commit -m "feat(builder): auth'd publish, clear own draft, simple 409 overwrite/take-latest"
```

---

**✅ Phase 1 complete: end-to-end drafts, autosave, restore, presence, and safe publish. This is shippable on its own.**

---

## PHASE 2 — Rebase engine + review UI

### Task 10: Frontend — add Vitest (merge module only)

**Files:**
- Modify: `/Users/salescode/Desktop/Work/adminpanel/package.json`
- Create: `/Users/salescode/Desktop/Work/adminpanel/vitest.config.ts`

- [ ] **Step 1: Install Vitest**

Run: `cd /Users/salescode/Desktop/Work/adminpanel && npm i -D vitest@^2`
Expected: installs without peer-dep errors.

- [ ] **Step 2: Add the test script**

In `package.json` `scripts`, add:

```json
    "test": "vitest run",
    "test:watch": "vitest"
```

- [ ] **Step 3: Create vitest config**

```ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
});
```

- [ ] **Step 4: Verify the runner boots**

Run: `cd /Users/salescode/Desktop/Work/adminpanel && npm run test`
Expected: "No test files found" (exit 0) — no config errors.

- [ ] **Step 5: Commit**

```bash
cd /Users/salescode/Desktop/Work/adminpanel
git add package.json vitest.config.ts package-lock.json
git commit -m "chore(builder): add vitest for the pure merge module"
```

---

### Task 11: Frontend — pure `merge(base, theirs, mine)` (TDD)

**Files:**
- Create: `/Users/salescode/Desktop/Work/adminpanel/src/components/builder/merge.test.ts`
- Create: `/Users/salescode/Desktop/Work/adminpanel/src/components/builder/merge.ts`

**Interfaces:**
- Produces: `mergePage(base, theirs, mine, opts?) => MergeResult`, and the merge types listed in the File Structure section. Consumed by Tasks 13–15.

Merge rules (spec §9), block keyed by stable `id`, "mine wins" on conflict:
- I added (in mine, not base) → insert.
- I removed (in base, not mine) → remove from theirs.
- I edited (in base & mine, differs from base) → apply mine; if theirs also changed it since base → `origin:'conflict'`.
- I edited a block theirs deleted → re-add mine, `origin:'conflict'`, `kind:'edit'`.
- Order: final order follows `mine` for ids present in mine; theirs-only ids are appended in theirs order. Emit a `kind:'reorder'` change (mine) when my order of common ids differs from theirs.
- Theme: field-level; mine wins; conflict when both changed the same field vs base.
- `opts.disabledChangeIds`: for each disabled change, do NOT apply that mine-delta (fall back to theirs for that block/field/position).

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect } from 'vitest';
import { mergePage } from './merge';
import type { Block, Theme } from './types';

const b = (id: string, order: number, fields: Record<string, unknown> = {}): Block =>
  ({ id, type: 'text', fields, style: {}, order } as Block);

describe('mergePage — blocks', () => {
  it('applies my added block onto theirs', () => {
    const base = [b('a', 0)];
    const theirs = [b('a', 0)];
    const mine = [b('a', 0), b('z', 1)];
    const r = mergePage(base, theirs, mine, {} as Theme, {} as Theme, {} as Theme);
    expect(r.mergedBlocks.map((x) => x.id)).toEqual(['a', 'z']);
    expect(r.changes.some((c) => c.kind === 'add' && c.blockId === 'z' && c.origin === 'mine')).toBe(true);
  });

  it('applies my removal onto theirs', () => {
    const base = [b('a', 0), b('b', 1)];
    const theirs = [b('a', 0), b('b', 1)];
    const mine = [b('a', 0)];
    const r = mergePage(base, theirs, mine, {} as Theme, {} as Theme, {} as Theme);
    expect(r.mergedBlocks.map((x) => x.id)).toEqual(['a']);
    expect(r.changes.some((c) => c.kind === 'remove' && c.blockId === 'b')).toBe(true);
  });

  it('keeps a block theirs added that I never had', () => {
    const base = [b('a', 0)];
    const theirs = [b('a', 0), b('t', 1)];
    const mine = [b('a', 0)];
    const r = mergePage(base, theirs, mine, {} as Theme, {} as Theme, {} as Theme);
    expect(r.mergedBlocks.map((x) => x.id).sort()).toEqual(['a', 't']);
  });

  it('mine wins on a conflicting edit and flags a conflict', () => {
    const base = [b('a', 0, { text: 'base' })];
    const theirs = [b('a', 0, { text: 'theirs' })];
    const mine = [b('a', 0, { text: 'mine' })];
    const r = mergePage(base, theirs, mine, {} as Theme, {} as Theme, {} as Theme);
    expect((r.mergedBlocks[0].fields as any).text).toBe('mine');
    expect(r.changes.some((c) => c.kind === 'edit' && c.origin === 'conflict' && c.blockId === 'a')).toBe(true);
  });

  it('re-adds a block I edited that theirs deleted, as a conflict', () => {
    const base = [b('a', 0, { text: 'base' })];
    const theirs: Block[] = [];
    const mine = [b('a', 0, { text: 'mine' })];
    const r = mergePage(base, theirs, mine, {} as Theme, {} as Theme, {} as Theme);
    expect(r.mergedBlocks.map((x) => x.id)).toEqual(['a']);
    expect(r.changes.some((c) => c.blockId === 'a' && c.origin === 'conflict')).toBe(true);
  });

  it('disabling my edit change falls back to theirs', () => {
    const base = [b('a', 0, { text: 'base' })];
    const theirs = [b('a', 0, { text: 'theirs' })];
    const mine = [b('a', 0, { text: 'mine' })];
    const first = mergePage(base, theirs, mine, {} as Theme, {} as Theme, {} as Theme);
    const editChange = first.changes.find((c) => c.kind === 'edit')!;
    const r = mergePage(base, theirs, mine, {} as Theme, {} as Theme, {} as Theme, { disabledChangeIds: new Set([editChange.id]) });
    expect((r.mergedBlocks[0].fields as any).text).toBe('theirs');
  });
});

describe('mergePage — theme', () => {
  it('mine wins on a conflicting theme field', () => {
    const r = mergePage([], [], [], { accent: '#000' } as Theme, { accent: '#111' } as Theme, { accent: '#222' } as Theme);
    expect((r.mergedTheme as any).accent).toBe('#222');
    expect(r.changes.some((c) => c.kind === 'theme' && c.field === 'accent' && c.origin === 'conflict')).toBe(true);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd /Users/salescode/Desktop/Work/adminpanel && npm run test`
Expected: FAIL — "Cannot find module './merge'" / `mergePage is not a function`.

- [ ] **Step 3: Implement `merge.ts`**

```ts
import type { Block, Theme } from './types';

export type ChangeOrigin = 'mine' | 'theirs' | 'conflict';
export type ChangeKind = 'add' | 'remove' | 'edit' | 'reorder' | 'theme';
export interface MergeChange { id: string; origin: ChangeOrigin; kind: ChangeKind; blockId?: string; field?: string; index?: number; label: string; }
export interface MergeResult { mergedBlocks: Block[]; mergedTheme: Theme; changes: MergeChange[]; }
export interface MergeOpts { disabledChangeIds?: Set<string>; }

const key = (kind: ChangeKind, idOrField: string) => `${kind}:${idOrField}`;
const eq = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
// Compare block content ignoring positional `order`.
const sameContent = (a?: Block, b?: Block) =>
  !!a && !!b && eq({ ...a, order: 0 }, { ...b, order: 0 });

function byId(list: Block[]): Map<string, Block> {
  const m = new Map<string, Block>();
  for (const bl of list) m.set(bl.id, bl);
  return m;
}

export function mergePage(
  baseBlocks: Block[], theirsBlocks: Block[], mineBlocks: Block[],
  baseTheme: Theme, theirsTheme: Theme, mineTheme: Theme,
  opts: MergeOpts = {}
): MergeResult {
  const disabled = opts.disabledChangeIds ?? new Set<string>();
  const base = byId(baseBlocks), theirs = byId(theirsBlocks), mine = byId(mineBlocks);
  const changes: MergeChange[] = [];
  const merged = new Map<string, Block>(theirs); // start from theirs

  const allIds = new Set<string>([...base.keys(), ...theirs.keys(), ...mine.keys()]);
  for (const id of allIds) {
    const inBase = base.has(id), inTheirs = theirs.has(id), inMine = mine.has(id);

    // I added it (not in base, in mine).
    if (!inBase && inMine && !theirs.has(id)) {
      const ch: MergeChange = { id: key('add', id), origin: 'mine', kind: 'add', blockId: id, label: `Added block ${id}` };
      changes.push(ch);
      if (!disabled.has(ch.id)) merged.set(id, mine.get(id)!);
      continue;
    }
    // I removed it (in base, not in mine).
    if (inBase && !inMine) {
      const theirsChanged = inTheirs && !sameContent(base.get(id), theirs.get(id));
      const ch: MergeChange = {
        id: key('remove', id),
        origin: theirsChanged ? 'conflict' : 'mine',
        kind: 'remove', blockId: id, label: `Removed block ${id}`,
      };
      changes.push(ch);
      if (!disabled.has(ch.id)) merged.delete(id);
      continue;
    }
    // I edited it (in base & mine, content differs from base).
    if (inBase && inMine && !sameContent(base.get(id), mine.get(id))) {
      const theirsChanged = inTheirs && !sameContent(base.get(id), theirs.get(id));
      const theirsDeleted = !inTheirs;
      const conflict = theirsChanged || theirsDeleted;
      const ch: MergeChange = {
        id: key('edit', id),
        origin: conflict ? 'conflict' : 'mine',
        kind: 'edit', blockId: id,
        label: theirsDeleted ? `Re-added block ${id} you edited (they deleted it)` : `Edited block ${id}`,
      };
      changes.push(ch);
      if (!disabled.has(ch.id)) merged.set(id, mine.get(id)!);
      // when disabled + theirsDeleted, leave it removed; when disabled + theirsChanged, keep theirs (already in merged)
      continue;
    }
  }

  // --- Ordering: follow mine for ids present in mine; append theirs-only in theirs order.
  const mineOrder = mineBlocks.map((x) => x.id).filter((id) => merged.has(id));
  const theirsOnly = theirsBlocks.map((x) => x.id).filter((id) => merged.has(id) && !mine.has(id));
  const orderedIds = [...mineOrder, ...theirsOnly.filter((id) => !mineOrder.includes(id))];
  // include any merged ids not yet placed (e.g. my adds already in mineOrder; safety net)
  for (const id of merged.keys()) if (!orderedIds.includes(id)) orderedIds.push(id);

  const commonBaseOrder = baseBlocks.map((x) => x.id).filter((id) => mine.has(id));
  const commonMineOrder = mineBlocks.map((x) => x.id).filter((id) => base.has(id));
  if (!eq(commonBaseOrder, commonMineOrder)) {
    changes.push({ id: key('reorder', 'blocks'), origin: 'mine', kind: 'reorder', label: 'Reordered blocks' });
  }

  const mergedBlocks: Block[] = orderedIds.map((id, i) => ({ ...(merged.get(id) as Block), order: i }));

  // --- Theme (field-level).
  const mergedTheme: Theme = { ...(theirsTheme ?? {}) } as Theme;
  const themeFields = new Set<string>([
    ...Object.keys(baseTheme ?? {}), ...Object.keys(theirsTheme ?? {}), ...Object.keys(mineTheme ?? {}),
  ]);
  for (const f of themeFields) {
    const bv = (baseTheme as any)?.[f], tv = (theirsTheme as any)?.[f], mv = (mineTheme as any)?.[f];
    const iChanged = !eq(bv, mv);
    if (!iChanged) continue;
    const theyChanged = !eq(bv, tv);
    const ch: MergeChange = {
      id: key('theme', f),
      origin: theyChanged && !eq(tv, mv) ? 'conflict' : 'mine',
      kind: 'theme', field: f, label: `Theme: ${f}`,
    };
    changes.push(ch);
    if (!disabled.has(ch.id)) (mergedTheme as any)[f] = mv;
  }

  return { mergedBlocks, mergedTheme, changes };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd /Users/salescode/Desktop/Work/adminpanel && npm run test`
Expected: all tests PASS.

- [ ] **Step 5: Typecheck**

Run: `cd /Users/salescode/Desktop/Work/adminpanel && npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
cd /Users/salescode/Desktop/Work/adminpanel
git add src/components/builder/merge.ts src/components/builder/merge.test.ts
git commit -m "feat(builder): pure 3-way block+theme merge (mine-wins, per-change toggles)"
```

---

### Task 12: Backend — `rebase-save` route

**Files:**
- Modify: `/Users/salescode/Desktop/Work/salescodemarketplace/src/controller/builderPagesController.ts`

**Interfaces:**
- Produces route `POST /site/builder/pages/:pageKey/rebase-save` — re-baselines my draft onto the current published page. Body `{ ownerId, ownerEmail, ownerName, blocks, theme }`.

- [ ] **Step 1: Add the method**

Insert inside `BuilderPagesController`, after `listDrafts`:

```ts
  // Re-baseline MY draft onto the current published page (proactive rebase).
  @Route('post', '/pages/:pageKey/rebase-save')
  async rebaseSaveDraft(req: Request, res: Response, _next: NextFunction) {
    try {
      const { pageKey } = req.params;
      if (!isValidPageKey(pageKey)) return res.status(400).json({ error: 'Invalid page key' });
      const { ownerId, ownerEmail, ownerName, blocks, theme } = req.body as {
        ownerId?: string; ownerEmail?: string; ownerName?: string; blocks?: unknown[]; theme?: unknown;
      };
      if (!ownerId) return res.status(400).json({ error: 'ownerId required' });

      const page = await BuilderPageModel.findOne({ pageKey }, { blocks: 1, theme: 1, updatedAt: 1 }).lean();

      const draft = await BuilderDraftModel.findOneAndUpdate(
        { pageKey, ownerId },
        {
          $set: {
            ownerEmail: ownerEmail ?? '', ownerName: ownerName ?? '',
            blocks: blocks ?? [], theme: theme ?? {},
            baseBlocks: (page as any)?.blocks ?? [],
            baseTheme: (page as any)?.theme ?? {},
            basePageUpdatedAt: (page as any)?.updatedAt ?? undefined,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).lean();

      return res.status(200).json({ draft });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
```

- [ ] **Step 2: Typecheck**

Run: `cd /Users/salescode/Desktop/Work/salescodemarketplace && npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Verify (server running)**

```bash
# Set a published page, then rebase-save a draft; base must equal the published content.
curl -s -X PUT http://localhost:3002/site/builder/pages/landing -H 'Content-Type: application/json' -d '{"blocks":[{"id":"p1","type":"hero","fields":{},"style":{},"order":0}],"theme":{"accent":"#0f0"},"editorId":"sys","editorName":"sys"}' >/dev/null
curl -s -X POST http://localhost:3002/site/builder/pages/landing/rebase-save -H 'Content-Type: application/json' -d '{"ownerId":"u1","ownerName":"Aditya","blocks":[{"id":"m1","type":"text","fields":{},"style":{},"order":0}],"theme":{"accent":"#00f"}}' | head -c 500
# Expected: draft with blocks=[m1], baseBlocks=[p1], baseTheme.accent="#0f0"
```

- [ ] **Step 4: Commit**

```bash
cd /Users/salescode/Desktop/Work/salescodemarketplace
git add src/controller/builderPagesController.ts
git commit -m "feat(builder): rebase-save route (re-baseline a draft onto latest)"
```

---

### Task 13: Frontend — `MergeReviewModal` component

**Files:**
- Create: `/Users/salescode/Desktop/Work/adminpanel/src/components/builder/MergeReviewModal.tsx`

**Interfaces:**
- Consumes: `MergeResult`, `MergeChange` from `./merge`.
- Produces: `<MergeReviewModal open result disabledIds onToggle onCancel onConfirm confirmLabel note />`. `onToggle(changeId)` flips a change; parent re-runs `mergePage` with the new `disabledIds` and passes a fresh `result`. `onConfirm()` fires the terminal action.

- [ ] **Step 1: Create the component**

```tsx
import type { MergeChange, MergeResult } from './merge';

interface Props {
  open: boolean;
  result: MergeResult;
  disabledIds: Set<string>;
  confirmLabel: string;      // 'Publish' | 'Save as draft'
  note: string;              // banner text, e.g. "Applied your changes on top of Priya's."
  onToggle: (changeId: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

const originColor: Record<MergeChange['origin'], string> = {
  mine: '#22c55e', theirs: '#38bdf8', conflict: '#f59e0b',
};

export function MergeReviewModal({ open, result, disabledIds, confirmLabel, note, onToggle, onCancel, onConfirm }: Props) {
  if (!open) return null;
  const mine = result.changes.filter((c) => c.origin === 'mine' || c.origin === 'conflict');
  const theirs = result.changes.filter((c) => c.origin === 'theirs');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="w-[720px] max-w-[92vw] max-h-[85vh] overflow-auto rounded-lg p-5" style={{ background: '#0f172a', color: '#e2e8f0' }}>
        <h2 className="text-base font-medium mb-1">Review merge</h2>
        <p className="text-xs pb-muted mb-4">{note}</p>

        <div className="text-xs font-medium mb-1">Applied from your draft</div>
        <ul className="mb-4 space-y-1">
          {mine.length === 0 && <li className="text-xs pb-muted">No changes from your draft.</li>}
          {mine.map((c) => (
            <li key={c.id} className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={!disabledIds.has(c.id)} onChange={() => onToggle(c.id)} />
              <span style={{ color: originColor[c.origin] }}>●</span>
              <span>{c.label}{c.origin === 'conflict' ? ' (conflict — mine wins)' : ''}</span>
            </li>
          ))}
        </ul>

        <div className="text-xs font-medium mb-1">From the latest version</div>
        <ul className="mb-4 space-y-1">
          {theirs.length === 0 && <li className="text-xs pb-muted">No incoming changes detected.</li>}
          {theirs.map((c) => (<li key={c.id} className="text-xs">{c.label}</li>))}
        </ul>

        <div className="flex justify-end gap-2">
          <button className="px-3 py-1.5 text-sm rounded-md border border-slate-600" onClick={onCancel}>Cancel</button>
          <button className="px-3 py-1.5 text-sm rounded-md font-medium text-white" style={{ background: '#22c55e' }} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
```

> `theirs`-origin changes are currently informational (the merge emits `mine`/`conflict` deltas; incoming edits are reflected because merged starts from theirs). The `theirs` list is a placeholder for a future incoming-change summary; leaving it empty is acceptable.

- [ ] **Step 2: Typecheck**

Run: `cd /Users/salescode/Desktop/Work/adminpanel && npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
cd /Users/salescode/Desktop/Work/adminpanel
git add src/components/builder/MergeReviewModal.tsx
git commit -m "feat(builder): merge-review modal with per-change toggles"
```

---

### Task 14: Frontend — wire reactive 409 → merge-review → Publish

**Files:**
- Modify: `/Users/salescode/Desktop/Work/adminpanel/src/components/builder/PageBuilder.tsx`

**Interfaces:**
- Consumes: `mergePage`, `MergeReviewModal`, `publishPage`, `getMyDraft`, `deleteMyDraft`, `MARKETPLACE_URL`.

- [ ] **Step 1: Add merge-review state**

Near the other `useState` (line ~198):

```ts
  const [merge, setMerge] = useState<null | {
    mode: 'publish' | 'rebase';
    base: { blocks: Block[]; theme: Theme };
    theirs: { blocks: Block[]; theme: Theme; updatedAt: string | null };
    mine: { blocks: Block[]; theme: Theme };
    disabled: Set<string>;
  }>(null);
```

Add imports:

```ts
import { mergePage } from '@/components/builder/merge';
import { MergeReviewModal } from '@/components/builder/MergeReviewModal';
import { MARKETPLACE_URL } from '@/lib/config';
```

- [ ] **Step 2: Helper to fetch the current published page**

Add near the other callbacks (after `redo`, line ~390):

```ts
  const fetchPublished = useCallback(async (pageKey: string) => {
    const res = await fetch(`${MARKETPLACE_URL}/site/builder/pages/${pageKey}`);
    const { page } = (await res.json()) as { page: { blocks?: Block[]; theme?: Theme; updatedAt?: string } };
    return { blocks: (page?.blocks ?? []) as Block[], theme: (page?.theme ?? {}) as Theme, updatedAt: page?.updatedAt ?? null };
  }, []);
```

- [ ] **Step 3: Replace the Phase 1 `window.confirm` branch with merge-review**

In the Publish `onClick` from Task 9, replace the whole `if (result.conflict) { ... }` block with:

```tsx
              if (result.conflict) {
                const theirs = await fetchPublished(activePage);
                const draft = await getMyDraft(activePage);
                const base = { blocks: (draft?.baseBlocks ?? pageBaseSnapshot?.blocks ?? []) as Block[],
                               theme: (draft?.baseTheme ?? pageBaseSnapshot?.theme ?? {}) as Theme };
                setMerge({ mode: 'publish', base, theirs, mine: { blocks, theme }, disabled: new Set() });
                return;
              }
```

- [ ] **Step 4: Render the modal**

Just before the closing tag of the component's top-level return (near the `<ThemePanel .../>` line ~1484), add:

```tsx
        {merge && (() => {
          const r = mergePage(merge.base.blocks, merge.theirs.blocks, merge.mine.blocks, merge.base.theme, merge.theirs.theme, merge.mine.theme, { disabledChangeIds: merge.disabled });
          return (
            <MergeReviewModal
              open
              result={r}
              disabledIds={merge.disabled}
              confirmLabel={merge.mode === 'publish' ? 'Publish' : 'Save as draft'}
              note={merge.mode === 'publish'
                ? `We applied your draft changes on top of the latest version${pageHead.lastUpdatedBy ? ` (published by ${pageHead.lastUpdatedBy})` : ''}.`
                : `We applied your draft changes on top of the latest${pageHead.lastUpdatedBy ? ` (published by ${pageHead.lastUpdatedBy})` : ''}. Saving keeps you in draft mode.`}
              onToggle={(id) => setMerge((m) => {
                if (!m) return m;
                const next = new Set(m.disabled);
                next.has(id) ? next.delete(id) : next.add(id);
                return { ...m, disabled: next };
              })}
              onCancel={() => setMerge(null)}
              onConfirm={async () => {
                const merged = mergePage(merge.base.blocks, merge.theirs.blocks, merge.mine.blocks, merge.base.theme, merge.theirs.theme, merge.mine.theme, { disabledChangeIds: merge.disabled });
                if (merge.mode === 'publish') {
                  const pub = await publishPage(activePage, merged.mergedBlocks, merged.mergedTheme, merge.theirs.updatedAt);
                  if (pub.ok) {
                    toast.success('Published merged version');
                    await deleteMyDraft(activePage);
                    commit({ ...state, pageBlocks: { ...pageBlocks, [activePage]: merged.mergedBlocks } });
                    setTheme({ ...DEFAULT_THEME, ...(merged.mergedTheme as Theme) });
                    setPageBaseSnapshot({ blocks: merged.mergedBlocks, theme: merged.mergedTheme });
                    setPageBaseUpdatedAt(merge.theirs.updatedAt);
                    setRestoredDraftAt(null);
                  } else { toast.error('Publish failed — reload and retry.'); }
                }
                setMerge(null);
              }}
            />
          );
        })()}
```

- [ ] **Step 5: Typecheck + merge tests**

Run: `cd /Users/salescode/Desktop/Work/adminpanel && npx tsc --noEmit && npm run test`
Expected: tsc exit 0; merge tests still PASS.

- [ ] **Step 6: Verify (force a 409)**

- Edit a block in the builder. In a terminal, publish a conflicting change as `u2` (advances live `updatedAt`).
- Click Publish → merge-review modal opens listing your applied change(s). Toggle one off/on → list updates. Click Publish → toast "Published merged version"; the editor shows the merged result.

- [ ] **Step 7: Commit**

```bash
cd /Users/salescode/Desktop/Work/adminpanel
git add src/components/builder/PageBuilder.tsx
git commit -m "feat(builder): reactive 409 -> merge-review -> publish merged"
```

---

### Task 15: Frontend — proactive "someone republished" → rebase → save as draft

**Files:**
- Modify: `/Users/salescode/Desktop/Work/adminpanel/src/components/builder/PageBuilder.tsx`

**Interfaces:**
- Consumes: `pageHead` (from `PresenceBanner.onHead`), `pageBaseUpdatedAt`, `getMyDraft`, `mergePage`, `MergeReviewModal`, and a new `rebaseSaveDraft` client call.

- [ ] **Step 1: Add the `rebaseSaveDraft` client call**

In `src/lib/builder-drafts.ts`, append:

```ts
export async function rebaseSaveDraft(pageKey: string, blocks: Block[], theme: Theme): Promise<DraftDto | null> {
  const id = getEditorIdentity();
  const res = await fetch(`${BASE}/${pageKey}/rebase-save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...id, blocks, theme }),
  });
  if (!res.ok) throw new Error(`rebaseSaveDraft failed: ${res.status}`);
  const { draft } = (await res.json()) as { draft: DraftDto };
  return draft;
}
```

- [ ] **Step 2: Detect a republish and show a non-blocking banner**

In `PageBuilder.tsx`, add state (line ~198):

```ts
  const [republished, setRepublished] = useState<{ updatedAt: string; by?: string } | null>(null);
```

Add an effect that compares the polled head against my base (place after the restore effect):

```ts
  useEffect(() => {
    if (!pageHead.updatedAt || !pageBaseUpdatedAt) { setRepublished(null); return; }
    if (new Date(pageHead.updatedAt).getTime() > new Date(pageBaseUpdatedAt).getTime()) {
      setRepublished({ updatedAt: pageHead.updatedAt, by: pageHead.lastUpdatedBy });
    } else {
      setRepublished(null);
    }
  }, [pageHead, pageBaseUpdatedAt]);
```

- [ ] **Step 3: Render the republished banner (below PresenceBanner)**

```tsx
      {republished && (
        <div className="px-4 py-1.5 text-xs flex items-center gap-3" style={{ background: '#7f1d1d', color: '#fecaca' }}>
          <span>{republished.by ? `${republished.by} just published` : 'This page was just published'} — your draft is based on an older version.</span>
          <button
            className="underline"
            onClick={async () => {
              const theirs = await fetchPublished(activePage);
              const draft = await getMyDraft(activePage);
              const base = { blocks: (draft?.baseBlocks ?? pageBaseSnapshot?.blocks ?? []) as Block[],
                             theme: (draft?.baseTheme ?? pageBaseSnapshot?.theme ?? {}) as Theme };
              setMerge({ mode: 'rebase', base, theirs, mine: { blocks, theme }, disabled: new Set() });
            }}
          >Pull latest &amp; apply my draft</button>
        </div>
      )}
```

- [ ] **Step 4: Handle the `rebase` terminal action in the modal's `onConfirm`**

In the `onConfirm` from Task 14, add a branch after the `if (merge.mode === 'publish') { ... }` block:

```tsx
                if (merge.mode === 'rebase') {
                  await rebaseSaveDraft(activePage, merged.mergedBlocks, merged.mergedTheme);
                  toast.success('Rebased your draft onto the latest');
                  commit({ ...state, pageBlocks: { ...pageBlocks, [activePage]: merged.mergedBlocks } });
                  setTheme({ ...DEFAULT_THEME, ...(merged.mergedTheme as Theme) });
                  setPageBaseSnapshot({ blocks: merge.theirs.blocks, theme: merge.theirs.theme });
                  setPageBaseUpdatedAt(merge.theirs.updatedAt);
                  setRepublished(null);
                }
```

Add import:

```ts
import { rebaseSaveDraft } from '@/lib/builder-drafts';
```

- [ ] **Step 5: Typecheck + tests**

Run: `cd /Users/salescode/Desktop/Work/adminpanel && npx tsc --noEmit && npm run test`
Expected: tsc exit 0; merge tests PASS.

- [ ] **Step 6: Verify in browser**

- Edit a block in the builder (creates a draft based on the current published `updatedAt`).
- In a terminal, publish as `u2` to advance the live page.
- Within 25s the red republished banner appears ("Priya just published…"). Click "Pull latest & apply my draft" → merge-review opens with terminal button "Save as draft". Confirm → toast "Rebased your draft onto the latest"; banner clears; editor shows merged content. A subsequent Publish does NOT 409.

- [ ] **Step 7: Commit**

```bash
cd /Users/salescode/Desktop/Work/adminpanel
git add src/lib/builder-drafts.ts src/components/builder/PageBuilder.tsx
git commit -m "feat(builder): proactive republish banner -> rebase -> save as draft"
```

---

**✅ Phase 2 complete: the rebase engine powers both publish-time (409) and proactive reconciliation.**

## Self-Review notes (author)

- **Spec coverage:** §5 identity → Task 5 (`getEditorIdentity`). §6 model → Task 1. §7 routes → Tasks 2,3,4,12. §8 autosave/restore/presence/publish → Tasks 6,7,8,9. §9 merge + both triggers → Tasks 11,14,15. §10 review UI → Task 13. §12 phasing → Phase 1 (Tasks 1–9) / Phase 2 (Tasks 10–15). §13 testing → merge unit tests (Task 11) + per-task curl/browser verification. §14 items are explicitly deferred (no tasks, by decision).
- **Deferred by design (not gaps):** backend JWT verification (spec §5/§14); draft TTL cleanup (spec §14); block-level *text* field merge (spec §3 non-goal — merge is whole-block).
- **Type consistency:** `mergePage(baseBlocks, theirsBlocks, mineBlocks, baseTheme, theirsTheme, mineTheme, opts?)` used identically in Tasks 11, 14, 15. `EditorIdentity`/`DraftDto`/`PresenceEntry`/`DraftsResponse` defined in Task 5, consumed unchanged elsewhere. `saveMyDraft` base param `{blocks,theme,pageUpdatedAt}` matches the backend `base` shape in Task 2.
- **Known caveat carried from spec:** under the hardcoded `admin` login every editor shares `ownerId:"admin"` → one shared draft; per-person isolation is real only under Google SSO.
