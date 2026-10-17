The sprite builds **OK** with no faults. It is at `work/sprites/xspark1.spr`, with a sheet and an animated preview written beside it.

**What I made**

| Property | Value |
| --- | --- |
| Name | `sprites/xspark1.spr` (replaces the game's file by name) |
| Type / format | parallel (faces the camera) / additive (black is clear) |
| Size | 32 x 32 pixels |
| Frames | 8, looping (the first frame is repeated at the end so the wrap is smooth) |
| Speed | 10 frames per second, the most an `env_sprite` changes |
| Use | `env_sprite`, placed in render mode 5 (Additive) |

**How it's built**

- A soft blue-white glow in the middle, with a core of about a fifth of the frame and a pale blue colour.
- Five small blobs placed fresh on each frame, which give the flicker in place. Their colour goes from dark blue at the edge, through blue, to near-white at the hot middle.
- The edge is faded (`finish.edge`), so the square frame doesn't show. I first got a faint blue square because the blobs' darkest colour was still adding light. Making that colour black at zero brightness fixed it.

**What the build checked**

- Border light is 0, so no square shows.
- The loop wraps smoothly (0.98 on a scale where 1 is perfect).
- The glow matches Half-Life's own glow class in range (1 of 1).

**Limits to know before they judge it**

- The game folder isn't reachable from here, so I could not read Half-Life's `xspark1.spr` and compare it directly. The comparison was against the game's glow class, not that file. Its real size, frame count and speed are unknown to me.
- I picked `env_sprite` and a 10 fps loop from the spec's defaults, not from the original. If their mod uses the sprite in a temporary entity, the `use` field would need changing.
- Their own eyes in the game are the real test: place it beside the stock sprite and compare brightness, size and flicker speed. If it's too big or too dim, the glow `radius` and `gain` in the spec are the knobs.
