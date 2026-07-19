import { createFileRoute } from '@tanstack/react-router';
import { authJsonHeaders } from '@/lib/auth';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAdminPreview } from './preview-context';
import { UploadInput } from './upload-input';

export const Route = createFileRoute('/admin/clients')({ component: ClientsPage });

const BACKEND = import.meta.env.VITE_BACKEND_URL ?? 'https://salescode-marketplace.salescode.ai';

interface ClientImage {
  id: string;
  url: string;
  alt: string;
  order: number;
}

interface ClientData {
  title: string;
  description: string;
  bannerImage: string;
  images: ClientImage[];
}

const BLANK: ClientData = { title: '', description: '', bannerImage: '', images: [] };

type Toast = { type: 'success' | 'error'; message: string } | null;

const inp: React.CSSProperties = {
  background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9',
  borderRadius: 6, padding: '8px 12px', width: '100%', boxSizing: 'border-box', fontSize: 13,
};
const textareaStyle: React.CSSProperties = { ...inp, resize: 'vertical', minHeight: 80 };
const lbl: React.CSSProperties = { color: '#94a3b8', fontSize: 13, marginBottom: 6, display: 'block' };
const card: React.CSSProperties = { background: '#1e293b', borderRadius: 8, padding: 20, marginBottom: 16 };
const saveBtn: React.CSSProperties = { background: '#3b82f6', color: '#fff', padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 };
const secBtn: React.CSSProperties = { background: 'transparent', color: '#94a3b8', padding: '6px 12px', borderRadius: 6, border: '1px solid #334155', cursor: 'pointer', fontSize: 13 };
const dangerBtn: React.CSSProperties = { ...secBtn, color: '#ef4444', borderColor: '#ef4444' };

