The sprite builds **OK** as `work:sprites/muzzleflash1.spr`, with `-sheet.png` and `-animated.png` beside it. Two warnings are still open because the build asks for them to be gone too. I tried about ten variants and they traded one off against the other.

**What I built:** a 64x64 star-shaped muzzle flash, 2 frames, one-shot (not looping), 20 fps, placed as a `tempent` in additive render mode. The reference shows a bright white core, a peach-to-tan glow, and five rays (one straight up, four splayed below and to the sides), so I used a `flare` layer with five half-streaks plus two glows.

**Measured against the original:**

| Measure | Original | Mine | Bar |
|---|---|---|---|
| Mean colour (delta E) | reference | 2.7 | 15 or under |
| Dark share | 0.76 | 0.70 | within 0.05 |
| Shape overlap, frame 0 / frame 1 | | 0.73 / 0.76 | 0.8 |
| Brightest frame | frame 1 | frame 1 | match |
| Border light | 0.02 | 0 | no light at border |

**Still open:**
- Dark share is 0.70 against 0.76: my flash covers slightly more of its frame than the original.
- Shape overlap is 0.75 against the 0.8 bar. Pushing the rays longer brought border light in, which is a fault, so I backed that out.

**Choices I made that the original does not state:**
- 20 fps, one-shot. The reference shows only the two frames.
- The timing: a second glow with an envelope that only rises at the end is what makes frame 1 the brightest, as in the original.

**Spec used:**

```json
{"spec":"smak.sprite/1","sprites":[{"name":"sprites/muzzleflash1.spr","class":"flare","use":"tempent","size":[64,64],"frames":2,"loop":false,"fps":20,"type":"parallel","format":"additive","reference":{"picture":"pictures/frames.png","cell":128,"cols":2},"layers":[{"kind":"flare","core":0.08,"colour":[1,0.78,0.55],"ramp":"muzzle","streaks":[{"angle":90,"length":1.0,"width":0.09,"gain":0.85,"half":true},{"angle":18,"length":0.97,"width":0.09,"gain":0.75,"half":true},{"angle":162,"length":0.97,"width":0.09,"gain":0.75,"half":true},{"angle":-47,"length":0.97,"width":0.09,"gain":0.75,"half":true},{"angle":227,"length":0.97,"width":0.09,"gain":0.75,"half":true}]},{"kind":"glow","radius":0.28,"core":0.1,"ramp":"muzzle","gain":0.2},{"kind":"glow","radius":0.3,"core":0.1,"ramp":"muzzle","gain":0.3,"env":{"attack":0.99}}]}]}
```

The reference was read from the work folder's `pictures/frames.png`, which is the input's `frames.png`. Nothing was written outside the work folder.
