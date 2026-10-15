I built `sprites/muzzleflash1.spr` and the build says OK with every check passed. It's a 64x64 additive sprite that always faces the viewer (parallel), and it's set up as a temporary effect drawn additively, at 20 frames a second.

**What it looks like:**
- **Core:** a near-white, slightly cream core about 11 pixels across, with a faint amber haze around it.
- **Rays:** five thin, soft rays. One points almost straight up, two point sideways a little above horizontal, and two point down and outward at about 7 and 5 o'clock. They're about 3 to 4 pixels wide at the base and taper to about 26 to 28 pixels from the centre, so there's a small dark margin and nothing touches the border.
- **Colour:** I wrote my own colour ramp instead of the kit's built-in muzzle one, because that one stays peach and tan. Mine runs from cream-white through pale gold and amber-orange to dim brownish orange at the tips, then black.
- **Animation:** the second frame has every ray turned about 3 to 4 degrees and made a little longer or shorter, so the star shimmers. The core stays the same size and brightness.

**Two things that differ from the original:**
1. **Frame count.** The file holds 3 frames, not 2: the two real frames plus a copy of the first at the end. The kit always does this for a looping sprite, because the engine wraps around to the start. I couldn't build it as a two-frame non-looping sprite, since a non-looping one has to end on a dark frame. If the judge counts frames in the file, it will read 3 against the original's 2.
2. **The second frame is a 50/50 blend.** The kit has no way to give one layer a different shape in each frame. To get one, I fade the first star's layer out over the cycle and fade a second star's layer in. That makes frame 2 half star A and half star B instead of a clean B, so its rays look slightly softer and doubled at the tips. The difference is small.

I had no picture of the original to give the build as a reference, so it couldn't measure the result against it. It was checked only against Half-Life's own flare sprites, where it's in range. The contact sheet and animated preview were saved next to the sprite in the work folder as `muzzleflash1-sheet.png` and `muzzleflash1-animated.png`.
