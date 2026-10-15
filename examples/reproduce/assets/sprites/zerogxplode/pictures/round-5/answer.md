The sprite is built: `work:sprites/zerogxplode.spr`, with the sheet and animated preview beside it. The build says **OK** with no faults. Four warnings remain, all about shape, and I could not clear them.

**What the original is:** a one-shot fireball explosion, 64x64, 15 frames. It starts as a small bright dot, swells to a large white-hot cloud by frames 2 to 4, then cools to lit amber with dark gaps. It thins to a faint brown by frame 13, with small white debris flecks around the early frames. Type parallel, format additive (black is clear).

**What I built:** one spec entry, a `billow` layer (a lit cloud of spheres) with the `blast` colour ramp (white, cream, tan, brown), plus debris. Settings:

```json
{ "name": "sprites/zerogxplode.spr", "class": "explosion", "use": "tempent", "size": [64,64],
  "frames": 15, "loop": false, "fps": 15, "type": "parallel", "format": "additive",
  "origin": "centre", "finish": "edge",
  "reference": { "picture": "pictures/frames.png", "cell": 128, "cols": 8 },
  "layers": [{ "kind": "billow", "ramp": "blast", "count": 32, "spread": 0.8, "size": 0.4,
    "growth": 0.5, "rise": 0.25, "hot": 0.3, "cool": 0.8, "dissolve": 0.8,
    "env": { "attack": 0.05, "decay": 0.3 },
    "debris": { "count": 10, "speed": 0.9, "gravity": 0.3, "trail": 0.1 } }] }
```

**Measured against the original (from the build report):**
- Mean colour difference: 5.2 (15 or under is near).
- Share of dark pixels: 0.74 against the original's 0.72.
- Border light: 0.001 against 0.005, with no edge fault.
- Envelope: all five checks against Half-Life's own explosion are in range.
- Frame count: 15 and 15.

**What is not matched:**
- **Shape overlap is 0.38, against a bar of 0.8.** Frames 1 to 8 overlap at roughly 0.56 to 0.59, but the original's clouds are wider (columns 4 to 62 at frame 3, against my 14 to 51). Widening the cloud to match cost the edge fault and dropped the overlap to 0.26, so I went back to this setting.
- **Frame 0 is empty.** The original has a small lit dot there. The attack that stops frame 0 from being too bright also blanks it, and I could not keep both.
- **The late frames are slightly off.** Frames 13 and 14 are dark where the original still has a faint trace.
- **Debris is thinner** than the original's white flecks.

**Guesses to check:**
- **15 fps.** The original's frame rate is not in its input folder (`facts.txt` gives only size, frames, type and format), so 15 is my guess.
- **`use: tempent`.** I chose this as an explosion's usual use. If the game loads this sprite some other way, the placement will need changing.
