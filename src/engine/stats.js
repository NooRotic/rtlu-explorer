// src/engine/stats.js
// Pure, artist-agnostic snapshot tallies for the About modal. No theme import.
export function snapshotStats(snapshot) {
  return {
    entities: snapshot?.entities?.length ?? 0,
    links: snapshot?.links?.length ?? 0,
    docs: snapshot?.version?.hindsight_bank_total_docs ?? 0,
  };
}
