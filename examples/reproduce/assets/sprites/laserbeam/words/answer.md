The sprite is built and the build says OK. It is at `work:sprites/laserbeam.spr`, with the sheet and animated previews beside it.

Final spec, with the reading I took: a laser beam as a `beam`-class sprite, `parallel` type, `additive` format, one frame, 32x64, centred origin.

```json
{
  "spec": "smak.sprite/1",
  "sprites": [
    {
      "name": "sprites/laserbeam.spr",
      "use": "beam",
      "class": "beam",
      "size": [32, 64],
      "frames": 1,
      "type": "parallel",
      "format": "additive",
      "origin": "centre",
      "finish": { "edge": 3 },
      "layers": [
        { "kind": "beam", "core": 0.3, "profile": "round", "noise": 0.5, "streaks": 0.6, "colour": [226, 234, 248] }
      ]
    }
  ]
}
```

Build facts: 32x64, 1 frame, additive, render mode 5, 100 colours, quantising loss 0.001. The border light is 0.26 and 13% of the frame is dark, which matches a halo that fades to black about 2 px in from each edge. The core is about 9.6 px wide, inside the 8 to 10 px you described. The colour is a cool white-grey.

Choices and the gaps against your description:

- **Profile:** I tried the `flat` profile first. Its light ran nearly to the edges (border 0.70), so I switched to `round`, which falls off into the dark edges.
- **Edge fade:** `finish: edge 3` fades the outer pixels so the halo reaches black at the sides.
- **Off-centre core and brighter right halo:** not done. The beam layer has no offset or left/right asymmetry, so the core is centred and both halos match. Matching the lean would need a second layer or a change to the kit, and I did not invent one.
- **Striations and mottling:** approximated by the beam's `noise` (0.5) and `streaks` (0.6). The kit's build report does not measure these, so I have not verified how closely they match the original's.
- **Comparison:** there is no reference sheet of the original, so the report has no side-by-side numbers. The build's "against Half-Life's beam" line reads 0 of 0 for that reason.
