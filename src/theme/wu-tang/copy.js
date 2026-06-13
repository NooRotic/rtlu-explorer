// All Wu-specific UI strings. The engine renders strings it is handed; it never authors them.
export const copy = {
  title: 'SHAOLIN OBSERVATORY',
  tagline: 'a map of the cipher — supreme-math bones, lanterns in the deep',
  drawer: {
    referenced: 'referenced',
    degree: 'connections',
    strongestTie: 'strongest tie',
    topEdges: 'orbits',
    typeRow: 'type',
    typePlaceholder: '—',
  },
  budget: {
    label: 'render budget',
    hint: 'top-N most-connected nodes',
  },
  islands: { label: 'islands', hint: 'unlinked entities (halo)' },
  dock: 'members',
  search: { placeholder: 'search the universe…', empty: 'no match' },
  stars: { title: 'WU-STARS', hint: 'most-connected' },
  disclaimer: 'Unofficial fan tribute — not affiliated with or endorsed by Wu-Tang Clan.',
  about: {
    openLabel: 'about',
    heading: 'What is this?',
    sections: [
      {
        title: 'A map of the cipher',
        body: "A living map of the people, places, and references woven through Wu-Tang Clan's verses. The graph is the work — there are no lyrics here, only the universe of names behind them.",
      },
      {
        title: 'What powers it',
        body: 'Every node and edge is exported from a private Hindsight knowledge graph — who and what the verses name, and how often those names surface together. That snapshot ships as static JSON and renders here as a 3D force-directed galaxy (react-force-graph-3d + three.js). No live backend, no lyrics, nothing tracked.',
      },
      {
        title: 'How to read it',
        body: "The bright suns are the Clan — sized by how often they're referenced, brightened by how connected they are. Gold threads are co-occurrences: the more two names appear together, the brighter the tie. Ash dust is everyone else; the faint outer halo is the unlinked “islands.” Click a node to light its web in white. (v1 maps structure, not meaning — colour is gravity, not category.)",
      },
      {
        title: 'How to use it',
        body: 'Use the dock to leap to a member, search to find anyone in the universe, or open WU-STARS for the most-connected. Click to isolate and trace a web; drag the render-budget slider for more or fewer nodes; toggle the islands halo on or off.',
      },
    ],
    numbersTitle: 'the numbers',
    numbersUnits: { entities: 'entities', links: 'connections', docs: 'documents' },
    tributeTitle: 'tribute & source',
    tribute: "An unofficial fan tribute — not affiliated with, authorized, or endorsed by Wu-Tang Clan. The “W” is their mark; this is transformative, noncommercial work built on a network about the music, never the music itself.",
    links: [
      { label: 'GitHub — rtlu-explorer', href: 'https://github.com/NooRotic/rtlu-explorer' },
      { label: 'part of Rip The Lyrical Universe', href: null },
    ],
  },
};
