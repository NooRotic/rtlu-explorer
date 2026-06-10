import { useEffect, useState } from 'react';

// The artist whose snapshot ships in this build. Phase 4 turns this into a
// per-artist router; for now the explorer launches with Wu-Tang.
const ARTIST = 'wu-tang-clan';
const ARTIST_LABEL = 'Wu-Tang Clan';

// Resolve a data artifact relative to the deployed base path (set in vite.config).
const dataUrl = (file) => `${import.meta.env.BASE_URL}data/${ARTIST}/${file}`;

async function loadJson(file) {
  const res = await fetch(dataUrl(file));
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
  return res.json();
}

export default function App() {
  const [state, setState] = useState({ status: 'loading', data: null, error: null });

  useEffect(() => {
    Promise.all([
      loadJson('version.json'),
      loadJson('bank-stats.json'),
      loadJson('entities.json'),
      loadJson('links.json'),
    ])
      .then(([version, stats, entities, links]) => {
        const topEntities = [...entities].sort((a, b) => b.count - a.count).slice(0, 12);
        setState({ status: 'ready', data: { version, stats, entities, links, topEntities }, error: null });
      })
      .catch((error) => setState({ status: 'error', data: null, error: error.message }));
  }, []);

  if (state.status === 'loading') {
    return <Shell><p className="muted">Loading the universe…</p></Shell>;
  }
  if (state.status === 'error') {
    return (
      <Shell>
        <p className="error">Could not load the snapshot: {state.error}</p>
        <p className="muted">
          Generate it from the private RTLU repo:
          <code> node src/export-bank.js --artist {ARTIST} --output ../rtlu-explorer/public/data/{ARTIST}</code>
        </p>
      </Shell>
    );
  }

  const { version, entities, links, topEntities } = state.data;
  const snapshot = new Date(version.snapshot_taken_at).toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <Shell>
      <p className="lede">
        A transformative map of the people, places, and references woven through{' '}
        <strong>{ARTIST_LABEL}</strong>’s verse — {entities.length.toLocaleString()} entities
        connected by {links.length.toLocaleString()} co-occurrences. The graph is the work.
        There are no lyrics here.
      </p>

      <div className="stats">
        <Stat n={entities.length} label="entities" />
        <Stat n={links.length} label="connections" />
        <Stat n={version.hindsight_bank_total_docs} label="source documents" />
      </div>

      <h2>Most-referenced entities</h2>
      <ol className="entity-grid">
        {topEntities.map((e) => (
          <li key={e.id}>
            <span className="entity-name">{e.name}</span>
            <span className="entity-count">{e.count.toLocaleString()}</span>
          </li>
        ))}
      </ol>

      <div className="phase-note">
        <strong>The 3D universe is coming.</strong> The interactive force-directed galaxy
        (react-three-fiber + react-force-graph-3d) lands in Phase 2, after the art-direction
        sprint. This page confirms the Phase 1 export pipeline is wired end-to-end.
      </div>

      <footer>Snapshot taken {snapshot} · artist source: {version.artist_source}</footer>
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <main className="shell">
      <header>
        <h1>RTLU Explorer</h1>
        <p className="kicker">The Lyrical Universe — entity graph</p>
      </header>
      {children}
    </main>
  );
}

function Stat({ n, label }) {
  return (
    <div className="stat">
      <span className="stat-n">{Number(n).toLocaleString()}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}
