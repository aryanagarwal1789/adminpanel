import type { Block, Theme } from './types';

export type ChangeOrigin = 'mine' | 'theirs' | 'conflict';
export type ChangeKind = 'add' | 'remove' | 'edit' | 'reorder' | 'theme';
export interface MergeChange { id: string; origin: ChangeOrigin; kind: ChangeKind; blockId?: string; field?: string; index?: number; label: string; }
export interface MergeResult { mergedBlocks: Block[]; mergedTheme: Theme; changes: MergeChange[]; }
export interface MergeOpts { disabledChangeIds?: Set<string>; }

const key = (kind: ChangeKind, idOrField: string) => `${kind}:${idOrField}`;
const eq = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
// Compare block content ignoring positional `order`.
const sameContent = (a?: Block, b?: Block) =>
  !!a && !!b && eq({ ...a, order: 0 }, { ...b, order: 0 });

function byId(list: Block[]): Map<string, Block> {
  const m = new Map<string, Block>();
  for (const bl of list) m.set(bl.id, bl);
  return m;
}

export function mergePage(
  baseBlocks: Block[], theirsBlocks: Block[], mineBlocks: Block[],
  baseTheme: Theme, theirsTheme: Theme, mineTheme: Theme,
  opts: MergeOpts = {}
): MergeResult {
  const disabled = opts.disabledChangeIds ?? new Set<string>();
  const base = byId(baseBlocks), theirs = byId(theirsBlocks), mine = byId(mineBlocks);
  const changes: MergeChange[] = [];
  const merged = new Map<string, Block>(theirs); // start from theirs

  const allIds = new Set<string>([...base.keys(), ...theirs.keys(), ...mine.keys()]);
  for (const id of allIds) {
    const inBase = base.has(id), inTheirs = theirs.has(id), inMine = mine.has(id);

    // I added it (not in base, in mine).
    if (!inBase && inMine && !theirs.has(id)) {
      const ch: MergeChange = { id: key('add', id), origin: 'mine', kind: 'add', blockId: id, label: `Added block ${id}` };
      changes.push(ch);
      if (!disabled.has(ch.id)) merged.set(id, mine.get(id)!);
      continue;
    }
    // I removed it (in base, not in mine).
    if (inBase && !inMine) {
      const theirsChanged = inTheirs && !sameContent(base.get(id), theirs.get(id));
      const ch: MergeChange = {
        id: key('remove', id),
        origin: theirsChanged ? 'conflict' : 'mine',
        kind: 'remove', blockId: id, label: `Removed block ${id}`,
      };
      changes.push(ch);
      if (!disabled.has(ch.id)) merged.delete(id);
      continue;
    }
    // I edited it (in base & mine, content differs from base).
    if (inBase && inMine && !sameContent(base.get(id), mine.get(id))) {
      const theirsChanged = inTheirs && !sameContent(base.get(id), theirs.get(id));
      const theirsDeleted = !inTheirs;
      const conflict = theirsChanged || theirsDeleted;
      const ch: MergeChange = {
        id: key('edit', id),
        origin: conflict ? 'conflict' : 'mine',
        kind: 'edit', blockId: id,
        label: theirsDeleted ? `Re-added block ${id} you edited (they deleted it)` : `Edited block ${id}`,
      };
      changes.push(ch);
      if (!disabled.has(ch.id)) merged.set(id, mine.get(id)!);
      // when disabled + theirsDeleted, leave it removed; when disabled + theirsChanged, keep theirs (already in merged)
      continue;
    }
  }

  // --- Ordering: follow mine for ids present in mine; append theirs-only in theirs order.
  const mineOrder = mineBlocks.map((x) => x.id).filter((id) => merged.has(id));
  const theirsOnly = theirsBlocks.map((x) => x.id).filter((id) => merged.has(id) && !mine.has(id));
  const orderedIds = [...mineOrder, ...theirsOnly.filter((id) => !mineOrder.includes(id))];
  // include any merged ids not yet placed (e.g. my adds already in mineOrder; safety net)
  for (const id of merged.keys()) if (!orderedIds.includes(id)) orderedIds.push(id);

  const commonBaseOrder = baseBlocks.map((x) => x.id).filter((id) => mine.has(id));
  const commonMineOrder = mineBlocks.map((x) => x.id).filter((id) => base.has(id));
  if (!eq(commonBaseOrder, commonMineOrder)) {
    changes.push({ id: key('reorder', 'blocks'), origin: 'mine', kind: 'reorder', label: 'Reordered blocks' });
  }

  const mergedBlocks: Block[] = orderedIds.map((id, i) => ({ ...(merged.get(id) as Block), order: i }));

  // --- Theme (field-level).
  const mergedTheme: Theme = { ...(theirsTheme ?? {}) } as Theme;
  const themeFields = new Set<string>([
    ...Object.keys(baseTheme ?? {}), ...Object.keys(theirsTheme ?? {}), ...Object.keys(mineTheme ?? {}),
  ]);
  for (const f of themeFields) {
    const bv = (baseTheme as any)?.[f], tv = (theirsTheme as any)?.[f], mv = (mineTheme as any)?.[f];
    const iChanged = !eq(bv, mv);
    if (!iChanged) continue;
    const theyChanged = !eq(bv, tv);
    const ch: MergeChange = {
      id: key('theme', f),
      origin: theyChanged && !eq(tv, mv) ? 'conflict' : 'mine',
      kind: 'theme', field: f, label: `Theme: ${f}`,
    };
    changes.push(ch);
    if (!disabled.has(ch.id)) (mergedTheme as any)[f] = mv;
  }

  return { mergedBlocks, mergedTheme, changes };
}
