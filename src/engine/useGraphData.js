// src/engine/useGraphData.js
import { useEffect, useState } from 'react';

// Resolve a data artifact relative to the deployed base path (set in vite.config).
const dataUrl = (artist, file) => `${import.meta.env.BASE_URL}data/${artist}/${file}`;

async function loadJson(artist, file) {
  const res = await fetch(dataUrl(artist, file));
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
  return res.json();
}

/**
 * Loads the four static snapshot files for an artist. PRIVACY GUARDRAIL: only these files are ever
 * read; they contain names/counts/weights and NO verse text.
 */
export function useGraphData(artist) {
  const [state, setState] = useState({ status: 'loading', snapshot: null, error: null });
  useEffect(() => {
    let alive = true;
    Promise.all([
      loadJson(artist, 'version.json'),
      loadJson(artist, 'bank-stats.json'),
      loadJson(artist, 'entities.json'),
      loadJson(artist, 'links.json'),
    ])
      .then(([version, stats, entities, links]) => {
        if (alive) setState({ status: 'ready', snapshot: { version, stats, entities, links }, error: null });
      })
      .catch((error) => {
        if (alive) setState({ status: 'error', snapshot: null, error: error.message });
      });
    return () => {
      alive = false;
    };
  }, [artist]);
  return state;
}
