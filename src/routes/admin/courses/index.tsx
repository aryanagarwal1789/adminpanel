import { createFileRoute } from '@tanstack/react-router';
import { authJsonHeaders } from '@/lib/auth';
import { useEffect, useRef, useState } from 'react';

export const Route = createFileRoute('/admin/courses/')({ component: CoursesPage });

const BACKEND = import.meta.env.VITE_BACKEND_URL ?? 'https://salescode-marketplace.salescode.ai';

interface Course {
  courseId: string;
  eyebrow: string;
  title: string;
  description: string;
  category: string;
  accent: string;
  icon: string;
  image: string;
  enabled: boolean;
  order: number;
  lessons?: unknown[];
}

// Same categories the SFA Learning Portal renders as filter chips
// (LearningPortal.tsx CAT_LABELS/CAT_COLORS). Keep the ids in sync.
const CATEGORIES = [
  { id: 'sales', label: 'Sales Teams' },
  { id: 'trade', label: 'Trade Partners' },
  { id: 'ir', label: 'Image Recognition' },
  { id: 'agents', label: 'AI Agents' },
  { id: 'plugin', label: 'AI Plugins' },
  { id: 'conn', label: 'Connectors' },
];

const BLANK_NEW: Omit<Course, 'order' | 'lessons'> = {
  courseId: '', eyebrow: 'AI Native', title: '', description: '', category: 'sales', accent: 'rgba(0,163,146,1)', icon: '', image: '', enabled: true,
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

function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [heading, setHeading] = useState('');
  const [subheading, setSubheading] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCourse, setNewCourse] = useState<Omit<Course, 'order' | 'lessons'>>({ ...BLANK_NEW });
  const [addSaving, setAddSaving] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const showToast = (t: Toast) => { setToast(t); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    fetch(`${BACKEND}/site/learning`)
      .then((r) => r.json())
      .then((d: { learning?: { heading?: string; subheading?: string; courses?: Course[] } }) => {
        const l = d.learning ?? {};
        setHeading(l.heading ?? '');
        setSubheading(l.subheading ?? '');
        setCourses([...(l.courses ?? [])].sort((a, b) => a.order - b.order));
      })
      .catch(() => showToast({ type: 'error', message: 'Failed to load learning portal' }))
      .finally(() => setLoading(false));
  }, []);

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch(`${BACKEND}/site/learning/settings`, {
        method: 'PUT', headers: authJsonHeaders(), body: JSON.stringify({ heading, subheading }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      showToast({ type: 'success', message: 'Portal copy saved' });
    } catch {
      showToast({ type: 'error', message: 'Save failed' });
    } finally { setSavingSettings(false); }
  };

  const toggleEnabled = async (c: Course) => {
    const nextEnabled = !c.enabled;
    setCourses((prev) => prev.map((x) => x.courseId === c.courseId ? { ...x, enabled: nextEnabled } : x));
    try {
      const res = await fetch(`${BACKEND}/site/learning/${c.courseId}`, {
        method: 'PUT', headers: authJsonHeaders(), body: JSON.stringify({ enabled: nextEnabled }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
    } catch {
      setCourses((prev) => prev.map((x) => x.courseId === c.courseId ? { ...x, enabled: c.enabled } : x));
      showToast({ type: 'error', message: 'Update failed' });
    }
  };

  const handleDelete = async (courseId: string) => {
    if (!window.confirm(`Delete course "${courseId}"?`)) return;
    try {
      const res = await fetch(`${BACKEND}/site/learning/${courseId}`, { method: 'DELETE', headers: authJsonHeaders() });
      if (!res.ok) throw new Error(`${res.status}`);
      setCourses((prev) => prev.filter((c) => c.courseId !== courseId));
      showToast({ type: 'success', message: 'Course deleted' });
    } catch {
      showToast({ type: 'error', message: 'Delete failed' });
    }
  };

  // Drag-and-drop reorder
  const dragItem = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const handleDrop = async (dropIdx: number) => {
    setDragOver(null);
    if (dragItem.current === null || dragItem.current === dropIdx) return;
    const from = dragItem.current;
    dragItem.current = null;
    const next = [...courses];
    const [moved] = next.splice(from, 1);
    next.splice(dropIdx, 0, moved);
    const reindexed = next.map((c, i) => ({ ...c, order: i }));
    setCourses(reindexed);
    try {
      const res = await fetch(`${BACKEND}/site/learning/reorder`, {
        method: 'PUT', headers: authJsonHeaders(), body: JSON.stringify({ order: reindexed.map((c) => c.courseId) }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
    } catch {
      showToast({ type: 'error', message: 'Reorder failed' });
    }
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.courseId.trim() || !newCourse.title.trim()) return;
    setAddSaving(true);
    try {
      const payload = {
        ...newCourse,
        courseId: newCourse.courseId.trim().toLowerCase().replace(/\s+/g, '-'),
        title: newCourse.title.trim(),
      };
      const res = await fetch(`${BACKEND}/site/learning`, {
        method: 'POST', headers: authJsonHeaders(), body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      setShowAddModal(false);
      setNewCourse({ ...BLANK_NEW });
      showToast({ type: 'success', message: 'Course created' });
      window.location.href = `/admin/courses/${payload.courseId}`;
    } catch {
      showToast({ type: 'error', message: 'Failed to create course' });
    } finally { setAddSaving(false); }
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
          <h1 style={{ color: '#f1f5f9', fontSize: 22, fontWeight: 700, margin: 0 }}>Learning Portal</h1>
          <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>Courses shown in the SFA app's Learning section. Drag to reorder; click Edit to manage lessons.</p>
        </div>
        <button style={saveBtn} onClick={() => { setNewCourse({ ...BLANK_NEW }); setShowAddModal(true); }}>
          + Add Course
        </button>
      </div>

      {/* Portal copy */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: 16, marginBottom: 24 }}>
        <div style={{ marginBottom: 12 }}>
          <label style={lbl}>Hero heading</label>
          <input style={inp} value={heading} onChange={(e) => setHeading(e.target.value)} placeholder="What would you like to explore?" />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={lbl}>Hero subheading</label>
          <textarea style={textareaStyle} value={subheading} onChange={(e) => setSubheading(e.target.value)} rows={2} />
        </div>
        <button style={saveBtn} onClick={saveSettings} disabled={savingSettings}>{savingSettings ? 'Saving…' : 'Save copy'}</button>
      </div>

      {loading ? (
        <div style={{ color: '#94a3b8', padding: 40, textAlign: 'center' }}>Loading…</div>
      ) : courses.length === 0 ? (
        <div style={{ color: '#64748b', fontSize: 14, padding: 32, textAlign: 'center' }}>
          No courses yet. Click <strong style={{ color: '#f1f5f9' }}>+ Add Course</strong> to create one.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
          {courses.map((c, idx) => (
            <div
              key={c.courseId}
              draggable
              onDragStart={() => { dragItem.current = idx; }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(idx); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => handleDrop(idx)}
              onDragEnd={() => { dragItem.current = null; setDragOver(null); }}
              style={{
                background: '#1e293b', borderRadius: 8, padding: 14,
                border: `1px solid ${dragOver === idx ? '#3b82f6' : '#334155'}`,
                opacity: c.enabled ? 1 : 0.55, display: 'flex', flexDirection: 'column', gap: 10,
                cursor: 'grab', transition: 'border-color 150ms',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 6, background: c.accent || '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                  {c.icon ? <img src={c.icon} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>{(c.title || c.courseId).charAt(0).toUpperCase()}</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#64748b', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{c.eyebrow}</div>
                  <div style={{ color: '#f1f5f9', fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title || c.courseId}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, fontSize: 11, color: '#64748b' }}>
                {c.category && <span style={{ padding: '2px 8px', borderRadius: 12, border: '1px solid #334155' }}>{c.category}</span>}
                <span style={{ padding: '2px 8px', borderRadius: 12, border: '1px solid #334155' }}>{(c.lessons?.length ?? 0)} lessons</span>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#94a3b8', fontSize: 12, flex: 1 }}>
                  <input type="checkbox" checked={c.enabled} onChange={() => toggleEnabled(c)} />
                  Visible
                </label>
                <a href={`/admin/courses/${c.courseId}`} style={{ ...secBtn, textDecoration: 'none', display: 'inline-block' }}>Edit</a>
                <button style={dangerBtn} onClick={() => handleDelete(c.courseId)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowAddModal(false)}>
          <div style={{ background: '#1e293b', borderRadius: 12, padding: '28px 32px', width: 480, maxWidth: '95vw', boxShadow: '0 8px 40px rgba(0,0,0,0.4)', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>Add New Course</h3>
            <form onSubmit={handleAddCourse}>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Course ID <span style={{ color: '#ef4444' }}>*</span></label>
                <input style={inp} value={newCourse.courseId} onChange={(e) => setNewCourse((p) => ({ ...p, courseId: e.target.value }))} placeholder="e.g. sfa (slug, no spaces)" required autoFocus />
                <span style={{ fontSize: 11, color: '#64748b', marginTop: 3, display: 'block' }}>Unique identifier. Cannot be changed later.</span>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Eyebrow</label>
                <input style={inp} value={newCourse.eyebrow} onChange={(e) => setNewCourse((p) => ({ ...p, eyebrow: e.target.value }))} placeholder="e.g. AI Native" />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Title <span style={{ color: '#ef4444' }}>*</span></label>
                <input style={inp} value={newCourse.title} onChange={(e) => setNewCourse((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. SFA" required />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Category</label>
                <select style={selectStyle} value={newCourse.category} onChange={(e) => setNewCourse((p) => ({ ...p, category: e.target.value }))}>
                  {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Description</label>
                <textarea style={textareaStyle} value={newCourse.description} onChange={(e) => setNewCourse((p) => ({ ...p, description: e.target.value }))} rows={2} />
              </div>
              <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                <label style={{ ...lbl, margin: 0 }}>Visible</label>
                <input type="checkbox" checked={newCourse.enabled} onChange={(e) => setNewCourse((p) => ({ ...p, enabled: e.target.checked }))} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="submit" style={{ ...saveBtn, flex: 1 }} disabled={addSaving}>{addSaving ? 'Creating…' : 'Create Course'}</button>
                <button type="button" style={secBtn} onClick={() => setShowAddModal(false)} disabled={addSaving}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
