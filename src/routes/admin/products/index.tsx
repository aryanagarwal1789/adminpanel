import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { usePublishOtp, PublishOtpModal } from '@/lib/otpPublish';
import { LastUpdatedBy } from '@/lib/lastUpdated';

export const Route = createFileRoute('/admin/products/')({ component: ProductsPage });

const BACKEND = import.meta.env.VITE_BACKEND_URL ?? 'https://salescode-marketplace.salescode.ai';

interface Product {
  productId: string;
  name: string;
  description: string;
  image: string;
  category: string;
  status: string;
  highlight: string;
  enabled: boolean;
  order: number;
  lastUpdatedBy?: string | null;
  lastUpdatedAt?: string | null;
}

const DEFAULT_CATEGORIES = [
  { id: 'applications', label: 'Applications' },
  { id: 'ai-agents', label: 'AI Agents' },
  { id: 'trade-solutions', label: 'Trade Solutions' },
  { id: 'image-recognition', label: 'Image Recognition' },
  { id: 'plugins', label: 'Plugins' },
  { id: 'integrations', label: 'Integrations' },
];

type CategoryId = typeof DEFAULT_CATEGORIES[number]['id'];

const BLANK_NEW: Omit<Product, 'order'> = {
  productId: '', name: '', description: '', image: '', category: 'applications', status: '', highlight: '', enabled: true,
};

type Toast = { type: 'success' | 'error'; message: string } | null;

const inp: React.CSSProperties = {
  background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9',
  borderRadius: 6, padding: '8px 12px', width: '100%', boxSizing: 'border-box', fontSize: 13,
};
const textareaStyle: React.CSSProperties = { ...inp, resize: 'vertical', minHeight: 60 };
const selectStyle: React.CSSProperties = { ...inp };
const lbl: React.CSSProperties = { color: '#94a3b8', fontSize: 13, marginBottom: 6, display: 'block' };
const saveBtn: React.CSSProperties = { background: '#3b82f6', color: '#fff', padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 };
const secBtn: React.CSSProperties = { background: 'transparent', color: '#94a3b8', padding: '6px 12px', borderRadius: 6, border: '1px solid #334155', cursor: 'pointer', fontSize: 13 };
const dangerBtn: React.CSSProperties = { ...secBtn, color: '#ef4444', borderColor: '#ef4444' };

