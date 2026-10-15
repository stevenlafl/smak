The sprite is built and the build says OK: `work:sprites/xspark1.spr`, with a contact sheet and an animated preview beside it.

**What it is:** a blue-white charged spark, 32x32, drawn parallel to the viewer and additive, so black is clear.

**Frames and motion:** 11 frames in the file. The kit writes a looping sprite with its first frame again at the end, so I built 10 frames of loop and it wrote 11 in total. The outer teal lobes are re-placed at random every frame, which gives the boil and the lumpy, cloud-like outline. The core stays put and does not grow or fade.

**Colours and size:**
- White core: about 11 px across, at the centre.
- Bright cyan (60, 220, 255) glow around it, about 19 px across.
- Teal (20, 90, 130) lobes and halo, reaching about 28 px across and fading to black before the frame edge.

**Type and format:** `parallel`, `additive`, `env_sprite`, render mode 5 (additive). The report gives its border as 0 (no light at the edge), and it measures its wrap and jitter as 1.16 and 1.92 with no faults.

**Choices and gaps:**
- **Frame rate:** I set 10 fps, which is the most an `env_sprite` can play; the kit warns above that. That is the bottom of your 10–15 range. If you want 12–15, the spec's `use` would have to change to `tempent`, which I did not do without your say-so.
- **Dark flecks in the core:** not added. Additive blending cannot draw dark pixels, so there is no way to show the crackle specks in this format.
- **Comparison:** no copy of the original is on this machine and I had no reference sheet, so the report has no measures against Half-Life's xspark1. The description is the only source for the colours and sizes above. Give me the original's `.spr` or a sheet of its frames and I can run the side-by-side measure and tune to it.
