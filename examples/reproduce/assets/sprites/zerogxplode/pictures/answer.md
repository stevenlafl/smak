The sprite is built and says OK, but it does not match the original closely. The build still lists four warnings, and the shape match is the weakest part. The file is `work:sprites/zerogxplode.spr`, with a sheet and an animated preview beside it.

**What the original is:** a 64x64 explosion, 15 frames, a parallel sprite (it faces the camera) drawn additively (black is see-through). Frame 0 is a small grey-white flash with a few sparks. Frames 1 to 7 swell into a white-hot cloud that fills most of the frame, with a dark orange rim. Frames 8 to 11 cool to a tan and brown mottled cloud that rises and shrinks. Frames 12 to 14 are faint embers.

**What I built:** one `explosion` layer for the hot ball, one `billow` layer (a lit cloud) for the body, and small white `sparks`. Colours come from the original's own brightness-to-colour ramp, read off the contact sheet. The sprite is tagged as a `tempent` explosion and fades to dark at its end.

**Measured against the original (from the build report):**

| Measure | Original | Mine | Bar |
| --- | --- | --- | --- |
| Colour difference (delta E) | — | 11.2 | 15 or under: met |
| Share of frame that is dark | 0.72 | 0.52 | within 0.05: not met |
| Light at the frame's edge (brightest) | 0.82 | 0.58 | not met |
| Shape overlap, frame by frame | — | 0.35 | 0.8: not met |
| Brightest frame's place in the play | 0.36 | 0.36 | met |
| Frame count | 15 | 15 | met |

The brightest moment, the frame count and the colours are right. The shape is not. My clouds sit a little high and sit too much in the middle, and the original's late frames are smaller and darker than mine.

I tried about eight variants. Making the cloud larger filled the frame too much and lost the dark share. Making it smaller lost the edge light and the hot middle. Growing the cloud over time helped the edge but made the colour worse. The version above was the best balance I found. Reaching the 0.8 shape bar probably needs a different layer arrangement than this one, and I did not find it.

**Choices I made:**
- Type `parallel`, format `additive`, origin centre, 64x64, 15 frames, 12 frames a second, `finish: edge`, use `tempent`.
- Sparks are white. The original's flecks are white dots, so this is close but not exact.

**Limits:**
- I could not read the original's folder directly. I used the copy the server holds (`work:pictures/frames.png` and `facts.txt`) and checked it against the spec's reading of the sheet.
- I was refused permission to read the sprite source files, so I learned what each setting does by trying it, not from the code.
