The sprite is built and the build says OK: `work:sprites/steam1.spr`, with `-sheet.png` and `-animated.png` beside it. It is not as close as I'd like yet. The shape overlap with the original is 0.52 against the kit's 0.7 bar, and I didn't find a setting that closed that gap.

**What it is:** a soft white steam puff, a lit billow cloud. Frame 0 is a small dot. It grows to its largest around frames 3 to 7, then thins into a grey wisp by frame 14. Frame 15 is empty, as in the original.

**Spec:** `smak.sprite/1`, `sprites/steam1.spr`, 32x48, 16 frames, `parallel oriented`, `index alpha`, `use: env_sprite`, `origin: centre`, `finish: edge`, not looping, 10 frames a second. Two billow layers: a main cloud and a smaller tail below it. The spec is inline in this session and I did not save it to a file.

**Measured against the original (from the build report):**

```
Measure                         Original   Build
Mean colour (delta E, lower =   -          3.5   (15 or under is near)
  closer)
Share of frame that is dark     0.63       0.68  (within 0.05 is near)
Border brightness               0.341      0.406 (no FAULT for light at edge)
Frame count                     16         16
Shape overlap (bar 0.7)         -          0.52  (not met)
Kit's check vs Half-Life smoke  -          5 of 5 in range
```

**Judgement calls and gaps:**
- The original's frame rate isn't in its facts file, so 10 frames a second is my guess. Check it against the original in the game.
- The report places the sprite with render mode 4 (solid). I took that as given and did not check it against the original.
- I could read the original's frames and facts from the input folder, but not the reproduce folder above it (permission denied), so I could not look for an existing spec there.
- Overlap is limited by the cloud's exact shape, which differs frame by frame. More layers or seeds might move it, but I stopped once the mean colour and dark share were near and the build passed.
