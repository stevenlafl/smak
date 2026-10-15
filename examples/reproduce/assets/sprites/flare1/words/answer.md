The sprite builds OK: `work:sprites/flare1.spr`, written beside a contact sheet and an animated preview. The build's report says 64x64, 1 frame, additive, render mode 5 (Additive), placed as an `env_sprite`. Against Half-Life's own flare it is in range.

I had no reference picture, so the judge's side-by-side measures (colour, dark share, shape per frame) were not run. The check is by eye only, at the 128px preview.

The spec I used:

```json
{"spec":"smak.sprite/1","sprites":[{"name":"sprites/flare1.spr","class":"flare","use":"env_sprite","type":"parallel","format":"additive","size":[64,64],"frames":1,"origin":"centre","layers":[{"kind":"flare","core":0.3,"at":[0,0],"streaks":[],"ramp":[[0,[0,0,0]],[0.2,[0.157,0.098,0.196]],[0.45,[0.549,0.353,0.49]],[0.7,[0.902,0.745,0.843]],[0.9,[1,0.941,0.961]],[1,[1,1,1]]],"rays":{"count":48,"length":0.9,"jitter":0.5,"width":0.012,"gain":0.25}}]}]}
```

Choices I made:
- **Shape:** a flare layer with a 0.3 core, centred, falling off to black at the frame's edges.
- **Colour:** the ramp runs from black, through dark violet-grey and dusty rose-mauve, to pale pink-lavender and warm white at the core.
- **Rays:** 48 thin, faint rays at gain 0.25, spread evenly round the circle. I set `streaks: []` because the default streaks drew a dominant horizontal and vertical cross, which the description rules out.
- **Type and format:** parallel and additive, one frame, no animation. Any flicker should come from the engine scaling or dimming the sprite.

Not verified: the exact core width against the original's quarter to third of the frame, and the alternating bright and dark rays. Those need the original beside it to judge properly. If you can give me the original as a reference picture, I can run the measures and tune against them.
