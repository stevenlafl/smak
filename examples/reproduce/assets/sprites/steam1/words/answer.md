The sprite is built and the build says OK: `work:sprites/steam1.spr`, with a contact sheet and an animated preview beside it. I had no copy of the original to compare against, so everything below is measured against your description, not side by side with the game's file.

**What it is:** a one-shot steam puff, 32x48 pixels, 16 frames, parallel oriented, index alpha (coverage carries the shading), no loop, placed as an `env_sprite` at 10 frames a second. The build's measures give 256 colours, a faded border, and a last frame that ends dark.

**How it matches your description:**
- Frame 0 is a small white dot low and a little left of centre.
- Frames 1 to 3 grow into a dense, lumpy white cloud.
- By frames 4 to 7 it nearly fills the 32-pixel width, bright in the middle with grey shading.
- Frames 12 to 15 break into grey fragments that fade out by frame 15.
- Only white and greys are used.

**Known gaps:**
- **Frame 0** is about 7 pixels across, not 3.
- **Frames 8 to 11** read as a broad blob rather than a tall column with a narrower grey trail below.
- **Frame-to-frame flicker** measures 1.62 against the judge's 1.5 limit. I tried several settings and this did not move; the wisps from the break-up seem to cause it. Reducing the lumps would bring it down but loses the cauliflower edge you described, so I kept the lumps.
- **Frame rate** of 10 a second is my guess; your description doesn't give one.

**The spec used** (layer `billow`, in `sprites/steam1.spr`):

```json
{"spec":"smak.sprite/1","sprites":[{"name":"sprites/steam1.spr","class":"smoke puff","use":"env_sprite","size":[32,48],"frames":16,"loop":false,"fps":10,"type":"parallel oriented","format":"index alpha","origin":"centre","finish":{"edge":5},"layers":[{"kind":"billow","at":[-0.05,-0.45],"count":60,"spread":0.3,"size":0.2,"growth":1.3,"rise":0.6,"drift":0.03,"blend":0.6,"lumps":0.4,"hot":0.3,"cool":0.5,"dissolve":0.95,"ramp":[[0,[0.27,0.27,0.27]],[0.5,[0.63,0.63,0.63]],[1,[1,1,1]]]}]}]}
```

If you have the original `steam1.spr` or a contact sheet of it, I can add it as a `reference` and tune the shape and timing against it frame by frame.
