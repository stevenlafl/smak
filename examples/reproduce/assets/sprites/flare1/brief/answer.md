The flare is built and the build says OK. It is at `work:sprites/flare1.spr`, with the spec beside it as `work:sprites/flare1.json`.

**What it is**
- A 128×128 parallel, additive sprite, named `sprites/flare1.spr`, placed as an `env_sprite` (render mode 5, Additive), like the game's own.
- Two summed glow layers, both white:
  - **Hot centre:** a small, bright core, radius 0.2 of the frame, with a steep falloff, so it reaches full white in the middle.
  - **Soft halo:** a wider, smooth round glow, radius 0.95, at half gain, so it fades out toward the frame's edge.
- The border is fully dark, so no square edge shows when it is drawn additively.

**How I got there**
- The first attempt had only the halo layer, and the halo was too faint to read on a dark background. I added the hot-centre layer and gave the halo half gain. The halo now shows as a visible round glow with a white point in the middle.
- The build checks compare it against Half-Life's own flare class. It reported "1 of 1 in range" and no warnings.

**What I could not do**
- This server has no game folder, so I could not put it beside `sprites/flare1.spr` from Half-Life. The "at least as good" call is for the modder to make in the game. The build's comparison is only a measure, not a side-by-side.
- A 512-pixel preview failed with a tool error, so I judged the look from the 128-pixel sheet.

The spec is short, so the modder can change the halo radius, the core size or the gain in `work:sprites/flare1.json` and rebuild.
