The build says **OK**. The stripes now show on the body, but the attack is still not fixed, and I need a choice from you to do it.

**What I changed**

- **Stripes and texture:** the hide picture is now a striped hide, `work:gen/hide_stripe_s1.png`, which replaces the dot pattern. I made it with the local shape picture generator (`generate` with `kind: "shape"` and `only: "picture"`, no `length`). The picture generator named in the guide failed on its arguments, so this route is the one that worked. Four takes are in `work:gen/hide_stripe_s0.png` to `_s3.png`. I picked seed 1 because it has the boldest stripes. The spec change is one line, in `work:houndeye.spec.json`.
- **Rebuilt:** 496 triangles, 50.2 long, 48.1 high, floor 0. Other parts and the animations are unchanged.

**The person's points**

| Point | Status |
|---|---|
| No visible stripes on the body | Fixed. The sheet now shows stripes on every side. |
| Surface reads as pixel noise | Partly. The grain is still there at 4 texels a unit, and the dappling is weaker than before. |
| Line-up caught 2 of 4 (scored 1) | Not measured. The stripes may help, but I cannot run their line-up. |
| Attack shows almost no movement | Not fixed (see below). |

**Why the attack is not fixed**

- The name `attack` is not in this model. The sequence the person most likely looked at is `shoot_1`, Gordon's aim-and-fire pose (8 frames at 14 fps). It moves the arms and spine only; the body and legs stay still, which matches their note.
- `long_jump` lifts the body, but it tumbles it in the air, so it does not read as a charge. Swapping it in would also change the sequence's activity, which the game uses to pick the attack.
- A proper fix needs one of two things:
  1. **A motion strip** (my preferred route): a side-view strip of a houndeye charge, 8 frames with the floor drawn, in `work:pictures/`. I would fit `shoot_1` to it with the spec's `motion` key, so it stays in the spec and survives a rebuild.
  2. **A hand-keyed edit** of `shoot_1`, with the body lunging and lifting, written into the built model after the build. It would work, but a rebuild would erase it, and it is not reproducible from the spec.

Which do you want? If the person can supply their own charge strip, I'd use that.

**Leftover files in the work folder**

- `work:houndeye-sheet-rev.png` is the old model's sheet from the first render this session.
- `work:shoot_1.json` is my scratch copy of the `shoot_1` frames.
- `work:gen/hide_s0.png`, `hide_s1.png` and the `houndeye_*` takes are older picture tries. The spec uses only `hide_stripe_s1.png`.

I did not delete any of them, because I have no delete tool here. Say which to remove.
