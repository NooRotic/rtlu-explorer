// src/engine/budget.js
// Engine-level, artist-agnostic. The user's lever on the fidelity/perf tradeoff: render the top-N
// nodes by degree, so low budget = "the core Clan structure", high = "the whole universe". The
// graph degrades gracefully (sheds the weight-1 long tail first), never a randomly shredded web.

export const BUDGET_STOPS = [
  { value: 250, label: '250' },
  { value: 500, label: '500' },
  { value: 1000, label: '1,000' },
  { value: 2559, label: 'All' },
];

export const DEFAULT_BUDGET = 400; // tuned to a median machine (art-direction.md open item)

export function clampBudget(n, total) {
  if (!Number.isFinite(n)) return DEFAULT_BUDGET;
  return Math.max(1, Math.min(Math.round(n), total));
}

export function budgetStorageKey(artistId) {
  return `rtlu.nodeBudget.${artistId}`;
}
