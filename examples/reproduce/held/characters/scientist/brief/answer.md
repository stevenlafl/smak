I rebuilt the model and the build says **OK** (every check passed). The dark wedges are mostly gone, but I changed the stance to get rid of them, and that is a choice you should look at.

**What the wedges were**

- Not inside-out faces. With culling turned off, the picture did not change, so no back faces were showing through.
- Not unpainted texture. With lighting off the coat is white in the same places.
- They were shading. Faces at the armpits, where the arms stand 30 degrees out from the coat, had normals pointing away from the light, so they came out dark.

**What I changed**

| Setting | Before | Now |
|---|---|---|
| Arm stance, out from the body | 30 degrees | 8 degrees |
| Smoothing angle | default | default (I tried 10 and 30; neither removed the wedges) |
| Triangles | 598 | 598 (700 failed: the pictures saw through the armpit at 0.3%) |

**Result, as I checked it**

| Check | Before | Now |
|---|---|---|
| Front-right view, armpit wedge | large, dark | gone |
| Back-left view, chest wedge | large, dark | gone |
| Right side, armpit | large, dark | one small dark speck |
| Pictures seen through the model | 0.00% | 0.08% |
| Colour difference from the front picture (mean) | 16 | 12.5 |
| Joins that tear in motion | 61 | 55 |

**What is left**

- The run cycle still flares the coat hem in several frames, as before. Fixing it needs the coat and trousers cut as separate parts, which I have not done.
- The colour warning remains: the mean difference from the pictures is over 10 in all four views (12.5 to 14.7).
- The lower front edge on the right side shows a thin dark line where the trousers show through the open coat. That is the coat's open front, not a hole, but a player may notice it.
- I did not run the model in the game, and the game's own scientist file is not here, so the bodygroup and sequence check is not run.

**Files**

- `work:scientist.mdl` is the new model, built from `work:scientist.json`.
- The earlier version is kept at `work:scientist_v1_backup.mdl`.
- Debug pictures named `dbg_*.png` are in the work folder; they can be deleted.
- Nothing is copied into the game folder yet. To test it, copy `scientist.mdl` over the game's `models/scientist.mdl` and keep the game's copy as a backup.
