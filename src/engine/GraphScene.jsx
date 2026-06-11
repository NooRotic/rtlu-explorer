// src/engine/GraphScene.jsx
import { useEffect, useMemo, useRef } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { useTheme } from '../theme/ThemeContext.jsx';
import { buildGraph } from './buildGraph.js';
import { topNByDegree, neighborsOf } from './selectors.js';
import { encode } from './encode.js';
import { buildNodeObject } from './nodeObject.js';
import { buildNebula } from './nebulaLayer.js';
import { buildIslandHalo } from './islandHalo.js';

export default function GraphScene({ snapshot, budget, strategy, focusId, showIslands, onSelect, onBuilt }) {
  const theme = useTheme();
  const fgRef = useRef();
  const focusRef = useRef(focusId); // current focus id (read synchronously by idle-drift)
  focusRef.current = focusId;
  const tweenUntilRef = useRef(0); // suppress idle drift while a camera tween is in flight
  const hoverRef = useRef(null);    // hovered node id
  const hoverSetRef = useRef(null); // hovered node + neighbors — computed ONCE per hover
  const focusSetRef = useRef(null); // selected node + neighbors — computed ONCE per focus change

  // Build + normalize once per snapshot.
  const graph = useMemo(
    () => buildGraph(snapshot, { sunNames: theme.suns.roster, superHub: theme.suns.superHub }),
    [snapshot, theme],
  );

  // Hover/focus neighbor sets are computed ONCE here (not per-link / per-node) and read from refs by
  // the node + link accessors, which FG invokes thousands of times per refresh. Recomputing
  // neighborsOf() inside those accessors was O(links²)/O(nodes×links) and janked on hover.
  const focusSet = useMemo(() => (focusId ? neighborsOf(focusId, graph.links) : null), [graph, focusId]);
  focusSetRef.current = focusSet;

  // Render budget: keep the top-N by degree, memoized on [graph, budget] so the reference is STABLE
  // across selections. FG re-runs its layout when the graphData object identity changes, so an
  // in-budget click must reuse this same object (no re-heat / node jump).
  const base = useMemo(() => {
    const top = topNByDegree(graph.nodes, graph.degree, budget);
    const keep = new Set(top.map((n) => n.id));
    const nodes = graph.nodes.filter((n) => keep.has(n.id));
    const links = graph.links
      .filter((l) => keep.has(l.source) && keep.has(l.target))
      .map((l) => ({ ...l }));
    return { keep, data: { nodes, links } };
  }, [graph, budget]);

  // Only when the selection is OUTSIDE the budget do we union in {selected} ∪ neighbors (so
  // search/stars can target a sub-budget node and the camera can fly to it). In-budget selections
  // return the stable `base.data` reference — no churn.
  const visible = useMemo(() => {
    if (!focusId || base.keep.has(focusId)) return base.data;
    const keep = new Set(base.keep);
    neighborsOf(focusId, graph.links).forEach((id) => keep.add(id));
    const nodes = graph.nodes.filter((n) => keep.has(n.id));
    const links = graph.links
      .filter((l) => keep.has(l.source) && keep.has(l.target))
      .map((l) => ({ ...l }));
    return { nodes, links };
  }, [base, focusId, graph]);

  const maxCount = useMemo(() => graph.nodes.reduce((m, n) => Math.max(m, n.count || 0), 1), [graph]);
  const maxDegree = useMemo(
    () => Object.values(graph.degree).reduce((m, d) => Math.max(m, d), 1),
    [graph],
  );

  // Lift the built graph (byId, degree, raw links) so the drawer can compute stats.
  useEffect(() => {
    onBuilt?.(graph);
  }, [graph, onBuilt]);

  const encCtx = (hoverSet, focusSet) => ({
    theme,
    degree: graph.degree,
    maxCount,
    maxDegree,
    hoverSet,
    focusSet,
    strategy,
  });

  // Rebuild node objects whenever focus or strategy changes.
  useEffect(() => {
    fgRef.current?.refresh?.();
  }, [focusId, strategy]);

  const nodeThreeObject = useMemo(() => {
    return (node) => {
      // Sets are precomputed into refs (see focusSet memo / handleNodeHover) — cheap .has() here.
      const enc = encode(node, encCtx(hoverSetRef.current, focusSetRef.current));
      return buildNodeObject(enc, node, { ringColor: theme.palette.gold });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph, strategy, maxCount, maxDegree, theme]);

  // Weighted gold edges: faint lattice for weight-1, bright flare for strong ties (alpha scales
  // with sqrt(weight), so w=1 sits at ~0.30 and the w=56 ties flare up to the 0.85 cap).
  const ends = (l) => [
    typeof l.source === 'object' ? l.source.id : l.source,
    typeof l.target === 'object' ? l.target.id : l.target,
  ];
  const linkColor = (l) => {
    const w = l.weight ?? 1;
    const alpha = Math.min(0.85, 0.18 + Math.sqrt(w) * 0.12);
    const [s, t] = ends(l);
    const hs = hoverSetRef.current; // precomputed once per hover
    const fs = focusSetRef.current; // precomputed once per focus change
    const hot = (hs && hs.has(s) && hs.has(t)) || (fs && fs.has(s) && fs.has(t));
    if (hot) return hexA(theme.palette.whiteHot, 0.95);
    if (fs) return hexA(theme.palette.gold, 0.04); // selected isolate dims the rest
    return hexA(theme.palette.gold, alpha); // hover (no selection) leaves the rest as gold
  };
  const linkWidth = (l) => Math.min(2.6, 0.3 + Math.sqrt(l.weight ?? 1) * 0.35);

  // Nebula + idle drift: mount once the scene exists.
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    const scene = fg.scene();
    fg.backgroundColor?.(theme.palette.bgBase);
    const extent = 600; // FG default layout spread order-of-magnitude
    const { group, update } = buildNebula(theme.nebula, extent);
    scene.add(group);

    let raf;
    const start = performance.now();
    const tick = () => {
      const t = performance.now() - start;
      update(t);
      if (theme.motion.idleDrift && !focusRef.current && performance.now() >= tweenUntilRef.current) {
        // slow idle "breath": rotate the camera orbit very gently
        const cam = fg.camera();
        const a = theme.motion.idleDrift;
        const x = cam.position.x * Math.cos(a) - cam.position.z * Math.sin(a);
        const z = cam.position.x * Math.sin(a) + cam.position.z * Math.cos(a);
        cam.position.x = x;
        cam.position.z = z;
        cam.lookAt(0, 0, 0);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      scene.remove(group);
    };
  }, [theme]);

  // Island halo: faint peripheral field of the 144 degree-0 entities, toggleable, budget-independent.
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    const scene = fg.scene();
    const islands = graph.nodes.filter((n) => (graph.degree[n.id] ?? 0) === 0);
    const halo = buildIslandHalo(islands, 600, theme);
    scene.add(halo);
    return () => {
      scene.remove(halo);
      halo.geometry.dispose();
      halo.material.dispose();
    };
  }, [graph, theme]);

  // Toggle visibility without rebuilding.
  useEffect(() => {
    const halo = fgRef.current?.scene?.().getObjectByName('island-halo');
    if (halo) halo.visible = !!showIslands;
  }, [showIslands, graph]);

  const flyTo = (node) => {
    if (!node || node.x == null) return; // coords not seeded by the sim yet — caller retries
    const dist = 120;
    const r = Math.hypot(node.x, node.y || 0, node.z || 0) || 1;
    const ratio = 1 + dist / r;
    tweenUntilRef.current = performance.now() + theme.motion.cameraTweenMs;
    fgRef.current?.cameraPosition(
      { x: node.x * ratio, y: (node.y || 0) * ratio, z: (node.z || 0) * ratio },
      node,
      theme.motion.cameraTweenMs,
    );
  };

  const handleNodeClick = (node) => onSelect?.(node);
  const handleBgClick = () => onSelect?.(null);

  // Fly to the selected node from any trigger (canvas/dock/search/stars). A freshly-unioned
  // out-of-budget node needs a few frames before the sim seeds its x/y/z, so retry until ready
  // rather than flying to the origin. (FG 1.x exposes no graphData() getter; visible.nodes holds the
  // same node objects FG mutates with coords in place, so it's the live source.)
  useEffect(() => {
    if (!focusId) return;
    let raf;
    let tries = 0;
    const attempt = () => {
      const node = visible.nodes.find((n) => n.id === focusId);
      if (node && node.x != null) {
        flyTo(node);
        return;
      }
      if (tries++ < 30) raf = requestAnimationFrame(attempt);
    };
    raf = requestAnimationFrame(attempt);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId, visible]);

  // Reset the global cursor if we unmount mid-hover.
  useEffect(() => () => { document.body.style.cursor = 'default'; }, []);

  const handleNodeHover = (node) => {
    hoverRef.current = node?.id ?? null;
    hoverSetRef.current = node ? neighborsOf(node.id, graph.links) : null; // computed once per hover
    document.body.style.cursor = node ? 'pointer' : 'default';
    fgRef.current?.refresh?.();
  };

  return (
    <ForceGraph3D
      ref={fgRef}
      graphData={visible}
      backgroundColor={theme.palette.bgBase}
      nodeThreeObject={nodeThreeObject}
      nodeLabel={(n) => n.name}
      linkColor={linkColor}
      linkWidth={linkWidth}
      linkOpacity={1}
      enableNodeDrag={false}
      onNodeClick={handleNodeClick}
      onNodeHover={handleNodeHover}
      onBackgroundClick={handleBgClick}
      warmupTicks={40}
      cooldownTicks={120}
    />
  );
}

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}
