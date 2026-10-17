I made the sprite and the build says OK. It is at `work:sprites/zerogxplode.spr`, with a contact sheet (`zerogxplode-sheet.png`) and an animated preview (`zerogxplode-animated.png`) beside it. The spec is `work:sprites/zerogxplode.json`.

**What it is:** a 128 by 128 sprite of 15 frames at 30 frames a second, played once and not looped. It is additive, so black is clear and only the light shows. It is placed as a temporary entity, which is how the game draws explosions, with render mode 5 (Additive).

**How it is made:** the spec has three layers, summed:
- **Fire ball** (`explosion` layer, blast colours): a bright core that swells and cools from white to cream to tan to brown, the colours of the game's own explosion.
- **Billowing cloud** (`billow` layer): 24 lit spheres spread out from the centre, growing, rising a little, drifting, and breaking into wisps as they age. This is the part that bursts out and billows.
- **Glow** (`glow` layer): a soft halo that fades with the fire.

The envelopes bring it up fast and then let it decay, so it peaks around frame 3 to 5 and is nearly dark by frame 13. Frame 14 is empty, so it burns away to nothing.

**What the build checked:** the file is 256 colours, the border is dark (no light at the edges, so no hard box in game), and its loop-free start and end are clean. The build's comparison said 5 of 5 measures were in range against Half-Life's explosion class.

**One caveat:** this server has no Half-Life game folder, so I could not load the game's own `zerogxplode.spr` and compare it frame by frame. The "5 of 5" is against the stored figures for Half-Life's explosion class, not against that file. The frame count and speed are my choices, not copied from the original, so the modder should check them against the game's file. The sprite replaces the game's by name, so they can drop `sprites/zerogxplode.spr` into their mod's sprites folder and compare the two side by side in game. If it reads too pale or too short, the spec's `gain` and `decay` values are the first things to change.
