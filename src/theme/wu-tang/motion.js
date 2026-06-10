// "Observatory instrument, not a dreamy free-floater." See docs/art-direction.md "Camera & motion".
export const motion = {
  cameraTweenMs: 1100,   // cinematic push-in on select
  idleDrift: 0.0006,     // slow idle "breath" auto-rotation (radians/frame); 0 disables
  nebulaDriftMs: 22000,  // full nebula drift cycle (mirrors the mockup's 22s)
  easing: 'easeInOutCubic',
};
