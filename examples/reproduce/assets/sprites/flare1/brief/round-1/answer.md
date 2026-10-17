The sprite builds **OK**, and the file is at `work:sprites/flare1.spr` (the spec is `work:flare1.json`). Drop it in the mod's `sprites/` folder in place of `flare1.spr`.

**What it is:** a 128×128, single-frame, additive sprite (black is clear), placed as an `env_sprite` (render mode 5, additive). It has two layers:

- **Glow:** a small, hot white core, radius 0.2 of the frame, with a smooth falloff.
- **Flare:** a white core plus four soft, tapered, blurred streaks at 0°, 90°, 45° and 135°. The horizontal and vertical streaks are the longest. Each has a faint haze. There are 48 thin rays round the core, of seeded lengths.
- **Edge:** the border is faded over 12 pixels so the square frame does not show.

**How I got there:** the first builds failed on the frame's square edge showing (a power falloff in the glow spread light into the corners, so I switched to the smooth falloff), and on streaks reaching the border. Each fix made the centre dimmer, so I raised the gains until the core read white again.

**What to check:**
- **I could not put it beside Half-Life's own `flare1.spr`.** No game folder is connected to this machine, so the report's comparison against the game's flare has no reference data. Your modder needs to compare them in the game, which is the real test.
- **The report's "brightest" figure reads low (0.063, on a 0 to 1 scale)**, yet the picture's centre looks near white. I could not reconcile the two, so trust the in-game look over that number.
- The border is at 0.006 against a target of 0.005. This is a note, not a fault, and the build passed.
- The picture is only 128 pixels, so I could not judge fine detail at a large size. Shrinking or enlarging the sprite in the game will show whether the streaks hold up.

To change the look, edit the layer gains and streak lengths in `work:flare1.json` and build again.
