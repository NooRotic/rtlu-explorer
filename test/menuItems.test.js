import { describe, it, expect } from 'vitest';
import { menuItemsFor } from '../src/ui/menuItems.js';

describe('menuItemsFor', () => {
  it('returns the full node menu in order, divider before an accented reset', () => {
    const items = menuItemsFor({ id: 'a', name: 'GZA' });
    expect(items.filter((i) => i.id).map((i) => i.id)).toEqual(['isolate', 'dossier', 'fly', 'copy', 'reset']);
    const divIdx = items.findIndex((i) => i.divider);
    const resetIdx = items.findIndex((i) => i.id === 'reset');
    expect(divIdx).toBeGreaterThan(-1);
    expect(divIdx).toBeLessThan(resetIdx);
    expect(items.find((i) => i.id === 'reset').accent).toBe(true);
  });

  it('returns only Reset for the background (null target)', () => {
    expect(menuItemsFor(null)).toEqual([{ id: 'reset', label: 'Reset view', accent: true }]);
  });
});
