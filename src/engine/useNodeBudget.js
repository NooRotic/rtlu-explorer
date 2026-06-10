// src/engine/useNodeBudget.js
import { useCallback, useEffect, useState } from 'react';
import { clampBudget, budgetStorageKey, DEFAULT_BUDGET } from './budget.js';

/** Persisted node-budget state. Reads/writes localStorage under a per-artist key. */
export function useNodeBudget(artistId, total) {
  const key = budgetStorageKey(artistId);
  const [budget, setBudgetState] = useState(() => {
    try {
      const raw = globalThis.localStorage?.getItem(key);
      return raw ? clampBudget(Number(raw), total) : clampBudget(DEFAULT_BUDGET, total);
    } catch {
      return clampBudget(DEFAULT_BUDGET, total);
    }
  });

  const setBudget = useCallback(
    (n) => setBudgetState(clampBudget(n, total)),
    [total],
  );

  useEffect(() => {
    try {
      globalThis.localStorage?.setItem(key, String(budget));
    } catch {
      /* ignore quota/private-mode */
    }
  }, [key, budget]);

  return [budget, setBudget];
}
