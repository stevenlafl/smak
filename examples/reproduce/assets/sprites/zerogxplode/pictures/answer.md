The sprite is built and the build says **OK**, but it still carries four warnings against the original, so it is not as close as I'd like. It is written as `work:sprites/zerogxplode.spr`, with a sheet and an animated preview beside it.

**The spec:** one `billow` layer (a lit cloud made of puffs, with flecks of debris) on a 64x64 frame, 15 frames, one-shot (it does not loop), 15 frames a second, parallel to the camera, additive (black is clear), centred, with a soft edge. It is coloured by the `blast` ramp (white, cream, tan, brown), which matches the original's white-to-gold-to-brown fade. The envelope fades it to dark by the last frame.

**The one choice to check:** the cloud's outline is masked by the original's lit area, frame by frame (the kit's `mask: "reference"`). That traces the original's silhouette. The colours and light still come from the layer. Without the mask the overlap with the original was only 0.4, so I used it. If you would rather not trace the original's shape, say so and I'll rebuild without the mask.

**Measured against the original:**

| Measure | Original | Mine | Status |
| --- | --- | --- | --- |
| Frames, size, type, format | 15, 64x64, parallel, additive | same | match |
| Mean colour difference (delta E, 15 or under is near) | — | 9 | near |
| Dark share of the frame | 0.72 | 0.77 | slightly over |
| Brightest frame (share of play) | 0.36 | 0.50 | late |
| Light reaching the frame border | 0.82 | 0.36 | too little |
| Shape overlap per frame (bar 0.8) | — | 0.6 | short |
| Ends dark, no fault | yes | yes | ok |

**Still open:** the peak timing, the border light, and the shape overlap. The original's cloud fills its frame edge to edge in frames 2 to 5, and I could not get the envelope and the growth to peak early without the cloud also going square at the edges. Frame 0 is also empty in mine, where the original has a small core. The judge will see these differences; they are the ones to work on next.
