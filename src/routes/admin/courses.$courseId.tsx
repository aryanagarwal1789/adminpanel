import { createFileRoute } from '@tanstack/react-router';
import { authJsonHeaders } from '@/lib/auth';
import { useEffect, useRef, useState } from 'react';
import { UploadInput } from './upload-input';

export const Route = createFileRoute('/admin/courses/$courseId')({ component: CourseDetailPage });

const BACKEND = import.meta.env.VITE_BACKEND_URL ?? 'https://salescode-marketplace.salescode.ai';

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

interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  videoUrl: string;
  thumbnail: string;
  order: number;
}

interface CourseDetails {
  eyebrow: string;
  title: string;
  description: string;
  category: string;
  accent: string;
  icon: string;
  image: string;
}

interface Course extends CourseDetails {
  courseId: string;
  enabled: boolean;
  lessons?: Lesson[];
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

function blankLesson(): Lesson {
  return { id: `lesson-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, title: '', description: '', duration: '', videoUrl: '', thumbnail: '', order: 0 };
}

function CourseDetailPage() {
  const { courseId } = Route.useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [details, setDetails] = useState<CourseDetails>({
    eyebrow: '', title: '', description: '', category: '', accent: 'rgba(0,163,146,1)', icon: '', image: '',
  });
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(true);
  const [savingDetails, setSavingDetails] = useState(false);
  const [savingLessons, setSavingLessons] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  const showToast = (t: Toast) => { setToast(t); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    fetch(`${BACKEND}/site/learning/${courseId}`)
      .then((r) => r.json())
      .then((data: { course?: Course }) => {
        const c = data.course;
        if (!c) return;
        setCourse(c);
        setDetails({
          eyebrow: c.eyebrow ?? '', title: c.title ?? '', description: c.description ?? '',
          category: c.category ?? '', accent: c.accent ?? 'rgba(0,163,146,1)', icon: c.icon ?? '', image: c.image ?? '',
        });
        setLessons([...(c.lessons ?? [])].sort((a, b) => a.order - b.order));
      })
      .catch(() => showToast({ type: 'error', message: 'Failed to load course' }))
      .finally(() => setLoading(false));
  }, [courseId]);

  const ud = (patch: Partial<CourseDetails>) => setDetails((d) => ({ ...d, ...patch }));

  const saveDetails = async () => {
    setSavingDetails(true);
    try {
      const res = await fetch(`${BACKEND}/site/learning/${courseId}`, {
        method: 'PUT', headers: authJsonHeaders(), body: JSON.stringify(details),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = (await res.json()) as { course?: Course };
      if (data.course) setCourse(data.course);
      showToast({ type: 'success', message: 'Course details saved' });
    } catch {
      showToast({ type: 'error', message: 'Save failed' });
    } finally { setSavingDetails(false); }
  };

  const saveLessons = async () => {
    setSavingLessons(true);
    try {
      const payload = lessons.map((l, i) => ({ ...l, order: i }));
      const res = await fetch(`${BACKEND}/site/learning/${courseId}/lessons`, {
        method: 'PUT', headers: authJsonHeaders(), body: JSON.stringify({ lessons: payload }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      showToast({ type: 'success', message: 'Lessons saved' });
    } catch {
      showToast({ type: 'error', message: 'Save failed' });
    } finally { setSavingLessons(false); }
  };

  const updateLesson = (idx: number, patch: Partial<Lesson>) =>
    setLessons((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  const removeLesson = (idx: number) => setLessons((prev) => prev.filter((_, i) => i !== idx));
  const addLesson = () => {
    const l = blankLesson();
    setLessons((prev) => [...prev, l]);
    setExpanded((prev) => new Set(prev).add(l.id));
  };
  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Drag-and-drop reorder (same pattern as the course list).
  const dragItem = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const handleLessonDrop = (dropIdx: number) => {
    setDragOver(null);
    if (dragItem.current === null || dragItem.current === dropIdx) return;
    const from = dragItem.current;
    dragItem.current = null;
    setLessons((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(dropIdx, 0, moved);
      return next;
    });
  };

  if (loading) return <div style={{ color: '#94a3b8', padding: 40, textAlign: 'center' }}>Loading…</div>;
  if (!course) return <div style={{ color: '#94a3b8', padding: 40, textAlign: 'center' }}>Course not found.</div>;

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
            <a href="/admin/courses" style={{ color: '#94a3b8', fontSize: 13, textDecoration: 'none' }}>← All Courses</a>
          </div>
          <h1 style={{ color: '#f1f5f9', fontSize: 22, fontWeight: 700, margin: 0 }}>{details.title || course.courseId}</h1>
          <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>Edit course details and its lessons</p>
        </div>
        <button style={saveBtn} onClick={saveDetails} disabled={savingDetails}>{savingDetails ? 'Saving…' : 'Save Details'}</button>
      </div>

      {/* Course details */}
      <div style={card}>
        <div style={cardTitle}>Course Details</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={lbl}>Eyebrow</label>
            <input style={inp} value={details.eyebrow} onChange={(e) => ud({ eyebrow: e.target.value })} placeholder="e.g. AI Native" />
          </div>
          <div>
            <label style={lbl}>Title</label>
            <input style={inp} value={details.title} onChange={(e) => ud({ title: e.target.value })} placeholder="e.g. SFA" />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
          <div>
            <label style={lbl}>Category</label>
            <select style={selectStyle} value={details.category} onChange={(e) => ud({ category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <span style={{ fontSize: 11, color: '#64748b', marginTop: 4, display: 'block' }}>The card accent color is derived from the category automatically.</span>
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <label style={lbl}>Description</label>
          <textarea style={textareaStyle} value={details.description} onChange={(e) => ud({ description: e.target.value })} placeholder="Shown on the course detail banner" rows={2} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
          <div>
            <label style={lbl}>Icon image (optional)</label>
            <UploadInput value={details.icon} onChange={(icon) => ud({ icon })} accept="image/*" />
          </div>
          <div>
            <label style={lbl}>Card thumbnail (optional)</label>
            <UploadInput value={details.image} onChange={(image) => ud({ image })} accept="image/*" />
          </div>
        </div>
      </div>

      {/* Lessons */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={cardTitle}>Lessons</div>
            <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>{lessons.length} lesson{lessons.length !== 1 ? 's' : ''}. Each lesson plays a YouTube or direct video URL.</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={secBtn} onClick={addLesson}>+ Add lesson</button>
            <button style={saveBtn} onClick={saveLessons} disabled={savingLessons}>{savingLessons ? 'Saving…' : 'Save lessons'}</button>
          </div>
        </div>

        {lessons.length === 0 && (
          <div style={{ color: '#64748b', fontSize: 13, padding: '12px 0' }}>No lessons yet. Add one to start building the course.</div>
        )}

        {lessons.map((l, idx) => {
          const isOpen = expanded.has(l.id);
          return (
            <div
              key={l.id}
              draggable
              onDragStart={() => { dragItem.current = idx; }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(idx); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => handleLessonDrop(idx)}
              onDragEnd={() => { dragItem.current = null; setDragOver(null); }}
              style={{
                background: '#0f172a', borderRadius: 6, marginBottom: 8,
                border: `1px solid ${dragOver === idx ? '#3b82f6' : '#334155'}`,
                boxShadow: dragOver === idx ? '0 0 0 2px rgba(59,130,246,0.3)' : 'none',
                transition: 'border-color 150ms',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>
                <span style={{ cursor: 'grab', color: '#64748b', flexShrink: 0, display: 'flex' }} title="Drag to reorder">
                  <svg width="10" height="16" viewBox="0 0 10 16" fill="none"><circle cx="2" cy="2" r="1.5" fill="currentColor"/><circle cx="8" cy="2" r="1.5" fill="currentColor"/><circle cx="2" cy="8" r="1.5" fill="currentColor"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="2" cy="14" r="1.5" fill="currentColor"/><circle cx="8" cy="14" r="1.5" fill="currentColor"/></svg>
                </span>
                <button onClick={() => toggleExpanded(l.id)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 12, padding: 0 }}>{isOpen ? '▼' : '▶'}</button>
                <span style={{ color: '#475569', fontSize: 12, width: 20 }}>{idx + 1}</span>
                <span style={{ flex: 1, color: '#f1f5f9', fontSize: 13 }}>{l.title || <span style={{ color: '#475569' }}>Untitled lesson</span>}</span>
                {l.duration && <span style={{ color: '#64748b', fontSize: 12 }}>{l.duration}</span>}
                <button style={dangerBtn} onClick={() => removeLesson(idx)}>Remove</button>
              </div>
              {isOpen && (
                <div style={{ padding: '0 12px 12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 10 }}>
                    <div>
                      <label style={lbl}>Title</label>
                      <input style={inp} value={l.title} onChange={(e) => updateLesson(idx, { title: e.target.value })} placeholder="e.g. Getting started with SFA" />
                    </div>
                    <div>
                      <label style={lbl}>Duration</label>
                      <input style={inp} value={l.duration} onChange={(e) => updateLesson(idx, { duration: e.target.value })} placeholder="21:52" />
                    </div>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <label style={lbl}>Description</label>
                    <textarea style={textareaStyle} value={l.description} onChange={(e) => updateLesson(idx, { description: e.target.value })} rows={2} />
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <label style={lbl}>Video URL (paste a YouTube link, or upload a direct .mp4 / HLS file)</label>
                    <UploadInput value={l.videoUrl} onChange={(videoUrl) => updateLesson(idx, { videoUrl })} accept="video/*" preview={false} allowPaste placeholder="youtube.com/watch?v=… or youtu.be/… — or upload a file" />
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <label style={lbl}>Thumbnail (optional — shown in the playlist and as the video poster)</label>
                    <UploadInput value={l.thumbnail} onChange={(thumbnail) => updateLesson(idx, { thumbnail })} accept="image/*" />
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
