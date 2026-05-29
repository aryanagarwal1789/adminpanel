import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

export const Route = createFileRoute('/admin/sections')({ component: SectionsPage });

const BACKEND = 'http://localhost:1337';

interface SectionItem {
  id: string;
  url?: string;
  alt?: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  image?: string;
  subtitle?: string;
  blogId?: string;
  order: number;
  enabled?: boolean;
}

interface Section {
  id: string;
  label: string;
  kind: 'image' | 'video' | 'card' | 'blog';
  cardinality: 'single' | 'multiple';
  items: SectionItem[];
  order: number;
  enabled: boolean;
}

type Toast = { type: 'success' | 'error'; message: string } | null;

const inp: React.CSSProperties = {
  background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9',
  borderRadius: 6, padding: '8px 12px', width: '100%', boxSizing: 'border-box', fontSize: 13,
};
const label: React.CSSProperties = { color: '#94a3b8', fontSize: 12, marginBottom: 4, display: 'block' };
const saveBtn: React.CSSProperties = { background: '#3b82f6', color: '#fff', padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 };
const secBtn: React.CSSProperties = { background: 'transparent', color: '#94a3b8', padding: '6px 12px', borderRadius: 6, border: '1px solid #334155', cursor: 'pointer', fontSize: 13 };
const dangerBtn: React.CSSProperties = { ...secBtn, color: '#ef4444', borderColor: '#ef4444' };

const KIND_LABELS: Record<string, string> = { image: 'Images', video: 'Videos', card: 'Cards', blog: 'Blogs' };

function rand() { return Math.random().toString(36).slice(2, 7); }

function newItemForKind(kind: string, url = ''): SectionItem {
  if (kind === 'image') return { id: `img-${Date.now()}-${rand()}`, url, alt: '', order: 0 };
  if (kind === 'video') return { id: `vid-${Date.now()}-${rand()}`, url, title: '', description: '', thumbnail: '', order: 0 };
  if (kind === 'card') return { id: `card-${Date.now()}-${rand()}`, title: '', subtitle: '', description: '', image: '', order: 0 };
  return { id: `blog-${Date.now()}-${rand()}`, blogId: '', order: 0 };
}

function ItemEditor({ kind, item, onChange, onRemove }: {
  kind: string;
  item: SectionItem;
  onChange: (patch: Partial<SectionItem>) => void;
  onRemove: () => void;
}) {
  return (
    <div style={{ background: '#0f172a', borderRadius: 6, padding: 12, marginBottom: 8, border: '1px solid #334155' }}>
      {kind === 'image' && (
        <>
          <div style={{ marginBottom: 8 }}>
            <label style={label}>Image URL</label>
            <input style={inp} value={item.url ?? ''} onChange={(e) => onChange({ url: e.target.value })} placeholder="https://…" />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={label}>Alt text</label>
            <input style={inp} value={item.alt ?? ''} onChange={(e) => onChange({ alt: e.target.value })} placeholder="Describe the image" />
          </div>
        </>
      )}
      {kind === 'video' && (
        <>
          <div style={{ marginBottom: 8 }}>
            <label style={label}>Video URL</label>
            <input style={inp} value={item.url ?? ''} onChange={(e) => onChange({ url: e.target.value })} placeholder="https://…" />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={label}>Title</label>
            <input style={inp} value={item.title ?? ''} onChange={(e) => onChange({ title: e.target.value })} placeholder="e.g. Product walkthrough" />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={label}>Thumbnail URL</label>
            <input style={inp} value={item.thumbnail ?? ''} onChange={(e) => onChange({ thumbnail: e.target.value })} placeholder="https://…" />
          </div>
        </>
      )}
      {kind === 'card' && (
        <>
          <div style={{ marginBottom: 8 }}>
            <label style={label}>Title</label>
            <input style={inp} value={item.title ?? ''} onChange={(e) => onChange({ title: e.target.value })} placeholder="e.g. Real-time insights" />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={label}>Subtitle</label>
            <input style={inp} value={item.subtitle ?? ''} onChange={(e) => onChange({ subtitle: e.target.value })} placeholder="Optional short tagline" />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={label}>Description</label>
            <textarea style={{ ...inp, resize: 'vertical', minHeight: 60 }} value={item.description ?? ''} onChange={(e) => onChange({ description: e.target.value })} placeholder="Longer description" />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={label}>Image URL</label>
            <input style={inp} value={item.image ?? ''} onChange={(e) => onChange({ image: e.target.value })} placeholder="https://…" />
          </div>
        </>
      )}
      {kind === 'blog' && (
        <div style={{ color: '#94a3b8', fontSize: 13 }}>Blog: {item.blogId || item.title || item.id}</div>
      )}
      <button style={dangerBtn} onClick={onRemove}>Remove</button>
    </div>
  );
}