function blankImage(url = ''): ClientImage {
  return { id: `client-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, url, alt: '', order: 0 };
}

function ClientsPage() {
  const [page, setPage] = useState<ClientData>(BLANK);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const [newImageUrl, setNewImageUrl] = useState('');
  const { post, onPreviewReady } = useAdminPreview();
  const pageRef = useRef<ClientData>(BLANK);

  const showToast = (t: Toast) => {
    setToast(t);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetch(`${BACKEND}/site/pages/client`)
      .then((r) => r.json())
      .then((d: { page?: Partial<ClientData> }) =>
        setPage({
          title: d.page?.title ?? '',
          description: d.page?.description ?? '',
          bannerImage: d.page?.bannerImage ?? '',
          images: d.page?.images ?? [],
        })
      )
      .catch(() => showToast({ type: 'error', message: 'Failed to load Clients page' }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { pageRef.current = page; }, [page]);

  const sendToPreview = useCallback(() => {
    post({ type: 'PAGE_UPDATE', pageId: 'client', page: pageRef.current });
  }, [post]);
  useEffect(() => onPreviewReady(sendToPreview), [onPreviewReady, sendToPreview]);

  useEffect(() => {
    if (loading) return;
    post({ type: 'PAGE_UPDATE', pageId: 'client', page });
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (patch: Partial<ClientData>) => setPage((p) => ({ ...p, ...patch }));

  const updateImage = (idx: number, patch: Partial<ClientImage>) =>
    setPage((p) => ({ ...p, images: p.images.map((img, i) => (i === idx ? { ...img, ...patch } : img)) }));

  const removeImage = (idx: number) =>
    setPage((p) => ({ ...p, images: p.images.filter((_, i) => i !== idx) }));

  const addImage = () => {
    if (!newImageUrl.trim()) return;
    setPage((p) => ({ ...p, images: [...p.images, blankImage(newImageUrl.trim())] }));
    setNewImageUrl('');
  };

  const moveImage = (idx: number, dir: 'up' | 'down') => {
    setPage((p) => {
      const next = [...p.images];
      const swap = dir === 'up' ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= next.length) return p;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return { ...p, images: next };
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...page, images: page.images.map((img, i) => ({ ...img, order: i })) };
      const res = await fetch(`${BACKEND}/site/pages/client`, {
        method: 'PUT',
        headers: authJsonHeaders(),
        body: JSON.stringify({ page: payload }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = (await res.json()) as { page?: Partial<ClientData> };
      setPage({
        title: data.page?.title ?? '',
        description: data.page?.description ?? '',
        bannerImage: data.page?.bannerImage ?? '',
        images: data.page?.images ?? [],
      });
      showToast({ type: 'success', message: 'Client page saved' });
      post({ type: 'RELOAD' });
    } catch {
      showToast({ type: 'error', message: 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 999, background: toast.type === 'success' ? '#16a34a' : '#dc2626', color: '#fff', padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
          {toast.message}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ color: '#f1f5f9', fontSize: 22, fontWeight: 700, margin: 0 }}>Clients</h1>
          <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>Title, description, banner image, and client logos</p>
        </div>
        <button style={saveBtn} onClick={save} disabled={saving || loading}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {loading ? (
        <div style={{ color: '#94a3b8', padding: 40, textAlign: 'center' }}>Loading…</div>
      ) : (
        <div>
          <div style={card}>
            <div style={{ color: '#f1f5f9', fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Page Info</div>
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Title</label>
              <input style={inp} value={page.title} onChange={(e) => update({ title: e.target.value })} placeholder="e.g. Trusted by CPG leaders" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Description</label>
              <textarea style={textareaStyle} value={page.description} onChange={(e) => update({ description: e.target.value })} placeholder="Paragraph introducing the client section" rows={3} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Banner Image URL</label>
              <UploadInput value={page.bannerImage} onChange={(bannerImage) => update({ bannerImage })} accept="image/*" />
            </div>
          </div>

          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ color: '#f1f5f9', fontSize: 16, fontWeight: 600 }}>Client Logos ({page.images.length})</div>
            </div>

            {/* Add image row */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input
                style={{ ...inp, flex: 1 }}
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Paste image URL and click Add"
                onKeyDown={(e) => { if (e.key === 'Enter') addImage(); }}
              />
              <button style={saveBtn} onClick={addImage} disabled={!newImageUrl.trim()}>Add</button>
            </div>

            {page.images.length === 0 && (
              <div style={{ color: '#64748b', fontSize: 13, padding: '8px 0' }}>No client images yet. Paste a URL above to add one.</div>
            )}

            {page.images.map((img, idx) => (
              <div key={img.id} style={{ background: '#0f172a', borderRadius: 6, padding: 12, marginBottom: 8, border: '1px solid #334155', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                {/* Reorder buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0, paddingTop: 2 }}>
                  <button
                    onClick={() => moveImage(idx, 'up')}
                    disabled={idx === 0}
                    style={{ background: 'none', border: '1px solid #334155', color: idx === 0 ? '#334155' : '#94a3b8', borderRadius: 4, cursor: idx === 0 ? 'default' : 'pointer', padding: '2px 6px', fontSize: 11, lineHeight: 1 }}
                    title="Move up"
                  >↑</button>
                  <button
                    onClick={() => moveImage(idx, 'down')}
                    disabled={idx === page.images.length - 1}
                    style={{ background: 'none', border: '1px solid #334155', color: idx === page.images.length - 1 ? '#334155' : '#94a3b8', borderRadius: 4, cursor: idx === page.images.length - 1 ? 'default' : 'pointer', padding: '2px 6px', fontSize: 11, lineHeight: 1 }}
                    title="Move down"
                  >↓</button>
                  <span style={{ color: '#475569', fontSize: 10, textAlign: 'center' }}>{idx + 1}</span>
                </div>

                {img.url && (
                  <img src={img.url} alt={img.alt} style={{ width: 60, height: 40, objectFit: 'contain', borderRadius: 4, border: '1px solid #334155', background: '#1e293b', flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div>
                    <label style={lbl}>Image URL</label>
                    <UploadInput value={img.url} onChange={(url) => updateImage(idx, { url })} accept="image/*" preview={false} />
                  </div>
                  <div>
                    <label style={lbl}>Alt text</label>
                    <input style={inp} value={img.alt} onChange={(e) => updateImage(idx, { alt: e.target.value })} placeholder="e.g. Acme Corp logo" />
                  </div>
                </div>
                <button style={dangerBtn} onClick={() => removeImage(idx)}>Remove</button>
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  );
}
