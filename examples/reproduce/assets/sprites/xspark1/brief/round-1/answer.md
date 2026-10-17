I made a replacement `sprites/xspark1.spr`. The build says OK. I could not compare it with Half-Life's own file, so the judgement of whether it is at least as good is still yours to make in the game.

**What it is**
- 32×32, 8 frames, one-shot, placed as a temporary entity (`tempent`) and drawn additively, so black is clear and the sparks read as light.
- Three layers, added together:
  - A small, dim glow at the centre, for the hot point where the spark starts.
  - Nine small soft blobs placed afresh each frame round the centre, for the flicker.
  - 22 bright yellow-orange sparks that fly out at speed, fall under gravity, and leave short trails. They are the main thing you see, and they fade out over the last frames.
- The sheet shows the burst opening bright in frames 0–2, the sparks spreading in frames 2–5, and fading to nothing by frame 7.

**How it was made**
- The spec is saved as `work:xspark1.json`, so it can be rebuilt with `build` and the same spec. It is an `smak.sprite/1` spec.
- Outputs are `work:sprites/xspark1.spr`, plus `-sheet.png` and `-animated.png` beside it.

**What the build reported**
- Placed as a tempent, render mode 5 (additive), framerate 20.
- Border light is 0.003, so no light spills off the edge.
- Brightest frame is 0.24, and the envelope peaks at 0.14 over the whole burst.
- One warning remains: jitter is 1.2 against the 1.72 to 2 range the build expects for Half-Life's sparks. It reads as "too smooth, little inner motion". I tried several variants (more blobs, fewer blobs, shorter trails, more sparks). None moved it past about 1.2 without making the burst a blob or a halo, so I kept the version that looks best.

**What I could not do**
- The server has no game folder, so I could not load Half-Life's `xspark1.spr` as a reference. The build's comparison is against its general sparks class, not the real file.
- Its size and frame count (32×32, 8 frames) are my guess at the feel of a spark, not measured from the original.

To test it, copy `sprites/xspark1.spr` into the mod's `sprites` folder beside Half-Life's and compare a broken wire or a bullet hit on metal. If the modder wants the sparks brighter or longer-lived, the sparks layer's `gain` and `trail` are the first things to raise.
