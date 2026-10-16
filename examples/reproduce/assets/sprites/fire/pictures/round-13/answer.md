The sprite builds OK and is written to the work folder as `sprites/fire.spr`, with its `-sheet.png` and `-animated.png` beside it. The build still prints warnings the guide says to clear, so it is not finished to the standard you asked for.

**Final spec** (the one on disk):

```json
{ "name": "sprites/fire.spr", "class": "fire loop", "use": "env_sprite", "size": [32, 96],
  "frames": 15, "loop": false, "fps": 10, "type": "parallel oriented", "format": "additive",
  "origin": "bottom", "reference": "pictures/frames.png",
  "layers": [{ "kind": "fire", "ramp": "reference", "width": 1.2, "height": 2.3, "taper": 0.2, "tongues": 0.5 }] }
```

**Measured against the original** (the report's own figures):

| Measure | Original | Mine | Verdict |
| --- | --- | --- | --- |
| Size and frames | 32x96, 15 | 32x96, 15 | match |
| Colour (delta E, 15 or under is near) | | 0.3 | near |
| Share that is dark | 0.38 | 0.31 | near (just outside 0.05) |
| Border light | 0.275 | 0.20 | off, past 0.08 |
| Brightest frame, share of play | 0.07 | 0.71 | off |
| Shape overlap per frame (bar 0.8) | | 0.64 | off |
| Frames 9 to 14 light | 0.73 | 0.99 | off |
| Start, end, and wrap | 0.9 / 0.84 | 0.91 / 0.89 | match |

**What is still wrong:**
- **Timing and tail.** Mine is brightest late and stays bright to the end; the original peaks in its second frame and dims in its last six. I tried the `env` envelope to fix this. Any decay dimmed the whole tail to nearly black, so I left the envelope out.
- **Shape.** My flame is a tall column with tongues. The original's lit area is wider at the sides and reaches a little higher. Pushing height up darkened the frame, so the settings are coupled and I could not clear the 0.8 overlap bar.
- **Border.** A glow layer at the frame edge barely raised the border light (0.02 to 0.02) and pushed the colour out of range, so I dropped it.

**Choices I made that you should check:**
- `loop: false`, so the written frames are the original's 15. With `loop: true` the tool wrote 16 frames, one more than the original. The tool did not flag the wrap as a fault, but the `fire loop` class is a loop in intent.
- `fps` 10 and `origin` bottom are my guesses. I could not open the original's `facts.txt` or its input folder: the Read tool refused the folder, and the work folder's copy of `frames.png` was readable only through `build`. If the original's `facts.txt` gives a different fps or origin, those two fields should change.
- The reference is `pictures/frames.png`, the contact sheet from the work folder. I did not copy anything into the sprites folder; it is only in the work folder.

The next step I would try is a per-frame envelope (a curve that peaks in frame 2 and holds through the middle), which the spec does not expose directly; I did not find a setting that does it without the tail darkening. Tell me if you want me to keep going on that or accept this version.
