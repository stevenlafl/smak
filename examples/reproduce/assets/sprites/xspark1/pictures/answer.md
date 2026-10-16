The sprite builds OK, but it is not clean: three of the reference warnings remain. The file is `sprites/xspark1.spr` in the work folder (with `-sheet.png` and `-animated.png` beside it). I did not save the spec JSON to the repo; it exists only in this session.

**What it is:** a cyan glow with a hot white middle and a dark ground, the same as the original's contact sheet (`pictures/frames.png`). It is a flickering blob, looped, and drawn over black, which additive blending treats as clear.

| Field | Original | Mine |
| --- | --- | --- |
| Size | 32×32 | 32×32 |
| Frames | 11 | 11 (10 written as a loop, first frame again at the end) |
| Type | parallel | parallel |
| Format | additive | additive |
| Class | not stated | `glow` |
| Playback | not stated | `env_sprite`, 10 fps (the cap for an env_sprite) |
| Origin | not stated | centre |
| Colours | from the sheet | `ramp: reference`, read off the original frame by frame |

**How it is built:** a `glow` layer (radius 0.9, core 0.4, offset slightly right and down to match the original's centre) for the body, and a `blobs` layer (9 soft discs, redrawn each frame) for the flicker. The envelope holds near full brightness through the loop.

**Measured against the original:**

| Measure | Original | Mine | Bar |
| --- | --- | --- | --- |
| Mean colour (delta E) | — | 3.4 | 15 or under |
| Share that is dark | 0.46 | 0.41 | within 0.05 |
| Border light (brightest) | 0.145 | 0.124 | near |
| Hot middle (pixels over 0.7) | 128 | 145 | not over 1.5× |
| Shape overlap, mean | — | 0.72 | 0.8 |
| Peak frame (share of play) | 1.0 | 0.8 | near |

**Still off (the spec asks for these gone; they are not):**
- **Dark share** is 0.41 against 0.46: my sprite covers slightly more of its frame than the original.
- **Shape overlap** is 0.72 against the 0.8 bar: the flicker shapes do not line up frame by frame with the original's.
- **Peak timing** stays at 0.8 of play however I set the attack; the original peaks on its last frame. I could not find the cause from the report alone.

I made six builds. The change that fixed the most was the glow core widened to 0.4 with the blob gain held at 0.6. Pushing the glow further in on the dark share cost the hot middle, so I stopped there.

**Other choices I made:**
- `class: glow`, not `sparks`: the `sparks` class plays once and must end dark, which this does not do.
- `frames: 10` with `loop: true`, because a loop writes one extra frame and the original is 11.
- Both `frames` and `fps` are my reading; the facts file gives only size, frame count, type and format.

I could not list the input folder (access was denied), so I used the copies in the work folder and the facts file.
