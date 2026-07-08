import { createFileRoute } from '@tanstack/react-router';
import { MARKETPLACE_URL } from "@/lib/config";
import { useEffect, useState } from 'react';
import { UploadInput } from './upload-input';

export const Route = createFileRoute('/admin/products/$productId')({ component: ProductDetailPage });

const BACKEND = MARKETPLACE_URL;

const CATEGORIES = [
  { id: 'applications', label: 'Applications' },
  { id: 'ai-agents', label: 'AI Agents' },
  { id: 'trade-solutions', label: 'Trade Solutions' },
  { id: 'image-recognition', label: 'Image Recognition' },
  { id: 'plugins', label: 'Plugins' },
  { id: 'integrations', label: 'Integrations' },
] as const;

interface SidebarItem {
  id: string;
  label: string;
  route: string;
  icon: string;
  order: number;
  enabled: boolean;
}

interface ProductPreview {
  quickStartTitle: string;
  videoLabel: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnail: string;
}

interface ProductDetails {
  name: string;
  description: string;
  image: string;
  category: string;
  status: string;
  timelineStage: string;
  liveDate: string;
  highlight: string;
  preview: ProductPreview;
}

interface Product extends ProductDetails {
  productId: string;
  enabled: boolean;
  sidebar?: SidebarItem[];
}

type Toast = { type: 'success' | 'error'; message: string } | null;

const inp: React.CSSProperties = {
  background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9',
  borderRadius: 6, padding: '8px 12px', width: '100%', boxSizing: 'border-box', fontSize: 13,
};
const textareaStyle: React.CSSProperties = { ...inp, resize: 'vertical', minHeight: 60 };
const selectStyle: React.CSSProperties = { ...inp };
const lbl: React.CSSProperties = { color: '#94a3b8', fontSize: 13, marginBottom: 6, display: 'block' };
const card: React.CSSProperties = { background: '#1e293b', borderRadius: 8, padding: 20, marginBottom: 16 };
const cardTitle: React.CSSProperties = { color: '#f1f5f9', fontSize: 16, fontWeight: 600, marginBottom: 12 };
const saveBtn: React.CSSProperties = { background: '#3b82f6', color: '#fff', padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 };
const secBtn: React.CSSProperties = { background: 'transparent', color: '#94a3b8', padding: '6px 12px', borderRadius: 6, border: '1px solid #334155', cursor: 'pointer', fontSize: 13 };
const dangerBtn: React.CSSProperties = { ...secBtn, color: '#ef4444', borderColor: '#ef4444' };

