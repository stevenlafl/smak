I've built `sprites/steam1.spr` in the work folder, and the build says OK with every check passed. One warning is still open: the shape overlap is 0.79, just under the 0.8 bar where the judges give a shape full marks.

It's a white steam puff, 32x48 with 16 frames, type parallel oriented, format index alpha. It plays once at 10 frames a second and isn't looped. It starts as a small dot, swells into a bright lumpy cloud that fills the frame by frames 4 to 8, then thins and greys out into a faint wisp by frame 15. Side by side with your reference sheet, it lines up frame for frame.

How it measures against the original:

```
measure                    original    mine
mean colour (delta E)      -           4.6   (15 or under is near)
share of frame dark        0.63        0.65
brightest                  0.96        0.81
pixels over 0.7 per frame  168         197
frame count                16          16
shape overlap (mean)       -           0.79  (bar 0.8)
```

- **Where the shape falls short:** frames 0 to 10 overlap the original at 0.73 to 0.95. The fade-out is where it loses ground: frames 12 to 15 come in at 0.59, 0.48, 0.66 and 0.31. Across seven fade tunings, overlap stayed between 0.76 and 0.79, and I kept the best one.
- **How it's built:** a lit cloud layer plus a faint smoke layer underneath. Both are kept inside the original's outline frame by frame, using the spec's reference-mask option. That borrows the original's outline only; the colours and shading are generated.
- **Sheet layout:** the original sheet is drawn 8 across with 96-pixel cells. The first build read it at the wrong cell size, so I set that explicitly.

The sheet and animated preview are next to the sprite as `sprites/steam1-sheet.png` and `sprites/steam1-animated.png`.
