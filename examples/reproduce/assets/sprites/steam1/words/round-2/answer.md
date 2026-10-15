I've built `sprites/steam1.spr` and the build says OK. It passes every check and is within range on all 5 measures against Half-Life's own smoke puffs.

**Facts:** 32x48, 16 frames, parallel oriented, index alpha (a white tint), plays once. It uses render mode 4 (Solid) as a temporary effect at 15 frames a second. It ends fully clear, and no light reaches the border.

**How it compares to the description:**

- **Frame 0:** a small white puff low and a little left of centre. It's about 5 to 6 px across, a bit bigger than the 3 px dot described. I tried a separate dot that would show only in frame 0, but I couldn't get it to fade fast enough. It either left a faint speck in later frames or disappeared from frame 0 too, so I dropped it.
- **Frames 1 to 3:** a dense, bright white, lumpy cloud. It's about 12 px wide in frame 1 and close to 22 px by frame 3, in the lower middle.
- **Frames 4 to 7:** it swells to nearly the full width and rises, white in the middle with grey shading.
- **Frames 8 to 11:** it fades to light grey and breaks open with gaps, filling most of the height.
- **Frames 12 to 15:** faint grey patches that fade to almost nothing by frame 15.

**Where it falls short:**

- **Frames 8 to 11:** the cloud stays a wide, ragged mass. It doesn't narrow into a column with the top broadest and a thinner trail underneath.
- **Frames 12 to 15:** the remains are scattered patches. They don't pull in to one thin vertical wisp in the middle.

The cloud tool fades it out by thinning it away, not by drawing it in. With the settings it offers, I couldn't get a closer match for those last frames.

The sprite is at `work:sprites/steam1.spr`, with `-sheet.png` and `-animated.png` previews beside it.
