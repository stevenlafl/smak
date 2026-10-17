The laser beam sprite builds OK: `sprites/laserbeam.spr`, 32x32, one frame. Its spec is `work/laserbeam.json`, and the built sprite and its sheet and animated preview are in `work/sprites/`.

**How it's made**
- It uses the `beam` class and `use: "beam"`, so the edges stay lit and the texture tiles along the beam's length. Half-Life's own beams are placed the same way.
- Type is `parallel` and format is `additive`, as you asked. Build places it as render mode 5 (Additive) at 10 fps.
- One beam layer, round profile, core 0.25 of the width, with a little noise and streaking. Its colour runs from a dark grey-blue at the rim, through a mid blue-grey, to a near-white centre. That gives the pale core down its length and the grey-blue glow out to both edges.

**What the checks said**
- First build: OK, with one warning. The border light was 0.29, above Half-Life's beam range of 0 to 0.27, so the rim was too bright.
- Second build (final): OK, with no warnings. The border is now 0.18, and all 3 of 3 measures are in range against Half-Life's beam. The rim is darker than the first try, a dim grey-blue that is close to navy in the preview. If the modder wants a lighter rim, that trade-off is the thing to test in the game.

**What I could not do**
- The server has no game folder, so I could not measure against Half-Life's own `laserbeam.spr` directly. The checks used the class-level Half-Life beam measures instead. The modder's side-by-side in the game is the real test of whether it is at least as good.
