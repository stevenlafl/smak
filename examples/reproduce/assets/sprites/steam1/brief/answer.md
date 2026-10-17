The build says OK. I made a replacement `sprites/steam1.spr` from a spec, and it's ready for the modder to compare in game.

**What I made**

- **File:** `work:sprites/steam1.spr`, with `-sheet.png` and `-animated.png` beside it.
- **Spec:** saved as `work:steam1.json`, so the build can be redone.
- **Settings:** parallel oriented, index alpha, as they asked. Class `smoke puff`, used as an `env_sprite`, 64 x 64 pixels, 16 frames, one-shot (no loop), 10 frames per second, centred origin.
- **Look:** one soft lumpy cloud built from 24 spheres (a `billow` layer). It starts small and grey, swells to a near-white middle around frames 4 to 5, then thins and breaks into wisps by frames 13 to 15. The colour runs from near-white at its hot middle to mid-grey at its rim.

**What the build reported**

- The build reports the sprite as 5 of 5 in range against Half-Life's smoke puff class. Jitter is 1.01 (in its 0.9 to 1.5 range), and the peak is at 0.33 (in its 0.2 to 0.6 range).
- It is placed as an `env_sprite` in render mode 4 (Solid), at framerate 10.

**What I could not do**

- **No direct comparison with the game's `steam1.spr`.** There is no game folder on this machine, so I could not give the build the original as a `reference`. The "5 of 5 in range" figures compare against the smoke puff class in general, not against that file.
- **Not seen in the game.** I checked the sheet and the animated picture here, not in Half-Life. The modder's eye is the real test. If the puff looks too blown-out at its peak or too wispy at the end, the `ramp` stops and the `dissolve` and `growth` values are the knobs to change.
