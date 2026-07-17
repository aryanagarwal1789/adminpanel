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
    const poll = async () => {
      try {
        const res = await listDrafts(pageKey);
        if (cancelled) return;
        setDrafts(res.drafts);
        onHeadRef.current?.(res.page);
      } catch { /* fail silent — banner goes stale */ }
    };
    poll();
    const timer = setInterval(poll, pollMs);
    return () => { cancelled = true; clearInterval(timer); };
  }, [pageKey, pollMs]);

  const mine = drafts.find((d) => d.isMe);
  const others = drafts.filter((d) => !d.isMe);
  if (!mine && others.length === 0) return null;

  return (
    <div className="flex items-center justify-center gap-3 px-4 py-1.5 text-xs flex-wrap border-b"
         style={{ background: others.length ? '#78350f' : '#0f172a', color: '#fde68a', borderColor: '#334155' }}>
      {mine && <span>You have a draft · saved {ago(mine.updatedAt)}.</span>}
      {others.length > 0 && <span>Also drafting: {others.map((o) => `${o.ownerName} (${ago(o.updatedAt)})`).join(', ')}.</span>}
    </div>
  );
}
