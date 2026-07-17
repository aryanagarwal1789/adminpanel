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
