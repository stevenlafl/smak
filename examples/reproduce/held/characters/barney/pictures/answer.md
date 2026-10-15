**Status: not OK.** `barney.mdl` in the work folder is the best carved build, but the build still reports faults, so I haven't got it to pass.

**What works**
- The base is Gordon's skeleton from the Half-Life install (`~/.steam/steam/steamapps/common/Half-Life/valve/models/player/gordon/gordon.mdl`). It loads, keeps its 77 animations, and `floor: 0` stands the feet on the origin.
- The body is carved from `sides.png` and the four angle pictures. Its outline matches each picture at about 0.98 overlap. Its size is 23.0 long, 30.5 wide, 75.4 high, against the original's 22.8, 30.2 and 75.3.
- The colours and markings come from projecting the pictures onto it (the helmet, the vest with its emblem, the SECURITY lettering, the blue shirt and trousers, the boots). The sheet render looks like the original at the same cameras.

**What fails**
The check finds the carved body in 4 pieces. The arms and legs are not connected to the torso, and they sit 0.85 to 3.5 units away in every animation:

```
FAULT in look_idle frame 0: 3 pieces float apart from the rest: body 0.85, 3.46, 2.06 units away
```

I tried these, and none cleared it:
- `allow: { floating: ["body"] }`, `allow: { open: ... }`, and `loose: true`. The "as the spec allows" note does not suppress the FAULT.
- More cells (64 to 192) and more triangles (600 to 800). The gaps stay the same.
- Hip and shoulder bridges as boxes or superquadrics. They stick out as blocks, and the arms still float.
- Blob bridges along the arms and legs. They fill the gaps only partly, and bigger radii bulge the outline.
- Pose fit. It swung the legs out of the original's stance, so I dropped it.

I didn't save the lessons to memory, because the Write tool is disabled in this session.

**Choices for you**
1. **Parts-based body (my recommendation).** Build the torso, limbs, vest, helmet and boots as separate parts that overlap by design, and keep the projected colours. This passes the check without changing any setting. The silhouette will be less exact than the carve, and I haven't measured by how much.
2. **Waive the float check for this carved body.** This is a change to the checker's rule, so it's your call. It keeps the carve's silhouette, and the build would say OK.

Tell me which one, and I'll proceed.
