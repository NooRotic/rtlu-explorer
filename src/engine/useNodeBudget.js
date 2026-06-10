// src/engine/useNodeBudget.js
import { useCallback, useEffect, useState } from 'react';
import { clampBudget, budgetStorageKey, DEFAULT_BUDGET } from './budget.js';

// Treat a not-yet-known total (0 / undefined — e.g. the first render before the snapshot loads)
// as "no ceiling yet". Clamping against total=0 would pin the budget to 1 node and never recover;
// we instead leave it uncapped until the real total arrives, then re-clamp (effect below).
function safeClamp(n, total) {
  const ceiling = total && total > 0 ? total : Infinity;
  return clampBudget(n, ceiling);
}

/** Persisted node-budget state. Reads/writes localStorage under a per-artist key. */
export function useNodeBudget(artistId, total) {
  const key = budgetStorageKey(artistId);
  const [budget, setBudgetState] = useState(() => {
    try {
      const raw = globalThis.localStorage?.getItem(key);
      return safeClamp(raw ? Number(raw) : DEFAULT_BUDGET, total);
    } catch {
      return safeClamp(DEFAULT_BUDGET, total);
    }
  });

  const setBudget = useCallback((n) => setBudgetState(safeClamp(n, total)), [total]);

  // Re-clamp once the real total arrives (async load) or if it later shrinks below the budget.
  useEffect(() => {
    if (total && total > 0) setBudgetState((b) => clampBudget(b, total));
  }, [total]);

  useEffect(() => {
    try {
      globalThis.localStorage?.setItem(key, String(budget));
    } catch {
      /* ignore quota/private-mode */
    }
  }, [key, budget]);

  return [budget, setBudget];
}
