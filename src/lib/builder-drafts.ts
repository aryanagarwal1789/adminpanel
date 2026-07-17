import type { Block, Theme } from '@/components/builder/types';

const BACKEND = import.meta.env.VITE_BACKEND_URL ?? "https://salescode-marketplace.salescode.ai";
const BASE = `${BACKEND}/site/builder/pages`;

export interface EditorIdentity { ownerId: string; ownerEmail: string; ownerName: string; }
export interface DraftDto {
  pageKey: string; ownerId: string; ownerEmail: string; ownerName: string;
  blocks: Block[]; theme: Theme;
  baseBlocks: Block[]; baseTheme: Theme; basePageUpdatedAt: string | null;
  updatedAt: string;
}
export interface PresenceEntry { ownerId: string; ownerName: string; ownerEmail: string; updatedAt: string; isMe: boolean; }
export interface DraftsResponse { page: { updatedAt: string | null; lastUpdatedBy?: string }; drafts: PresenceEntry[]; }

/** Identity for the current editor — the same anonymous localStorage identity
 *  PageBuilder's edit-lock uses (pb_editor_id / pb_editor_name), so drafts and
 *  the lock always agree on who "you" are. */
export function getEditorIdentity(): EditorIdentity {
  let ownerId: string;
  try {
    ownerId = localStorage.getItem('pb_editor_id') ?? '';
    if (!ownerId) { ownerId = crypto.randomUUID(); localStorage.setItem('pb_editor_id', ownerId); }
  } catch { ownerId = 'anonymous'; }
  let ownerName = 'Editor';
  try { ownerName = localStorage.getItem('pb_editor_name') || 'Editor'; } catch { /* ignore */ }
  return { ownerId, ownerEmail: '', ownerName };
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
): Promise<{ updatedAt: string }> {
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
  const res = await fetch(`${BASE}/${pageKey}/draft?ownerId=${encodeURIComponent(ownerId)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`deleteMyDraft failed: ${res.status}`);
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

/** Rebase this editor's draft onto a newer published base (used by the
 *  proactive-republish flow — a later task). Sends the editor's current
 *  blocks/theme to be re-saved as a draft against the latest published page. */
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
