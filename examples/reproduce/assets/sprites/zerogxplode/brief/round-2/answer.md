The sprite builds OK: `work:sprites/zerogxplode.spr`, next to a contact sheet (`-sheet.png`) and an animated preview (`-animated.png`). The spec is `work:zerogxplode.json`.

**What it is**
- Name `sprites/zerogxplode.spr`, so it replaces the game's file by name.
- Type parallel, format additive (black is clear, only light is drawn), as the original's are.
- Used as a temporary entity (`tempent`, the kind the game uses for explosions), render mode 5 (additive), 15 frames at 15 per second, one shot that does not loop.
- 128 by 128 pixels, with a fade at the edges so no square shows.

**How it is made** (two layers, summed)
- `explosion`: a hot fireball in the first frames, coloured by the game's own explosion ramp (`blast`: white, cream, tan, brown), that starts from a small flash and grows a little.
- `billow`: 18 lit spheres in a disc about half the frame wide. They swell out from the centre, rise and drift a little, and are coloured by the same ramp. As they age they break into wisps (`dissolve`), so the fireball bursts, puffs out into lobes, and burns away to nothing by about frame 14.

**Build results**
- First try: the lobes were too far out and the light ran to the frame's edge. That was a FAULT; fixed by pulling the lobes in and adding the edge fade.
- Final build: OK, and every check passed. Its colours and envelope fall within the range of Half-Life's explosions (5 of 5 checks in range).

**What I could not do**
- I did not compare it against the game's own `zerogxplode.spr`. This server has no game folder set up, so the original was not readable. The "in range" checks compare against the typical Half-Life explosion, not this exact sprite. I also guessed the original's frame count and size (15 frames, 128 by 128), so those may differ.
- The build cannot tell whether it looks good. The modder has to judge that in the game, beside the original. If it is too big, too bright or too short, the spec's `size`, the billow's `spread` and `growth`, and the layer `gain`s are the knobs to turn.
