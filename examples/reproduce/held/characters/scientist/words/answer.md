The model builds OK: `scientist.mdl` is at `work:scientist.mdl`, built on Gordon's skeleton with `floor: 0`, and every check passes. I only had your written description, not a picture of the original, so I checked it against that description and the build report, not side by side with the original.

Measures from the final build:

```
Item                     Original (described)   Built
Height                   68                     68.1
Width, across the hands  21.7                   about 20.2 (hand cylinders)
Overall width            (not given)            23.1
Length front to back     33.3 (mid-stride)      16.1 (standing)
Hip line                 about 34               about 39
Triangles                (limit 724)            676
Checks                                          OK, no faults
```

Where it differs from the original:

- **Hip line and legs.** Gordon's skeleton puts the hips about 39 units up, against about 34 for the scientist, so his legs read longer. Changing that means changing the skeleton, which you asked me to keep.
- **Length.** I did not force 33.3. That figure comes from a mid-stride walk, and a standing figure is about 16 deep.
- **Hands.** The hands are bare skin cylinders that reach mid-thigh, not curled fists. A fist I tried floated in one crouch frame, so I replaced it.
- **Coat, shirt, tie, belt, glasses and hair.** The coat, trousers and sleeves are simple boxes and cylinders. The shirt, tie (navy with two small red patches, not diagonal stripes), belt and lens panels are painted on the coat front and glasses. The hair is a grey-white band from ear to ear. The coat is a muted 0.8 grey-white rather than bright white, to avoid the "used grey" warning.
- **Posture.** The spine is leaned forward about 8 degrees, the head is held roughly level, and the arms are angled in slightly to bring the hands in.
- **Running.** The run and walk animations are Gordon's, not the scientist's. I had no reference pictures to fit a stride to, so his running lean and coat flap are not reproduced.

Files: `work:scientist.spec.json` holds the spec. If you install `scientist.mdl` over the game's own file, it replaces the original, so keep a copy of the stock file. A new file name would need the map or mod code to load it at map start.
