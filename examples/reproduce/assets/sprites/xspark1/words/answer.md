The sprite is built and the build says OK: `work:sprites/xspark1.spr`, with `-sheet.png` and `-animated.png` beside it. I had no copy of the original to measure against, so the match is to your description, not measured against the original.

**Spec used** (class `glow`, `use` `env_sprite`):

```json
{"spec":"smak.sprite/1","sprites":[{"name":"sprites/xspark1.spr","class":"glow","use":"env_sprite","size":[32,32],"frames":11,"loop":true,"fps":10,"type":"parallel","format":"additive","origin":"centre","finish":{"edge":2},"layers":[
 {"kind":"glow","radius":0.85,"core":0.4,"colour":[20,90,130],"gain":0.07},
 {"kind":"blobs","count":5,"radius":0.24,"spread":0.55,"core":0.35,"soft":0.5,"colour":[20,90,130],"gain":0.1},
 {"kind":"glow","radius":0.62,"core":0.12,"colour":[60,220,255],"gain":0.14},
 {"kind":"glow","radius":0.16,"core":0.06,"colour":[255,255,255],"gain":0.22}]}]}
```

**What it is and how it matches your description:**

| Item | Original (your description) | This sprite |
|---|---|---|
| Frame size | 32x32 | 32x32 |
| Frames | 11, loop | 11 (the file holds 12: the kit repeats the first frame at the end so the loop wraps cleanly) |
| Type / format | parallel, additive | parallel, additive |
| Hot core | ~10–12 px, near white, mid-frame | near-white centre, roughly 14–16 px, a little larger than asked |
| Cyan glow | ~RGB 60,220,255 | cyan ring, colour as specified |
| Teal lobes | ~RGB 20,90,130, 4–6 lumps | teal blobs, 5 per frame, placed afresh each frame so the outline is lumpy and changes |
| Glow extent | 26–30 px, fades to black | fades to black inside the frame, border light 0 |
| Motion | lobes shift at random, core drifts, steady brightness | lobes re-placed per frame, no overall growth or fade |
| Frame rate | 10–15 fps | 10 fps |

**Choices I made that you should know about:**

- **Frame rate is 10, not 12–15.** Set `use` to `env_sprite` and the kit warns that an env_sprite changes frame at most 10 times a second, and at 12 it skipped frames. I held it at 10. If you want 12–15, the sprite would need a different `use` (I did not test `tempent`).
- **The core is a bit larger than 10–12 px.** I could not get the white centre below about 14 px without the teal lobes disappearing, so I kept the lobes visible.
- **No dark flecks in the core.** The kit's blob layers add flicker but do not cut dark specks into the white, so that detail of the description is not reproduced.
- **Shape is generated, not traced.** The lobes come from random placement, so the exact silhouette will not match the original frame for frame. The overall look (charge, cyan rim, teal cloud, steady boil) should.
