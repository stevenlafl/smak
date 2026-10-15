The sprite is built: `sprites/steam1.spr` (work folder), and the build says OK. Its last check passes on every item except the reference comparison, which I think is a limit of the tool, not of the sprite (see below).

**What it is:** a steam puff, a white-grey cloud that swells from a small dot, holds bright for a few frames, then thins and fades to nothing in one play. It has no loop.

**Spec used:**

```json
{
  "spec": "smak.sprite/1",
  "sprites": [
    {
      "name": "sprites/steam1.spr",
      "class": "smoke puff",
      "use": "env_sprite",
      "size": [32, 48],
      "frames": 16,
      "loop": false,
      "fps": 10,
      "type": "parallel oriented",
      "format": "index alpha",
      "origin": "centre",
      "finish": { "edge": 4 },
      "reference": { "picture": "pictures/frames.png", "cell": 64, "cols": 8 },
      "layers": [
        { "kind": "billow", "at": [0, 0], "spread": 0.45, "size": 0.31, "growth": 0.8, "rise": 0.25, "colour": [1, 1, 1], "env": { "decay": 0.7 }, "dissolve": 0.6 }
      ]
    }
  ]
}
```

| Property | Value | Basis |
| --- | --- | --- |
| Size | 32 x 48, 16 frames | Your notes |
| Type / format | parallel oriented / index alpha | Your notes |
| Colour | white-grey, fading toward the dark background | Tuned by eye against the sheet |
| Motion | one play, dot at frame 0, peak around frames 4 to 6, gone by frame 15 | Compared frame by frame against the sheet |
| Frame rate | 10 per second | My choice; your notes do not state one |
| Class / use | smoke puff, placed as an env_sprite | My choice |

**Checks in the last build:**
- Border light 0.004 (Half-Life's own range is 0 to 0.005), so the square edge no longer shows.
- Colour difference 7.4 against the sheet (15 or under is near).
- Dark share 0.66 against 0.62 for the sheet.
- Envelope starts at 0.17 and ends at 0, close to the sheet's faint start and end.
- Jitter 1.11, within Half-Life's range of 0.9 to 1.5.

**Remaining warnings, and why I left them:**
- "16 frames against its reference's 8" and the shape overlap of 0.12 (bar 0.8) come from the reference reader. Your sheet has 64 by 96 cells, and the `cell` setting only takes a square size, so the reader slices the sheet wrongly. The overlap figures are not trustworthy for this sheet. I judged the shape by eye against the sheet instead, and the frame order and growth match.
- I could not make the reader's numbers match by changing the sprite, so I did not chase them.

**Assumptions to check:** the frame rate (10) and the class and use choices are mine. Your notes do not give them. If the original plays at another rate, change `fps` only.
