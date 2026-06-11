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
  const focusRef = useRef(focusId); // nodeThreeObject reads this synchronously
  focusRef.current = focusId;
  const tweenUntilRef = useRef(0); // suppress idle drift while a camera tween is in flight
  const hoverRef = useRef(null); // hovered node id — read synchronously by encoder + linkColor

  // Build + normalize once per snapshot.
  const graph = useMemo(
    () => buildGraph(snapshot, { sunNames: theme.suns.roster, superHub: theme.suns.superHub }),
    [snapshot, theme],
  );

  // Apply the render budget: keep the top-N by degree. Additionally guarantee the selected node
  // and its neighbors render (so search/stars can target nodes below the budget and the camera can
  // fly to them). Fresh link copies: FG mutates source/target in place after the first tick.
  const visible = useMemo(() => {
    const top = topNByDegree(graph.nodes, graph.degree, budget);
    const keep = new Set(top.map((n) => n.id));
    if (focusId && !keep.has(focusId)) {
      neighborsOf(focusId, graph.links).forEach((id) => keep.add(id));
    }
    const nodes = graph.nodes.filter((n) => keep.has(n.id));
    const links = graph.links
      .filter((l) => keep.has(l.source) && keep.has(l.target))
      .map((l) => ({ ...l }));
    return { nodes, links };
  }, [graph, budget, focusId]);

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
      const focusSet = focusRef.current ? neighborsOf(focusRef.current, graph.links) : null;
      const hoverSet = hoverRef.current ? neighborsOf(hoverRef.current, graph.links) : null;
      const enc = encode(node, encCtx(hoverSet, focusSet));
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
    const hoverSet = hoverRef.current ? neighborsOf(hoverRef.current, graph.links) : null;
    const focusSet = focusRef.current ? neighborsOf(focusRef.current, graph.links) : null;
    const hot =
      (hoverSet && hoverSet.has(s) && hoverSet.has(t)) ||
      (focusSet && focusSet.has(s) && focusSet.has(t));
    if (hot) return hexA(theme.palette.whiteHot, 0.95);
    if (focusRef.current) return hexA(theme.palette.gold, 0.04); // selected isolate dims the rest
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
    if (!node) return;
    const dist = 120;
    const r = Math.hypot(node.x || 0, node.y || 0, node.z || 0) || 1;
    const ratio = 1 + dist / r;
    tweenUntilRef.current = performance.now() + theme.motion.cameraTweenMs;
    fgRef.current?.cameraPosition(
      { x: (node.x || 0) * ratio, y: (node.y || 0) * ratio, z: (node.z || 0) * ratio },
      node,
      theme.motion.cameraTweenMs,
    );
  };

  const handleNodeClick = (node) => onSelect?.(node);
  const handleBgClick = () => onSelect?.(null);

  // Fly to the selected node from any trigger (canvas/dock/search/stars). One rAF defer lets a
  // freshly-unioned node receive simulation coords before we read node.x/y/z.
  useEffect(() => {
    if (!focusId) return;
    const id = requestAnimationFrame(() => {
      const node = (fgRef.current?.graphData?.()?.nodes || visible.nodes).find((n) => n.id === focusId);
      flyTo(node);
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId, visible]);

  const handleNodeHover = (node) => {
    hoverRef.current = node?.id ?? null;
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