function SectionCard({ section, sIdx, updateSection, updateItem, removeItem, addItem, removeSection }: {
  section: Section;
  sIdx: number;
  updateSection: (sIdx: number, patch: Partial<Section>) => void;
  updateItem: (sIdx: number, iIdx: number, patch: Partial<SectionItem>) => void;
  removeItem: (sIdx: number, iIdx: number) => void;
  addItem: (sIdx: number) => void;
  removeSection: (sIdx: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const enabled = section.enabled !== false;
  const kindLabel = KIND_LABELS[section.kind] ?? 'Items';

  return (
    <div style={{ background: '#1e293b', borderRadius: 8, marginBottom: 10, border: '1px solid #334155', opacity: enabled ? 1 : 0.6 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px' }}>
        <button onClick={() => setOpen((o) => !o)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 13, padding: 0 }}>
          {open ? '▼' : '▶'}
        </button>
        <input
          style={{ ...inp, flex: 1, padding: '5px 10px', fontSize: 14, fontWeight: 600 }}
          value={section.label}
          onChange={(e) => updateSection(sIdx, { label: e.target.value })}
          placeholder="Section label"
        />
        <span style={{ fontSize: 11, color: '#64748b', padding: '2px 8px', border: '1px solid #334155', borderRadius: 4 }}>{kindLabel}</span>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#94a3b8', fontSize: 13 }}>
          <input type="checkbox" checked={enabled} onChange={(e) => updateSection(sIdx, { enabled: e.target.checked })} />
          Enabled
        </label>
        <button style={dangerBtn} onClick={() => removeSection(sIdx)}>Remove</button>
      </div>

      {open && (
        <div style={{ padding: '0 16px 16px' }}>
          {section.items.length === 0 && (
            <div style={{ color: '#64748b', fontSize: 13, padding: '8px 0' }}>No {kindLabel.toLowerCase()} yet.</div>
          )}
          {section.items.map((item, iIdx) => (
            <ItemEditor
              key={item.id}
              kind={section.kind}
              item={item}
              onChange={(patch) => updateItem(sIdx, iIdx, patch)}
              onRemove={() => removeItem(sIdx, iIdx)}
            />
          ))}
          {section.kind !== 'blog' && (
            <button style={secBtn} onClick={() => addItem(sIdx)}>
              + Add {section.kind}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function SectionsPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  const showToast = (t: Toast) => {
    setToast(t);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetch(`${BACKEND}/site/sections`)
      .then((r) => r.json())
      .then((d: { sections?: Section[] }) => setSections(d.sections ?? []))
      .catch(() => showToast({ type: 'error', message: 'Failed to load sections' }))
      .finally(() => setLoading(false));
  }, []);

  const updateSection = (sIdx: number, patch: Partial<Section>) =>
    setSections((prev) => prev.map((s, i) => (i === sIdx ? { ...s, ...patch } : s)));

  const updateItem = (sIdx: number, iIdx: number, patch: Partial<SectionItem>) =>
    setSections((prev) =>
      prev.map((s, i) => i === sIdx ? { ...s, items: s.items.map((it, j) => j === iIdx ? { ...it, ...patch } : it) } : s)
    );

  const removeItem = (sIdx: number, iIdx: number) =>
    setSections((prev) =>
      prev.map((s, i) => i === sIdx ? { ...s, items: s.items.filter((_, j) => j !== iIdx) } : s)
    );

  const addItem = (sIdx: number) =>
    setSections((prev) =>
      prev.map((s, i) => i === sIdx ? { ...s, items: [...s.items, newItemForKind(s.kind)] } : s)
    );

  const removeSection = (sIdx: number) => {
    if (!window.confirm('Remove this section and all its items?')) return;
    setSections((prev) => prev.filter((_, i) => i !== sIdx));
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = sections.map((s, i) => ({
        id: s.id,
        label: s.label,
        kind: s.kind,
        cardinality: s.cardinality,
        enabled: s.enabled !== false,
        order: i,
        items: s.items.map((it, j) =>
          s.kind === 'blog'
            ? { id: it.blogId ?? it.id, blogId: it.blogId ?? it.id, order: j }
            : { ...it, order: j }
        ),
      }));
      const res = await fetch(`${BACKEND}/site/sections`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: payload }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = (await res.json()) as { sections?: Section[] };
      setSections(data.sections ?? []);
      showToast({ type: 'success', message: 'Sections saved' });
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
          <h1 style={{ color: '#f1f5f9', fontSize: 22, fontWeight: 700, margin: 0 }}>Sections & Media</h1>
          <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>Images, videos, cards, and blog tiles on the landing page</p>
        </div>
        <button style={saveBtn} onClick={save} disabled={saving || loading}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {loading ? (
        <div style={{ color: '#94a3b8', padding: 40, textAlign: 'center' }}>Loading…</div>
      ) : (
        <>
          {sections.length === 0 && (
            <div style={{ color: '#64748b', fontSize: 14, padding: 32, textAlign: 'center' }}>
              No sections yet. Run <code>npm run seed:site</code> in the backend to seed defaults.
            </div>
          )}
          {sections.map((section, sIdx) => (
            <SectionCard
              key={section.id}
              section={section}
              sIdx={sIdx}
              updateSection={updateSection}
              updateItem={updateItem}
              removeItem={removeItem}
              addItem={addItem}
              removeSection={removeSection}
            />
          ))}
        </>
      )}
    </div>
  );
}
