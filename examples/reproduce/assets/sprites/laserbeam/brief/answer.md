The laser beam sprite is built and the build says OK. It is written to `work:sprites/laserbeam.spr`, with `laserbeam-sheet.png` and `laserbeam-animated.png` beside it. The spec is `work:laserbeam.json`.

**What it is**

- **Name and use:** `sprites/laserbeam.spr`, class `beam`, use `beam`. It replaces the game's sprite of that name, and the build places it as a beam in render mode 5 (additive).
- **Size and frames:** 64x32 pixels, one frame. A beam tiles along its length, so no loop is needed.
- **Look:** one beam layer with a round profile and a tight core (0.16 of the width). The middle is white and the colour falls off through pale blue to dark blue at the sides. A small amount of noise and streaking keeps the core from looking flat.
- **Sides:** the edge of the sprite is almost dark (border light 0.099, brightest 0.978), so the glow fades out on its own and does not show a hard line at the top and bottom.

**How it was made**

1. I wrote the spec as a single beam layer. The first build failed because the ramp colours must be given from 0 to 1, not 0 to 255. I fixed those values.
2. My first try used a flat profile with a wide shoulder. Its edges stayed at 0.335 brightness, which would show as a bright band at the sides. I switched to the round profile, which brought the edge down to 0.099.

**What I could not check**

The build compares against Half-Life's own beam, but no game folder was available here, so the report says "0 of 0 in range". I could not measure it against the game's sprite, and I did not look at it beside the original in the game. The modder's own eyes in the game are the real test. Whether it is at least as good as the game's sprite is for them to judge there. They can tint it in the game with the entity's render colour, since the sprite is white-hot and the blue is in the glow.
