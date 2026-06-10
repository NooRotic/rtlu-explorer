// Three faces by role; grit lives here, not in the palette. See docs/art-direction.md "Typography".
export const typography = {
  title: "'Saira Stencil One', sans-serif", // titles, headlines, entity names
  body: "'Special Elite', cursive",          // body, in-graph labels, atmosphere (short copy)
  data: "'Space Mono', monospace",           // numerals, counts, degrees, weights
  longform: "Inter, system-ui, sans-serif",  // accessibility fallback for long prose
  // Escape hatch (art-direction.md): if typewriter labels read poorly at full density,
  // in-graph node labels promote to the title face. Engine reads this flag, never the value.
  promoteLabelsToTitle: false,
};
