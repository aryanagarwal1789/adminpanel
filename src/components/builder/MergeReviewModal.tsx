import type { MergeChange, MergeResult } from './merge';

interface Props {
  open: boolean;
  result: MergeResult;
  disabledIds: Set<string>;
  confirmLabel: string;      // 'Publish' | 'Save as draft'
  note: string;              // banner text, e.g. "Applied your changes on top of Priya's."
  onToggle: (changeId: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

const originColor: Record<MergeChange['origin'], string> = {
  mine: '#22c55e', theirs: '#38bdf8', conflict: '#f59e0b',
};

export function MergeReviewModal({ open, result, disabledIds, confirmLabel, note, onToggle, onCancel, onConfirm }: Props) {
  if (!open) return null;
  const mine = result.changes.filter((c) => c.origin === 'mine' || c.origin === 'conflict');
  const theirs = result.changes.filter((c) => c.origin === 'theirs');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="w-[720px] max-w-[92vw] max-h-[85vh] overflow-auto rounded-lg p-5" style={{ background: '#0f172a', color: '#e2e8f0' }}>
        <h2 className="text-base font-medium mb-1">Review merge</h2>
        <p className="text-xs pb-muted mb-4">{note}</p>

        <div className="text-xs font-medium mb-1">Applied from your draft</div>
        <ul className="mb-4 space-y-1">
          {mine.length === 0 && <li className="text-xs pb-muted">No changes from your draft.</li>}
          {mine.map((c) => (
            <li key={c.id} className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={!disabledIds.has(c.id)} onChange={() => onToggle(c.id)} />
              <span style={{ color: originColor[c.origin] }}>●</span>
              <span>{c.label}{c.origin === 'conflict' ? ' (conflict — mine wins)' : ''}</span>
            </li>
          ))}
        </ul>

        <div className="text-xs font-medium mb-1">From the latest version</div>
        <ul className="mb-4 space-y-1">
          {theirs.length === 0 && <li className="text-xs pb-muted">No incoming changes detected.</li>}
          {theirs.map((c) => (<li key={c.id} className="text-xs">{c.label}</li>))}
        </ul>

        <div className="flex justify-end gap-2">
          <button className="px-3 py-1.5 text-sm rounded-md border border-slate-600" onClick={onCancel}>Cancel</button>
          <button className="px-3 py-1.5 text-sm rounded-md font-medium text-white" style={{ background: '#22c55e' }} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
