The sprite is built and the build says OK: `sprites/glow01.spr` is in the work folder, with a `-sheet.png` and `-animated.png` beside it.

**What it is:** a single static frame of a soft, round, neutral grey glow with a small white centre, placed as an `env_sprite` in render mode 5 (additive), type parallel, class glow, 64x64, one frame, origin centre.

**Spec used** (passed inline, not saved as a file):
```json
{"spec":"smak.sprite/1","sprites":[{"name":"sprites/glow01.spr","class":"glow","use":"env_sprite","type":"parallel","format":"additive","size":[64,64],"frames":1,"origin":"centre","layers":[{"kind":"glow","radius":0.88,"core":0.4,"colour":[1,1,1],"at":[0,0]}]}]}
```

**Choices and what I could not verify:**
- **Falloff:** I tried the power falloff first. It fits the middle values (about 0.45 at 10px, 0.15 at 20px) but never reaches black, so it still showed haze at the frame edge. I switched to the default smooth falloff, which cuts to nothing by about 28px, as the description asks.
- **Radius and core:** radius 0.88 (about 28px) and core 0.4. Radius 0.84 cut the haze at about 27px, and 0.88 was chosen to sit within the 26–28px range. Core 0.2 made the sprite too dark, and 0.28 dimmer than the description, so I used 0.4.
- **Colour:** pure white light, so red, green and blue stay equal at every radius.
- **Measured:** the border is black (0), the dark share is 0.51, and the report says it is in range against Half-Life's own glow.
- **Not measured:** I had no reference picture, so the report gives no side-by-side figures against the original. I could not read individual pixel values here, so the radial brightness at 10px and 20px is estimated from the description, not checked. The middle may run slightly brighter than the original's 0.45.
