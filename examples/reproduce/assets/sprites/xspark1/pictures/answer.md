The sprite builds OK: `work:sprites/xspark1.spr`, with `-sheet.png` and `-animated.png` beside it. The build's warnings remain, so it is close to the original but not a match on every measure.

**What it is:** a soft, flickering cyan spark glow with a white hot centre. It uses the `glow` class, `env_sprite` use, and the `blobs` layer, which places soft discs afresh each frame so the flicker has no motion to follow.

**Shape and size:** 32x32 pixels, centred origin. The lit cloud fills most of the frame, with a dark rim, and no square edge (the edge is faded with `finish: edge 2`).

**Colours:** a ramp from black through deep blue and cyan to white at the centre. A faint halo layer in a dark cyan (0, 0.45, 0.65) fills the frame outside the core.

**Frames and motion:** 11 frames, written as a loop of 10 with its first frame repeated at the end, so the wrap is smooth (wrap 1.2 against a limit of 2.5). Playback is 10 fps. The frame rate is my guess: the original's timing is not in `facts.txt`, so check it against the original if it matters.

**Type and format:** `parallel` and `additive`, as the original.

**Measured against the original (the report's figures):**

| Measure | Original | Mine | Bar |
| --- | --- | --- | --- |
| Colour difference | — | 2.7 | 15 or under |
| Share that is dark | 0.46 | 0.51 | within 0.05 |
| Shape overlap, frame by frame | — | 0.72 | 0.8 |
| Brightest frame's position | 1 (last) | 0.3 | should match |
| Border light | 0.145 | 0.044 | — |

**Still open:**
- **Shape overlap (0.72, under the 0.8 bar):** the original's blobs sit in a different arrangement in each frame. I widened them, but the overlap plateaued around 0.72–0.73. Closing this needs the blob placement itself to match, which the layer does not do.
- **Brightest frame:** the report puts the original's peak at its last frame and mine at 30% through the loop. Moving the envelope to fix that made the loop jump and start faint, so I reverted it. The flicker sets the peak here, not a fixed envelope.

The spec used for the final build (rebuild with this if the file is lost):

```json
{"spec":"smak.sprite/1","sprites":[{"name":"sprites/xspark1.spr","class":"glow","use":"env_sprite","size":[32,32],"frames":10,"loop":true,"fps":10,"type":"parallel","format":"additive","origin":"centre","finish":{"edge":2},"reference":"pictures/frames.png","layers":[{"kind":"blobs","count":9,"radius":0.34,"spread":0.6,"core":0.35,"soft":0.6,"ramp":[[0,[0,0,0]],[0.3,[0,0.235,0.353]],[0.6,[0,0.588,0.824]],[0.85,[0.549,0.941,1]],[1,[1,1,1]]]},{"kind":"glow","radius":1,"core":0.4,"gain":0.7,"colour":[0,0.45,0.65]}]}]}
```

I did not copy the `.spr` into the Packages example folder; it is only in the server's work folder. Tell me if you want it placed there.
