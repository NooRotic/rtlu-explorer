// test/budget.test.js
import { describe, it, expect } from 'vitest';
import { clampBudget, BUDGET_STOPS, budgetStorageKey, DEFAULT_BUDGET } from '../src/engine/budget.js';

describe('budget math', () => {
  it('exposes labeled stops including the full snapshot', () => {
    expect(BUDGET_STOPS.map((s) => s.value)).toContain(250);
    expect(BUDGET_STOPS.map((s) => s.value)).toContain(500);
    expect(BUDGET_STOPS.map((s) => s.value)).toContain(1000);
    expect(BUDGET_STOPS[BUDGET_STOPS.length - 1].label).toMatch(/all/i);
  });

  it('defaults to the median-machine position (300-500)', () => {
    expect(DEFAULT_BUDGET).toBeGreaterThanOrEqual(300);
    expect(DEFAULT_BUDGET).toBeLessThanOrEqual(500);
  });

  it('clamps to [1, total]', () => {
    expect(clampBudget(99999, 2559)).toBe(2559);
    expect(clampBudget(0, 2559)).toBe(1);
    expect(clampBudget(400, 2559)).toBe(400);
  });

  it('namespaces persistence per artist', () => {
    expect(budgetStorageKey('wu-tang')).toBe('rtlu.nodeBudget.wu-tang');
  });
});
