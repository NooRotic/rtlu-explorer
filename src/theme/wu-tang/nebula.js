// Heavier nebula behind the node field (gold/amber + one cool counterpoint), slow drift.
// Offsets are scene-space multipliers applied by the engine relative to graph extent.
export const nebula = {
  layers: [
    { offset: [-0.5, 0.3, -1.0], size: 1.6, color: '#E8B306', opacity: 0.20 },
    { offset: [0.6, -0.4, -1.2], size: 1.4, color: '#C2570F', opacity: 0.18 },
    { offset: [0.1, 0.1, -1.4], size: 1.2, color: '#3A6EA5', opacity: 0.12 },
    { offset: [-0.3, -0.5, -0.9], size: 1.0, color: '#E8B306', opacity: 0.10 },
  ],
};
