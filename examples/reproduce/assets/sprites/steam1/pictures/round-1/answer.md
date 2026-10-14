The build says OK and passes every check: `work:sprites/steam1.spr`, 32x48, 16 frames, parallel oriented, index alpha. It matches Half-Life's own smoke puffs on all 5 measures (border light, darkness, flicker, how bright it starts and how dark it ends).

**Matches the original:**
- It plays once and starts as a small white dot (frame 0).
- The dot grows into a bright white puff that nearly fills the width by frames 4–7.
- A faint column of steam hangs below the puff.
- The whole thing fades to nothing by frame 15.
- The frame edges stay dark.

**Doesn't match, and someone looking closely will see it:**
- **Outline:** my puff is a smooth, hard-edged disc. The original's is lumpy and cloud-like. I tried every edge-roughening setting the explosion effect offers (turbulence and cool, both up to their extremes) and none made a visible difference.
- **Late frames:** in frames 8–14 the original breaks up into wispy, streaky steam. Mine fades out as a dimming disc with only light smoke texture over it.
- **Position:** the original puff sits a little higher in the frame, but the explosion effect ignored the setting that should move it up.

**Settings I chose:** it's placed as a temporary effect at 15 frames per second, with render mode 4 (Solid). The original's frame rate wasn't given, so 15 is my pick.

Two test files from my experiments, `sprites/test_a.spr` and `sprites/test_b.spr`, are still in the work folder. These tools can't delete files, so you can remove them by hand.
