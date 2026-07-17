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
