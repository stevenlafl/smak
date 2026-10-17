The build says OK, and the spec and model are in the work folder. Two things are still open: the cartoon look is unchanged, and the line-up test has not been run again.

**What I made**

- **Model:** `work:scientist.mdl`, built from `work:scientist.spec.json` on `barney.mdl`'s skeleton, `floor: 0`, height 68.4. It keeps Barney's 71 animations.
- **Six-side sheet:** `work:scientist-sheet.png`.
- **Build:** OK. The checks report no faults, and every warning is listed below.

**What I changed, by the person's points**

```
Point                              Before                       Now
Torso outline (pear in side/back)  hip egg 14 tall, 10 wide,    straight coat from shoulder to hem,
                                   sitting behind the spine     hip and waist pieces 9.2 to 9.6 wide,
                                                                blend 5 so the pieces melt together
Head (small, boxy)                 12 x 12 x 14, round 0.4/0.5  13.5 x 13.5 x 16, round 0.6/0.8,
                                                                top still at 68.5
Orange shoulders and yoke          torso and arms reached z 63-66,
                                   took the head's skin colour  torso stops at z 59, arms are plain
                                                                white cloth, shoulders white
Orange hips and thighs (new)       side and back took the hands'  torso and legs are painted only from the
                                   skin colour from the picture   picture's middle band, so hands are not used
Hands                              painted from the picture      separate skin-tone parts (paint base, skin tone)
Neck                               none (head floated)           small neck piece under the head
Colour fault from the line-up      orange shoulders              removed (see above)
```

**What is still open**

- **Look:** the pictures are the same zimage cartoon style, so the figure still reads as toy-like next to the game's. I did not regenerate the pictures, so the flatness the line-up judges noticed is not fixed. A photographic-style picture would be the next try, and it needs a new shape run.
- **Tears:** the build warns that 18 triangles join the legs to the trunk and may tear in motion. The walk strip showed no visible tear, but the warning is there.
- **Outline:** the front outline is 0.74 against the picture (warned under 0.8). The side outline, which the person judged, is now straight, not pear-shaped.
- **Carry-overs from before:** the header still names `valve/models/barney.mdl`, and 43 animations are read from the game's external `barney01.mdl`, so the mod needs that file.
- **Shape licence:** the cut-out used for the paint came from the hunyuan3d-mini run (non-commercial licence, accepted for this test). That run's mesh is not in the model.

**Next step for the person**

Look at `work:scientist-sheet.png` and the viewer beside the game's scientist. The specific faults they named (pear torso, small head, orange yoke) should be gone. If the cartoon look is still the problem, I can regenerate the picture in a more photographic style and rebuild.
