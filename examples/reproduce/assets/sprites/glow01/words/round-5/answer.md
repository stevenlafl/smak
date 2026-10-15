The sprite is built: `work:sprites/glow01.spr`, and the build says OK with every check passed.

**Spec used:**

```json
{"spec":"smak.sprite/1","sprites":[{"name":"sprites/glow01.spr","class":"glow","use":"env_sprite","size":[64,64],"frames":1,"type":"parallel","format":"additive","origin":"centre","layers":[{"kind":"glow","core":0.31,"falloff":"power","power":2,"reach":0.95,"colour":[1,1,1]}]}]}
```

**What it is and how it matches your description:**

- **Shape:** a round radial glow centred in the frame, with no rays, rings or noise.
- **Falloff:** `1 / (1 + (r / 0.31)^2)`, which gives about 0.5 (mid grey) at 10 px, about 0.2 (dim grey) at 20 px, and a faint haze beyond. `reach` 0.95 eases the glow to nothing at about 30 px, so it reaches black in the 30 to 32 px range you described.
- **Corners and edges:** the build reports the border at 0, so no square outline shows.
- **Colour:** neutral white (1, 1, 1), so the engine can tint it with render colour.
- **Frames:** one frame, no animation.
- **Type and format:** `parallel`, `additive`, placed as an `env_sprite` in render mode 5 (Additive).
- **Size:** 64 by 64.

**Build report:** the game's glow class has 1 of 1 measures in range. The palette quantising lost 0.0034.

**Choices I made:**
- The `reach` of 0.95 is my own setting, chosen so the falloff ends at the 30 to 32 px radius you gave. Without it the border was not black (0.004).
- The hot spot is the falloff's peak. It is close to white across the centre, but I did not measure a 4 to 6 px white core separately.

**Caveat:** I do not have the original file, so I could only compare against your description, not side by side. The radius values above are arithmetic from the formula, not measured on the picture. If the judge's side-by-side shows the haze too wide or too tight, the `core` (0.31) and `reach` (0.95) values are the two to adjust.
