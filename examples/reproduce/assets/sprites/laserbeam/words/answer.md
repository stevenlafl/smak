The sprite is built and the build says **OK**: `work:sprites/laserbeam.spr`, with a sheet and an animated preview beside it. It is not a close match yet on the edges, and I could not compare it to the original because I don't have the original.

**Final spec** (the build that is on disk):

```json
{"spec":"smak.sprite/1","sprites":[{"name":"sprites/laserbeam.spr","use":"beam","class":"beam","type":"parallel","format":"additive","size":[32,64],"frames":1,"loop":true,"fps":10,"layers":[
  {"kind":"beam","core":0.25,"profile":"flat","shoulder":0.04,"noise":0.2,"streaks":0.3,"colour":[0.95,0.98,1.0],"at":[-0.05,0]},
  {"kind":"beam","core":0.5,"profile":"round","noise":0.7,"streaks":0.7,"gain":0.5,"colour":[0.55,0.62,0.72],"at":[-0.05,0]}]}]}
```

**What it is:** 32 by 64, one frame, type parallel, format additive, placed as a beam (render mode 5, additive), 10 fps.

**How the layers match your description:**
- **Core:** a flat white band (near 1.0 at the centre), about 8 to 10 px wide, leaning slightly left (`at` x of -0.05).
- **Halo:** a round, mottled layer in a cool grey (about 0.55, 0.62, 0.72), with streaks and noise along the beam. It falls off toward the edges.
- **Tiling:** one frame, so nothing animates inside the sprite. The engine moves the texture along the beam.

**What doesn't match yet:**
- **Edge brightness:** the outer columns average about 0.12 of full brightness. Your description calls for the halo to fade to black 2 to 4 px from each edge. Every variant I tried that kept a bright halo also kept the edges around 0.09 to 0.15. The round halo alone got the edges down to 0.06, but then the core was no longer near white.
- **Right halo:** the spec has no way to make the right halo wider and brighter than the left, so the sprite is symmetric apart from the core lean.
- **Comparison:** the kit has no Half-Life beam reference here, so the report shows "0 of 0 in range" and gives no score against the original.
- **Visual check:** the preview images are too small for me to judge the streaks or the 10 to 20 px brightness rhythm on the outer edges. The numbers are the only check I could make.

I tried about 15 builds to get there. The variants and their edge and dark readings are in the build history above. If you can send me the original sprite or a close picture of it, I can use its `reference` to get a real score and tune the edges against it.
