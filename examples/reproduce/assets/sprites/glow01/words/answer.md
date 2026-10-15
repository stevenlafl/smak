The sprite is built and the build says OK: `work:sprites/glow01.spr`, with a sheet and an animated preview beside it.

The spec is `smak.sprite/1`, one sprite named `sprites/glow01.spr`:

- **Class and use:** `glow`, placed as an `env_glow`. The build reports render mode 3 (Glow).
- **Size and frames:** 64 by 64 pixels, 1 frame, no animation.
- **Type and format:** `parallel` (faces the viewer flat), `additive` (black is clear).
- **Origin:** centred.
- **Shape:** two glow layers summed, both with power falloff (`1 / (1 + (r / core)^power)`):
  - A tight core (`core` 0.08, power 4, about 5 pixels) for the near-white hot spot, about 4 to 6 pixels across.
  - A broad halo (`core` 0.3125, power 2, gain 0.85) that gives about mid grey at 10 pixels, dim grey at 20, and fades to black by about 30 pixels (`radius` 0.94).
- **Colour:** neutral white, `[1, 1, 1]`, no tint.

The build's measurements: the border is 0.003 (brightest 0.024), so there is no square outline. The build also reports 117 colours with quantising loss of 0.0025. Against Half-Life's own glow it is in range (1 of 1).

I did not compare it side by side with the original. I only had the description, so the radii and grey levels come from calculating the falloff curve, not from measuring a real frame. The build's reference check needs the original's sheet, so the judge's shape and colour numbers were not run. If you can supply the original's sprite or a contact sheet of it, I can add it as a `reference` and tune the two layers against those numbers.
