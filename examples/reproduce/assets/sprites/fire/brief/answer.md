The build says OK. The sprite is `sprites/fire.spr` in the work folder, with a contact sheet (`fire-sheet.png`) and an animated preview (`fire-animated.png`) beside it.

**What I made**

- **Name and use:** `sprites/fire.spr`, placed as an `env_sprite`. The build reports render mode 5 (additive) at 10 frames a second.
- **Type and format:** parallel oriented, additive, as you asked. Black is clear, so the flame needs no background.
- **Size and loop:** 64 by 128 pixels, 16 frames. The build writes the first frame again at the end (17 frames in the file) so the loop wraps cleanly.
- **Origin:** bottom, so the flame sits on its base where it is placed.
- **Flame:** one fire layer with a tongue-shaped noise (tongues 1, taper 0.3) that rises and flickers. Its colour runs from a dark red edge through orange to a yellow-white hot middle, so the tongues read as orange and yellow licks going up.
- **Warm light:** a faint orange glow at the base, gain 0.25.
- **Edge:** faded 2 steps at the border so no square shows.

The spec is saved as `work:fire.spec.json`, so the sprite can be rebuilt.

**What I could not check**

- **No comparison against the game's file.** This server has no game folder set up, so I could not read Half-Life's own `fire.spr`. The build's "5 of 5 in range" compares against its built-in measure of a fire loop, not the real file. The comparison that matters for your modder is the in-game one they plan to do themselves.
- **Not viewed in the game.** I looked at the contact sheet only. I did not render it in the engine or test it beside the original.

Two build problems came up on the way and are fixed: the first draft had a brown haze filling the square, and the next had light at the border. The fade and a dark first colour stop cleared both.

If the modder wants a comparison against the game's own file, the game folders need to be given to the server, and I can run the reference measure then.
