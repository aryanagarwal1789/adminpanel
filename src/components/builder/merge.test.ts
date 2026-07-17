import { describe, it, expect } from 'vitest';
import { mergePage } from './merge';
import type { Block, Theme } from './types';

const b = (id: string, order: number, fields: Record<string, unknown> = {}): Block =>
  ({ id, type: 'text', fields, style: {}, order } as unknown as Block);

describe('mergePage — blocks', () => {
  it('applies my added block onto theirs', () => {
    const base = [b('a', 0)];
    const theirs = [b('a', 0)];
    const mine = [b('a', 0), b('z', 1)];
    const r = mergePage(base, theirs, mine, {} as Theme, {} as Theme, {} as Theme);
    expect(r.mergedBlocks.map((x) => x.id)).toEqual(['a', 'z']);
    expect(r.changes.some((c) => c.kind === 'add' && c.blockId === 'z' && c.origin === 'mine')).toBe(true);
  });

  it('applies my removal onto theirs', () => {
    const base = [b('a', 0), b('b', 1)];
    const theirs = [b('a', 0), b('b', 1)];
    const mine = [b('a', 0)];
    const r = mergePage(base, theirs, mine, {} as Theme, {} as Theme, {} as Theme);
    expect(r.mergedBlocks.map((x) => x.id)).toEqual(['a']);
    expect(r.changes.some((c) => c.kind === 'remove' && c.blockId === 'b')).toBe(true);
  });

  it('keeps a block theirs added that I never had', () => {
    const base = [b('a', 0)];
    const theirs = [b('a', 0), b('t', 1)];
    const mine = [b('a', 0)];
    const r = mergePage(base, theirs, mine, {} as Theme, {} as Theme, {} as Theme);
    expect(r.mergedBlocks.map((x) => x.id).sort()).toEqual(['a', 't']);
  });

  it('mine wins on a conflicting edit and flags a conflict', () => {
    const base = [b('a', 0, { text: 'base' })];
    const theirs = [b('a', 0, { text: 'theirs' })];
    const mine = [b('a', 0, { text: 'mine' })];
    const r = mergePage(base, theirs, mine, {} as Theme, {} as Theme, {} as Theme);
    expect((r.mergedBlocks[0].fields as any).text).toBe('mine');
    expect(r.changes.some((c) => c.kind === 'edit' && c.origin === 'conflict' && c.blockId === 'a')).toBe(true);
  });

  it('re-adds a block I edited that theirs deleted, as a conflict', () => {
    const base = [b('a', 0, { text: 'base' })];
    const theirs: Block[] = [];
    const mine = [b('a', 0, { text: 'mine' })];
    const r = mergePage(base, theirs, mine, {} as Theme, {} as Theme, {} as Theme);
    expect(r.mergedBlocks.map((x) => x.id)).toEqual(['a']);
    expect(r.changes.some((c) => c.blockId === 'a' && c.origin === 'conflict')).toBe(true);
  });

  it('disabling my edit change falls back to theirs', () => {
    const base = [b('a', 0, { text: 'base' })];
    const theirs = [b('a', 0, { text: 'theirs' })];
    const mine = [b('a', 0, { text: 'mine' })];
    const first = mergePage(base, theirs, mine, {} as Theme, {} as Theme, {} as Theme);
    const editChange = first.changes.find((c) => c.kind === 'edit')!;
    const r = mergePage(base, theirs, mine, {} as Theme, {} as Theme, {} as Theme, { disabledChangeIds: new Set([editChange.id]) });
    expect((r.mergedBlocks[0].fields as any).text).toBe('theirs');
  });
});

describe('mergePage — theme', () => {
  it('mine wins on a conflicting theme field', () => {
    const r = mergePage([], [], [], { accent: '#000' } as Theme, { accent: '#111' } as Theme, { accent: '#222' } as Theme);
    expect((r.mergedTheme as any).accent).toBe('#222');
    expect(r.changes.some((c) => c.kind === 'theme' && c.field === 'accent' && c.origin === 'conflict')).toBe(true);
  });
});

describe('mergePage — reorder', () => {
  it('flags reorder when my order of common blocks differs from theirs', () => {
    const base = [b('a', 0), b('b', 1)];
    const theirs = [b('a', 0), b('b', 1)];
    const mine = [b('b', 0), b('a', 1)];
    const r = mergePage(base, theirs, mine, {} as Theme, {} as Theme, {} as Theme);
    expect(r.mergedBlocks.map((x) => x.id)).toEqual(['b', 'a']);
    expect(r.changes.some((c) => c.kind === 'reorder')).toBe(true);
  });
  it('does NOT flag reorder when my order equals theirs', () => {
    const base = [b('a', 0), b('b', 1)];
    const theirs = [b('b', 0), b('a', 1)];
    const mine = [b('b', 0), b('a', 1)];
    const r = mergePage(base, theirs, mine, {} as Theme, {} as Theme, {} as Theme);
    expect(r.changes.some((c) => c.kind === 'reorder')).toBe(false);
  });
  it('disabling the reorder change falls back to theirs order', () => {
    const base = [b('a', 0), b('b', 1)];
    const theirs = [b('a', 0), b('b', 1)];
    const mine = [b('b', 0), b('a', 1)];
    const first = mergePage(base, theirs, mine, {} as Theme, {} as Theme, {} as Theme);
    const rid = first.changes.find((c) => c.kind === 'reorder')!.id;
    const r = mergePage(base, theirs, mine, {} as Theme, {} as Theme, {} as Theme, { disabledChangeIds: new Set([rid]) });
    expect(r.mergedBlocks.map((x) => x.id)).toEqual(['a', 'b']);
  });
});

describe('mergePage — same-id add collision', () => {
  it('mine wins and flags a conflict when both add the same id with different content', () => {
    const base = [b('a', 0)];
    const theirs = [b('a', 0), b('z', 1, { t: 'theirs' })];
    const mine = [b('a', 0), b('z', 1, { t: 'mine' })];
    const r = mergePage(base, theirs, mine, {} as Theme, {} as Theme, {} as Theme);
    const z = r.mergedBlocks.find((x) => x.id === 'z')!;
    expect((z.fields as any).t).toBe('mine');
    expect(r.changes.some((c) => c.blockId === 'z' && c.origin === 'conflict')).toBe(true);
  });
});
