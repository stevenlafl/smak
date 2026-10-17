The steam puff is built and the build says OK. It is at `work:sprites/steam1.spr`, with a contact sheet (`sprites/steam1-sheet.png`) and an animated preview (`sprites/steam1-animated.png`) beside it.

**What I made**

- **Shape:** one 64×64 puff, 16 frames at 10 frames a second, played once (not looped). It starts as a small white-grey lump near the centre, swells, rises a little, and then breaks apart into wisps. By frame 13 it is almost gone, and frames 14 and 15 are clear.
- **Colour:** grey-white, from a dark grey edge to near-white in the middle of the lit part. Its brightest point is about frame 4.
- **Format:** `index alpha`, so the puff is coverage and not glow. It shows as a solid cloud over the level, not as a light that adds to what is behind it. Steam should look like this, not like a flare.
- **Placement:** it is set up as an environment sprite (`env_sprite`, the entity a map places to show a sprite in the world). The build's note gives its render mode as 4, which is the engine's alpha-blended mode.

The spec I wrote is `work:steam1.json`, so the build can be run again. Its parts are a `smoke puff` class, one `billow` layer (a lit cloud of overlapping spheres), and an envelope that peaks early and fades. The rise, growth and dissolve amounts are guesses that I tuned by eye on the sheet.

**What I could not check**

- **Against Half-Life's own steam1.spr:** this server has no game folders, so I could not load the original. The "5 of 5 in range" line compares the puff with Half-Life's smoke-puff class in general, not with the file. The comparison the modder cares about, in the game beside the original, is one I could not make here.
- **Puff size and speed:** the original may be smaller or faster. If it is, the size and `fps` fields in `steam1.json` are the ones to change.
- **Look at the end:** the puff breaks into holes before it fades, which reads more as a cloud dispersing than as a thin wisp. If the original thins out more smoothly, the `dissolve` value (0.8) is the field to lower.

To compare it in the game, copy `sprites/steam1.spr` into the mod's `sprites` folder over the original, then look at a pipe leak beside one that still uses the original. If they want a different look, tell me what it should be closer to and I will change the spec and rebuild.
