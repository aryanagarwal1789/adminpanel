import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

export const Route = createFileRoute('/admin/clients')({ component: ClientsPage });

const BACKEND = 'http://localhost:1337';

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

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...page, images: page.images.map((img, i) => ({ ...img, order: i })) };
      const res = await fetch(`${BACKEND}/site/pages/client`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
              <input style={inp} value={page.bannerImage} onChange={(e) => update({ bannerImage: e.target.value })} placeholder="https://…" />
              {page.bannerImage && (
                <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <img src={page.bannerImage} alt="" style={{ height: 64, borderRadius: 6, objectFit: 'cover', border: '1px solid #334155' }} />
                  <button style={dangerBtn} onClick={() => update({ bannerImage: '' })}>Clear</button>
                </div>
              )}
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
                {img.url && (
                  <img src={img.url} alt={img.alt} style={{ width: 60, height: 40, objectFit: 'contain', borderRadius: 4, border: '1px solid #334155', background: '#1e293b', flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div>
                    <label style={lbl}>Image URL</label>
                    <input style={inp} value={img.url} onChange={(e) => updateImage(idx, { url: e.target.value })} placeholder="https://…" />
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
