I built `sprites/flare1.spr` and the build says OK with every check passing. I haven't compared it against the original, because no copy of it was available to me.

**How it matches the description**
- **Size and timing:** 64x64, 1 frame, no animation. Any flicker has to come from the engine.
- **Type and format:** parallel (always faces the viewer) and additive, so black is clear. The build places it as an `env_glow` in render mode 3 (Glow).
- **Core:** a soft, saturated white disc in the dead centre, about 0.3 of the frame wide, with no hard edge.
- **Halo:** falls off smoothly from warm white to a dusty rose-mauve, then to dark violet-grey, then to black. It reaches close to the frame's edges.
- **Edges:** the outer 3 pixels are faded to black, and the build measures the border's light at 0, so no square outline shows.
- **Rays:** 56 faint radial rays of slightly varied lengths, spread evenly round the circle. They give a low-contrast, grainy sunburst look with no dominant spikes or cross.

**A quirk of the tool**
The build seems to scale brightness up a long way before clipping. A layer's gain on its own changed almost nothing, and only the gains between layers mattered. The ray layer ended up at a gain of 0.0015; anything near 0.01 gave hard spikes. If someone edits the spec later, change the gains in very small steps.

The spec is saved as `sprites_flare1.spec.json` in the work folder, beside the `.spr` and its sheet and animated pictures.
