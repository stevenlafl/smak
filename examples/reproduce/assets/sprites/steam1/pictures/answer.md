The sprite builds OK: `sprites/steam1.spr` is written to the work folder as `work:sprites/steam1.spr`, with its contact sheet and animated picture beside it. The last build is the one on disk.

**What it is:** a steam puff. A small dot appears low in the frame, swells into a lumpy white cloud over frames 1–7, then breaks into grey wisps and fades by frame 15.

**Final spec** (inline, since the work folder has no spec file; save it if you want to rebuild):

```json
{"spec":"smak.sprite/1","sprites":[{"name":"sprites/steam1.spr","class":"smoke puff","size":[32,48],"frames":16,"loop":false,"fps":10,"type":"parallel oriented","format":"index alpha","origin":"centre","finish":{"edge":2},"layers":[{"kind":"billow","lumps":0.12,"spread":0.45,"size":0.28}],"reference":{"picture":"pictures/frames.png","cell":128,"cols":8}}]}
```

**Settings:**

| Setting | Value | Why |
| --- | --- | --- |
| Size | 32x48 | As the original |
| Frames | 16, one-shot, 10 per second | Original's 16 frames; it plays once and ends dark |
| Type, format | parallel oriented, index alpha | As the original |
| Colour | Neutral white-grey (default billow shading) | Matches the original's greys |
| Edge | 2 px fade | Keeps the frame's border dark |

**Measures against the original** (the tool's reading of the reference):

| Measure | Original | Ours | Verdict |
| --- | --- | --- | --- |
| Mean colour difference (delta E, 15 or under is near) | — | 12.7 | Near |
| Share dark | 0.63 | 0.65 | Near |
| Border light (mean) | 0.002 | 0.015 | Within the build's limit, slightly brighter |
| Frame count | 16 | 16 | Match |
| Shape overlap (bar 0.7) | — | 0.49 | Below the bar |
| Flicker (jitter, range 0.9–1.5) | — | 1.52 | Just over |
| Peak timing (class range 0.2–0.6) | — | 0.67 | Peaks late |

**Notes:**
- **Reading the reference:** the sheet's cells are 64 px in the picture, but the tool reads 16 frames only with `cell` set to 128, so I used 128.
- **Shape is the main gap:** the cloud's lobes are whiter and more regular than the original's. The original is greyer, taller in the middle frames, and has a lower stalk. Matching that exactly would need a hand-tuned shape rather than a procedural cloud.
- **Flicker and peak timing:** lowering the lumpiness did not bring jitter into range, and I did not chase the peak timing further.
- **Input files:** I could not read the original's input folder directly (permission denied), so the comparison uses the copy in `pictures/frames.png`.
