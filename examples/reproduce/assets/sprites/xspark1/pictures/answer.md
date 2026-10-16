The sprite is built and the build says **OK**, but it still carries warnings. Four of them conflict with the reference picture, and I left those as they are.

**Output:** `work:sprites/xspark1.spr`, with `sprites/xspark1-sheet.png` and `sprites/xspark1-animated.png` beside it. The spec is `sprites_xspark1.spec.json` in the work folder.

**What I built** (the spec in the work folder has the exact values):
- **Type and format:** parallel, additive (black is clear), 32x32, 11 frames, one-shot (not looping), played as an env_sprite at 10 fps, centred.
- **Shape:** a small glow core, plus a flare with eight thin streaks at uneven angles, the longest reaching about 6 px from the centre.
- **Timing:** dark at frame 0, a small point from frame 1, brightest around frames 6 to 7 (0.6 of the play), fading to nearly dark by frame 9 and fully dark at frame 10.
- **Colour:** a ramp from black through tan and brown to cream-white at the peak, read off the sheet.
- **Class:** `sparks`.

**What I could not do:** I could not open the original's `input` folder or its `facts.txt`. I worked from the contact sheet (`pictures/frames.png`) as the build drew it, so the match is by eye and by the build's measures, not by the original's own numbers.

**Warnings left, and why:**
- **Colour difference 28 (bar 15):** the reference's sheet has a dark teal background that the judge counts as colour. An additive sprite cannot add that, so the mean colour will stay apart.
- **Dark share 0.86 against 0.46:** the same background effect. The reference's lit area is larger than mine, and I widened the glow to match. A wider glow made a visible dark-brown disc, so I backed off.
- **Middle smaller (19 pixels over 0.7 against 128):** I widened the cores as far as the look allowed.
- **Loop, first frame and peak timing:** the judge reads the reference's first frame as 0.94 bright and its last frame as bright, and asks for `loop: true`. The sheet shows frames 0 and 10 empty, so I kept it a one-shot. If the judge is right, change `loop` and the envelope.
- **Shape overlap 0.2 (bar 0.8):** mostly the background again. The core positions match the reference's.
- **Jitter "too smooth" against Half-Life's sparks:** the reference is a steady star, not a flickering spark, so I did not add flicker to chase that number.

If you want, I can try `loop: true` next to see if the judge's numbers settle, or check the animated picture.
