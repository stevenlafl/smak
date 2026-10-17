I made the flare as a `sprites/flare1.spr` and the build says **OK**, with every check passing. I could not put it in the game beside Half-Life's own, so the in-game judgement is still theirs to make.

**What I made**

The spec is at `work:flare1.json` and the sprite is at `work:sprites/flare1.spr`, with a sheet and an animated preview beside it.

- **Type and format:** `parallel` and `additive`, the same as the game's `flare1.spr`. Black is clear, so only the light shows.
- **Size and frames:** 64 by 64 pixels, one frame, placed as an `env_sprite` with render mode 5 (Additive).
- **Layers:** two white glow layers with a power falloff, which gives a soft round halo that reaches the frame's edges.
  - A wide halo (radius 0.95, core 0.25, gain 0.7).
  - A small, bright hot centre (radius 0.5, core 0.07, gain 1.0).

**How it checks out**

- The build reports 94 colours with almost no loss from quantising.
- Its border is fully dark, so there is no hard edge.
- Against Half-Life's flare class, the one measure it checks is in range (1 of 1).

**What I could not do**

- There is no game folder on this server, so I could not compare it with the game's own `flare1.spr` in the game or on a sheet. The "in range" result is the build's class check, not a side-by-side look.
- The viewer's larger render of the sprite failed with an offset error, so the only picture I saw is the 128-pixel sheet. It shows a white middle fading into a soft grey-white halo, which matches the request.

**What to tell the modder**

To try it, copy `sprites/flare1.spr` into their mod's `sprites/` folder. It replaces the game's file of the same name, so they should keep a copy of the original. If they want to compare, the halo's size or the hot centre's size are the two values in the spec to change, and the build can be run again.
