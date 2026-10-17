The sprite is built and the build says OK. It is at `work/sprites/steam1.spr`, with a contact sheet (`steam1-sheet.png`) and an animated preview (`steam1-animated.png`) beside it.

**What it is**

- A 64 by 64 puff of 16 frames, at 10 frames a second, one shot (it starts and ends dark, so it does not loop).
- Type parallel oriented, format index alpha, as you asked. The game places it as an `env_sprite` entity.
- The puff is built from a cluster of 24 soft billows. It starts small and grey, swells to a white middle around frames 4 to 7, then breaks into wisps and fades out by frame 14.
- Colour runs from a mid grey at the rim to near white at the heart. Its edges are lumpy and it drifts and rises slightly.

**How it was made**

I wrote a `smak.sprite/1` spec with one sprite entry and one `billow` layer. The layer's grey-to-white colour is given as a ramp, and the envelope gives a quick swell (attack 0.3) and a long fade (decay 0.7). The first build failed because colour values must be 0 to 1, not 0 to 255, and the frame rate was above the 10 per second an `env_sprite` can change. I fixed both and rebuilt.

**What the check reports**

- OK, every check passed.
- Against Half-Life's own smoke puff, all 5 measures are in range.
- The palette has 244 colours, with no loss from quantising.

**What I did not check**

I did not compare it against `steam1.spr` itself. The report measures against Half-Life's smoke puff class, not that exact file, and I have not seen it beside the game's sprite. The modder should judge that side by side in the game, as they planned. I also did not change the entity's render mode. The report says it places the sprite as render mode 4 (solid), so if the puff looks wrong in game, check the `env_sprite` entity's render mode first.
