The sprite is built and the build says **OK**: `sprites/muzzleflash1.spr` in the work folder, with its sheet and animated preview beside it.

I had no picture of the original, only your description, so I could not compare the two side by side. The result is built from the description and checked against the build's own measures.

- **Shape:** a white-cream core about 10 to 12 pixels across at the centre, and five rays at 90° (straight up), 12° and 168° (a little above horizontal, left and right), and 238° and 302° (down and outward). The rays are about 3 pixels wide and run 26 to 30 pixels from the centre.
- **Colour:** the core is near-white with a warm cream tint. The rays go white, to pale gold, to amber, to dim brownish orange at the tips, then black. A faint haze surrounds the core.
- **Frames:** two frames, 64x64, with the second frame's rays a touch longer and shifted a few degrees. The core stays the same in both. The build reports the two frames at near-equal brightness (0.97 and 1.00).
- **Format:** `tempent` use (a temporary-entity muzzle flash), `parallel` type (always faces the viewer), `additive` format (black is transparent). The build places it with render mode 5 (Additive) at 14 frames a second.

Two choices you may want to revisit:

- I set `loop: false` so the file holds exactly 2 frames, as you asked. With `loop: true` the kit writes a third frame (a copy of the first) at the end. The build raised no fault for this.
- The kit's flare layer has no per-frame variation, so I got the second frame's rays from a second layer of rays that is switched in with an envelope. This is a workaround, not a native feature.

I also left a scratch file, `work:sprites/test.spr`, from my experiments. I can't delete files here, so you may want to remove it yourself.