function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState<Omit<Product, 'order'>>({ ...BLANK_NEW });

  const showToast = (t: Toast) => {
    setToast(t);
    setTimeout(() => setToast(null), 3000);
  };

  // Every write on this page is OTP-gated (see /site/content-otp on the
  // backend) — each action below just stages the change and opens the verify
  // modal instead of writing directly.
  const otp = usePublishOtp((body: { product?: Product; productId?: string }, action: string) => {
    if (action === 'products.create') {
      if (body.product) setProducts((prev) => [...prev, body.product!]);
      setShowAddModal(false);
      setNewProduct({ ...BLANK_NEW });
      showToast({ type: 'success', message: 'Product created' });
      if (body.product?.productId) window.location.href = `/admin/products/${body.product.productId}`;
    } else if (action === 'products.update') {
      if (body.product) {
        setProducts((prev) => prev.map((p) => (p.productId === body.product!.productId ? { ...p, ...body.product } : p)));
      }
      showToast({ type: 'success', message: 'Product updated' });
    } else if (action === 'products.delete') {
      setProducts((prev) => prev.filter((p) => p.productId !== body.productId));
      showToast({ type: 'success', message: 'Product deleted' });
    } else if (action === 'products.reorder') {
      showToast({ type: 'success', message: 'Order saved' });
    }
  });

  useEffect(() => {
    fetch(`${BACKEND}/site/products`)
      .then((r) => r.json())
      .then((d: { products?: Product[] }) => {
        const loaded = d.products ?? [];
        setProducts(loaded);
        // Derive category order from minimum product order — same logic as public page
        const catMinOrder: Record<string, number> = {};
        for (const p of loaded) {
          const key = catMinOrder[p.category] !== undefined ? p.category : p.category;
          if (catMinOrder[p.category] === undefined || p.order < catMinOrder[p.category]) {
            catMinOrder[p.category] = p.order;
          }
        }
        setCategories((prev) =>
          [...prev].sort((a, b) => (catMinOrder[a.id] ?? 999) - (catMinOrder[b.id] ?? 999))
        );
      })
      .catch(() => showToast({ type: 'error', message: 'Failed to load products' }))
      .finally(() => setLoading(false));
  }, []);

  const grouped = useMemo(() => {
    const bucket: Record<string, Product[]> = Object.fromEntries(categories.map((c) => [c.id, []]));
    for (const p of products) {
      const key = bucket[p.category] ? p.category : 'applications';
      bucket[key].push(p);
    }
    for (const key of Object.keys(bucket)) {
      bucket[key].sort((a, b) => a.order - b.order);
    }
    return bucket as Record<CategoryId, Product[]>;
  }, [products, categories]);

  // ── Category drag-and-drop ────────────────────────────────────────────────
  const dragCatItem = useRef<number | null>(null);
  const [dragOverCat, setDragOverCat] = useState<number | null>(null);

  const handleCatDragStart = (idx: number) => { dragCatItem.current = idx; };

  const handleCatDrop = (dropIdx: number) => {
    setDragOverCat(null);
    if (dragCatItem.current === null || dragCatItem.current === dropIdx) return;
    const fromIdx = dragCatItem.current;
    dragCatItem.current = null;
    const next = [...categories];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(dropIdx, 0, moved);
    setCategories(next);
    // Reorder all products to reflect new category order
    const newOrder = next.flatMap((c) => (grouped[c.id as CategoryId] ?? []).map(p => p.productId));
    otp.open('products.reorder', { order: newOrder });
  };

  const toggleEnabled = (p: Product) => {
    otp.open('products.update', { enabled: !p.enabled }, { productId: p.productId });
  };

  const handleDelete = (productId: string) => {
    if (!window.confirm(`Delete product "${productId}"?`)) return;
    otp.open('products.delete', {}, { productId });
  };

  // Drag-and-drop state
  const dragItem = useRef<{ categoryId: string; idx: number } | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  const handleDragStart = (categoryId: string, idx: number) => {
    dragItem.current = { categoryId, idx };
  };

  const handleDrop = (categoryId: string, dropIdx: number) => {
    setDragOverKey(null);
    if (!dragItem.current) return;
    const { categoryId: fromCat, idx: fromIdx } = dragItem.current;
    dragItem.current = null;
    // Only reorder within the same category
    if (fromCat !== categoryId || fromIdx === dropIdx) return;
    const catItems = [...(grouped[categoryId as CategoryId] ?? [])];
    const [moved] = catItems.splice(fromIdx, 1);
    catItems.splice(dropIdx, 0, moved);
    const otherProducts = products.filter((p) => p.category !== categoryId);
    const updatedCatItems = catItems.map((p, i) => ({ ...p, order: otherProducts.length + i }));
    setProducts([...otherProducts, ...updatedCatItems]);
    otp.open('products.reorder', { order: [...otherProducts.map(p => p.productId), ...catItems.map(p => p.productId)] });
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.productId.trim() || !newProduct.name.trim()) return;
    const payload = {
      ...newProduct,
      productId: newProduct.productId.trim().toLowerCase().replace(/\s+/g, '-'),
      name: newProduct.name.trim(),
      description: newProduct.description.trim(),
      highlight: newProduct.highlight.trim(),
      status: newProduct.status || null,
    };
    otp.open('products.create', payload);
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
          <h1 style={{ color: '#f1f5f9', fontSize: 22, fontWeight: 700, margin: 0 }}>Products</h1>
          <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>Drag cards to reorder within a category. Toggle visibility or click Edit to configure details.</p>
        </div>
        <button style={saveBtn} onClick={() => { setNewProduct({ ...BLANK_NEW }); setShowAddModal(true); }}>
          + Add Product
        </button>
      </div>

      <PublishOtpModal otp={otp} title="Verify to save product changes" />

      {loading ? (
        <div style={{ color: '#94a3b8', padding: 40, textAlign: 'center' }}>Loading…</div>
      ) : products.length === 0 ? (
        <div style={{ color: '#64748b', fontSize: 14, padding: 32, textAlign: 'center' }}>
          No products found. Click <strong style={{ color: '#f1f5f9' }}>+ Add Product</strong> to create one.
        </div>
      ) : (
        <div>
          {categories.map((cat, catIdx) => {
            const items = grouped[cat.id as CategoryId];
            if (!items || items.length === 0) return null;
            return (
              <div
                key={cat.id}
                draggable
                onDragStart={(e) => { e.stopPropagation(); handleCatDragStart(catIdx); }}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverCat(catIdx); }}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverCat(null); }}
                onDrop={(e) => { e.stopPropagation(); handleCatDrop(catIdx); }}
                onDragEnd={() => { dragCatItem.current = null; setDragOverCat(null); }}
                style={{
                  marginBottom: 28,
                  borderRadius: 8,
                  border: `2px solid ${dragOverCat === catIdx ? '#3b82f6' : 'transparent'}`,
                  transition: 'border-color 150ms',
                  padding: dragOverCat === catIdx ? '8px' : '0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, cursor: 'grab' }}>
                  {/* Drag handle */}
                  <svg width="12" height="16" viewBox="0 0 12 16" fill="none" style={{ flexShrink: 0, opacity: 0.4 }}>
                    <circle cx="3" cy="3" r="1.5" fill="#94a3b8"/><circle cx="9" cy="3" r="1.5" fill="#94a3b8"/>
                    <circle cx="3" cy="8" r="1.5" fill="#94a3b8"/><circle cx="9" cy="8" r="1.5" fill="#94a3b8"/>
                    <circle cx="3" cy="13" r="1.5" fill="#94a3b8"/><circle cx="9" cy="13" r="1.5" fill="#94a3b8"/>
                  </svg>
                  <div style={{ width: 3, height: 16, background: '#3b82f6', borderRadius: 2 }} />
                  <span style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{cat.label}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
                  {items.map((p, pIdx) => (
                    <div
                      key={p.productId}
                      draggable
                      onDragStart={() => handleDragStart(cat.id, pIdx)}
                      onDragOver={(e) => { e.preventDefault(); setDragOverKey(`${cat.id}-${pIdx}`); }}
                      onDragLeave={() => setDragOverKey(null)}
                      onDrop={() => handleDrop(cat.id, pIdx)}
                      onDragEnd={() => { dragItem.current = null; setDragOverKey(null); }}
                      style={{
                        background: '#1e293b', borderRadius: 8, padding: 14,
                        border: `1px solid ${dragOverKey === `${cat.id}-${pIdx}` ? '#3b82f6' : '#334155'}`,
                        opacity: p.enabled ? 1 : 0.55, display: 'flex', flexDirection: 'column', gap: 10,
                        cursor: 'grab', transition: 'border-color 150ms',
                        boxShadow: dragOverKey === `${cat.id}-${pIdx}` ? '0 0 0 2px rgba(59,130,246,0.3)' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {p.image ? (
                          <img src={p.image} alt="" style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 6, border: '1px solid #334155', background: '#0f172a', padding: 4 }} />
                        ) : (
                          <div style={{ width: 36, height: 36, borderRadius: 6, border: '1px solid #334155', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#64748b' }}>
                            {(p.name || p.productId).charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: '#f1f5f9', fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name || p.productId}</div>
                          {p.description && (
                            <div style={{ color: '#64748b', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description}</div>
                          )}
                        </div>
                      </div>
                      {p.status && (
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, border: '1px solid #334155', color: '#94a3b8', width: 'fit-content' }}>{p.status}</span>
                      )}
                      <LastUpdatedBy by={p.lastUpdatedBy} at={p.lastUpdatedAt} />
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#94a3b8', fontSize: 12, flex: 1 }}>
                          <input type="checkbox" checked={p.enabled} onChange={() => toggleEnabled(p)} />
                          Visible
                        </label>
                        <a
                          href={`/admin/products/${p.productId}`}
                          style={{ ...secBtn, textDecoration: 'none', display: 'inline-block' }}
                        >
                          Edit
                        </a>
                        <button style={dangerBtn} onClick={() => handleDelete(p.productId)}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            style={{ background: '#1e293b', borderRadius: 12, padding: '28px 32px', width: 480, maxWidth: '95vw', boxShadow: '0 8px 40px rgba(0,0,0,0.4)', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>Add New Product</h3>
            <form onSubmit={handleAddProduct}>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Product ID <span style={{ color: '#ef4444' }}>*</span></label>
                <input style={inp} value={newProduct.productId} onChange={(e) => setNewProduct((p) => ({ ...p, productId: e.target.value }))} placeholder="e.g. sfa-rural (slug, no spaces)" required autoFocus />
                <span style={{ fontSize: 11, color: '#64748b', marginTop: 3, display: 'block' }}>Unique identifier used in URLs. Cannot be changed later.</span>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input style={inp} value={newProduct.name} onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. NextGen SFA Rural" required />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Description</label>
                <textarea style={textareaStyle} value={newProduct.description} onChange={(e) => setNewProduct((p) => ({ ...p, description: e.target.value }))} placeholder="Short line shown under the product title" rows={2} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Category</label>
                <select style={selectStyle} value={newProduct.category} onChange={(e) => setNewProduct((p) => ({ ...p, category: e.target.value }))}>
                  {DEFAULT_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Status</label>
                <select style={selectStyle} value={newProduct.status} onChange={(e) => setNewProduct((p) => ({ ...p, status: e.target.value }))}>
                  <option value="">None</option>
                  <option value="live">Live</option>
                  <option value="beta">Beta</option>
                  <option value="upcoming">Coming Soon</option>
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Highlight badge</label>
                <input style={inp} value={newProduct.highlight} onChange={(e) => setNewProduct((p) => ({ ...p, highlight: e.target.value }))} placeholder="e.g. +22% Coverage" />
              </div>
              <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                <label style={{ ...lbl, margin: 0 }}>Visible on site</label>
                <input type="checkbox" checked={newProduct.enabled} onChange={(e) => setNewProduct((p) => ({ ...p, enabled: e.target.checked }))} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="submit" style={{ ...saveBtn, flex: 1 }}>Create Product</button>
                <button type="button" style={secBtn} onClick={() => setShowAddModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