function blankSidebarItem(): SidebarItem {
  return { id: `side-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, label: '', route: '', icon: '', order: 0, enabled: true };
}

function ProductDetailPage() {
  const { productId } = Route.useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [details, setDetails] = useState<ProductDetails>({
    name: '', description: '', image: '', category: 'applications',
    status: '', timelineStage: '', liveDate: '', highlight: '',
    preview: { quickStartTitle: '', videoLabel: '', title: '', description: '', videoUrl: '', thumbnail: '' },
  });
  const [items, setItems] = useState<SidebarItem[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(true);
  const [savingDetails, setSavingDetails] = useState(false);
  const [savingSidebar, setSavingSidebar] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  const showToast = (t: Toast) => {
    setToast(t);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetch(`${BACKEND}/site/products/${productId}`)
      .then((r) => r.json())
      .then((data: { product?: Product }) => {
        const p = data.product;
        if (!p) return;
        setProduct(p);
        setDetails({
          name: p.name ?? '',
          description: p.description ?? '',
          image: p.image ?? '',
          category: p.category ?? 'applications',
          status: p.status ?? '',
          timelineStage: p.timelineStage ?? '',
          liveDate: p.liveDate ?? '',
          highlight: p.highlight ?? '',
          preview: {
            quickStartTitle: p.preview?.quickStartTitle ?? '',
            videoLabel: p.preview?.videoLabel ?? '',
            title: p.preview?.title ?? '',
            description: p.preview?.description ?? '',
            videoUrl: p.preview?.videoUrl ?? '',
            thumbnail: p.preview?.thumbnail ?? '',
          },
        });
        setItems(p.sidebar ?? []);
      })
      .catch(() => showToast({ type: 'error', message: 'Failed to load product' }))
      .finally(() => setLoading(false));
  }, [productId]);

  const ud = (patch: Partial<ProductDetails>) => setDetails((d) => ({ ...d, ...patch }));
  const udPreview = (patch: Partial<ProductPreview>) => setDetails((d) => ({ ...d, preview: { ...d.preview, ...patch } }));

  const saveDetails = async () => {
    setSavingDetails(true);
    try {
      const res = await fetch(`${BACKEND}/site/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: details.name,
          description: details.description,
          image: details.image,
          category: details.category,
          status: details.status || null,
          timelineStage: details.timelineStage || null,
          liveDate: details.liveDate || null,
          highlight: details.highlight,
          preview: details.preview,
        }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = (await res.json()) as { product?: Product };
      if (data.product) setProduct(data.product);
      showToast({ type: 'success', message: 'Product details saved' });
    } catch {
      showToast({ type: 'error', message: 'Save failed' });
    } finally {
      setSavingDetails(false);
    }
  };

  const saveSidebar = async () => {
    setSavingSidebar(true);
    try {
      const payload = items.map((it, i) => ({ ...it, order: i }));
      const res = await fetch(`${BACKEND}/site/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sidebar: payload }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      showToast({ type: 'success', message: 'Sidebar saved' });
    } catch {
      showToast({ type: 'error', message: 'Save failed' });
    } finally {
      setSavingSidebar(false);
    }
  };

  const updateItem = (idx: number, patch: Partial<SidebarItem>) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));
  const addItem = () => {
    const item = blankSidebarItem();
    setItems((prev) => [...prev, item]);
    setExpanded((prev) => new Set(prev).add(item.id));
  };
  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  if (loading) return <div style={{ color: '#94a3b8', padding: 40, textAlign: 'center' }}>Loading…</div>;
  if (!product) return <div style={{ color: '#94a3b8', padding: 40, textAlign: 'center' }}>Product not found.</div>;

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 999, background: toast.type === 'success' ? '#16a34a' : '#dc2626', color: '#fff', padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
          {toast.message}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ marginBottom: 4 }}>
            <a href="/admin/products" style={{ color: '#94a3b8', fontSize: 13, textDecoration: 'none' }}>← All Products</a>
          </div>
          <h1 style={{ color: '#f1f5f9', fontSize: 22, fontWeight: 700, margin: 0 }}>{details.name || product.productId}</h1>
          <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>Edit product details and sidebar menu items</p>
        </div>
        <button style={saveBtn} onClick={saveDetails} disabled={savingDetails}>
          {savingDetails ? 'Saving…' : 'Save Details'}
        </button>
      </div>

      {/* Product Details */}
      <div style={card}>
        <div style={cardTitle}>Product Details</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={lbl}>Title</label>
            <input style={inp} value={details.name} onChange={(e) => ud({ name: e.target.value })} placeholder="e.g. NextGen SFA" />
          </div>
          <div>
            <label style={lbl}>Category</label>
            <select style={selectStyle} value={details.category} onChange={(e) => ud({ category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <label style={lbl}>Description</label>
          <textarea style={textareaStyle} value={details.description} onChange={(e) => ud({ description: e.target.value })} placeholder="Short line shown under the title on the card" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
          <div>
            <label style={lbl}>Status badge</label>
            <select style={selectStyle} value={details.status} onChange={(e) => ud({ status: e.target.value })}>
              <option value="">None</option>
              <option value="live">Live</option>
              <option value="beta">Beta</option>
              <option value="upcoming">Coming Soon</option>
            </select>
          </div>
          <div>
            <label style={lbl}>Highlight badge</label>
            <input style={inp} value={details.highlight} onChange={(e) => ud({ highlight: e.target.value })} placeholder="e.g. 5-18% Sales Uplift" />
          </div>
        </div>
        {(details.status === 'beta' || details.status === 'upcoming') && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
            <div>
              <label style={lbl}>Timeline stage</label>
              <select style={selectStyle} value={details.timelineStage} onChange={(e) => ud({ timelineStage: e.target.value })}>
                <option value="">— Select stage —</option>
                <option value="planning">Planning</option>
                <option value="in-development">In Development</option>
                <option value="uat">UAT</option>
                <option value="beta">Beta</option>
                <option value="live">Live</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Expected live date</label>
              <input style={inp} value={details.liveDate} onChange={(e) => ud({ liveDate: e.target.value })} placeholder="e.g. JUN 2026" />
            </div>
          </div>
        )}
        <div style={{ marginTop: 14 }}>
          <label style={lbl}>Icon / Image URL</label>
          <UploadInput value={details.image} onChange={(image) => ud({ image })} accept="image/*" />
        </div>
      </div>

      {/* Hover Preview Card */}
      <div style={card}>
        <div style={cardTitle}>Hover Preview Card</div>
        <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 16px' }}>Shown when a visitor hovers over this product card on the landing page.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={lbl}>Quick-start label</label>
            <input style={inp} value={details.preview.quickStartTitle} onChange={(e) => udPreview({ quickStartTitle: e.target.value })} placeholder="e.g. SFA Rural Quick Start" />
          </div>
          <div>
            <label style={lbl}>Video label</label>
            <input style={inp} value={details.preview.videoLabel} onChange={(e) => udPreview({ videoLabel: e.target.value })} placeholder="e.g. Experience your NextGen SFA Rural" />
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <label style={lbl}>Preview title</label>
          <input style={inp} value={details.preview.title} onChange={(e) => udPreview({ title: e.target.value })} placeholder="e.g. NextGen SFA Rural in 60 seconds" />
        </div>
        <div style={{ marginTop: 14 }}>
          <label style={lbl}>Preview description</label>
          <textarea style={textareaStyle} value={details.preview.description} onChange={(e) => udPreview({ description: e.target.value })} placeholder="Short description for the hover card" rows={2} />
        </div>
        <div style={{ marginTop: 14 }}>
          <label style={lbl}>Video URL</label>
          <UploadInput value={details.preview.videoUrl} onChange={(videoUrl) => udPreview({ videoUrl })} accept="video/*" />
        </div>
        <div style={{ marginTop: 14 }}>
          <label style={lbl}>Thumbnail image URL</label>
          <UploadInput value={details.preview.thumbnail} onChange={(thumbnail) => udPreview({ thumbnail })} accept="image/*" />
        </div>
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <button style={saveBtn} onClick={saveDetails} disabled={savingDetails}>
            {savingDetails ? 'Saving…' : 'Save Details'}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={cardTitle}>Sidebar</div>
            <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>Menu items shown inside this product's page. {items.length} item{items.length !== 1 ? 's' : ''}.</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={secBtn} onClick={addItem}>+ Add item</button>
            <button style={saveBtn} onClick={saveSidebar} disabled={savingSidebar}>
              {savingSidebar ? 'Saving…' : 'Save sidebar'}
            </button>
          </div>
        </div>

        {items.length === 0 && (
          <div style={{ color: '#64748b', fontSize: 13, padding: '12px 0' }}>No sidebar items yet. Add one to start building the product menu.</div>
        )}

        {items.map((item, idx) => {
          const isOpen = expanded.has(item.id);
          return (
            <div key={item.id} style={{ background: '#0f172a', borderRadius: 6, marginBottom: 8, border: '1px solid #334155', opacity: item.enabled ? 1 : 0.55 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>
                <button onClick={() => toggleExpanded(item.id)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 12, padding: 0 }}>
                  {isOpen ? '▼' : '▶'}
                </button>
                <span style={{ flex: 1, color: '#f1f5f9', fontSize: 13 }}>{item.label || <span style={{ color: '#475569' }}>Untitled item</span>}</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#94a3b8', fontSize: 12 }}>
                  <input type="checkbox" checked={item.enabled} onChange={(e) => updateItem(idx, { enabled: e.target.checked })} />
                  Enabled
                </label>
                <button style={dangerBtn} onClick={() => removeItem(idx)}>Remove</button>
              </div>
              {isOpen && (
                <div style={{ padding: '0 12px 12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={lbl}>Label</label>
                      <input style={inp} value={item.label} onChange={(e) => updateItem(idx, { label: e.target.value })} placeholder="e.g. Overview" />
                    </div>
                    <div>
                      <label style={lbl}>Route (optional)</label>
                      <input style={inp} value={item.route} onChange={(e) => updateItem(idx, { route: e.target.value })} placeholder={`/products/${productId}/overview`} />
                    </div>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <label style={lbl}>Icon URL (optional)</label>
                    <UploadInput value={item.icon} onChange={(icon) => updateItem(idx, { icon })} accept="image/*" preview={false} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
