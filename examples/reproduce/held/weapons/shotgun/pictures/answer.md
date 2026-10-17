The shotgun builds and the build says OK, but I have not got the first-person view to match the reference yet.

**What's in place**

- `work:shotgun.mdl`, with the three game files in `work:shotgun_weapon/`: `v_shotgun.mdl` (first person), `p_shotgun.mdl` (another player's hands) and `w_shotgun.mdl` (lying in the world). They take the place of the game's own files when installed in a mod's `models` folder.
- The spec is `work:shotgun.json`. It is one carved part of 480 triangles, shaped from the six-view `sides.png`. Its colour comes from the six views and the four angle pictures, on a dark steel base.
- The world model's silhouettes match the reference at the same scale. My front-left render at yaw 35, pitch 20 looks like the reference picture: the hook at the lower left, the barrel running up to the right. In the six sheet views, each outline fits its own picture at 0.98 or better.

**What is still wrong**

- **First-person scale.** In the build's comparison, the reference first-person gun is small and sits low on the right. Mine fills the right half of the frame and comes close to the eye. I could not compare against Valve's own `v_shotgun.mdl`, because the render tool cannot read the game folder from here.
- **The `size: "own"` option did nothing.** I tried it on a copy with its own model name. The output was identical to the default, so I left the default in place. That is the lever I would try next, but it needs a different way to set it.
- **The build's outline warning stays.** It reports the outline against the sheet pictures at 0.64 to 0.78 in the front, left, back and right views, under its 0.8 line. Those views look the same as the reference to my eye, so I think the metric is strict on thin parts. I could not confirm that, so it is still open.
- **Stray files.** `work:shotgun-own-test.json`, `work:shotgun-own.mdl` and `work:shotgun-own_weapon/` came from the `own` test. I could not delete them with the tools I have, so please remove them.

**Decisions I made**

- I kept the default weapon size, which stretches the model to the game's shotgun length, and kept the default hand placement.
- Cells were set to 128 and triangles to 480 so the thin barrel keeps its shape. The default gave 156 triangles and a coarser outline.

Next step: if you can give me Valve's `v_shotgun.mdl` as a file in the work or models folder, I can render it beside mine at the same camera and fix the first-person scale.
