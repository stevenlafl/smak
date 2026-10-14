I built `sprites/fire.spr` in the work folder, and the final build says OK with every check passed. It's 32x96 with 15 frames, type parallel oriented and format additive, all matching the original. It plays at 10 frames per second with its base at the bottom, and it's placed as an env_sprite with render mode 5 (Additive).

Getting exactly 15 frames needed a workaround. The tool writes a loop with its first frame repeated at the end, so I asked for a 14-frame loop. Frame 14 is therefore a copy of frame 0, so the cycle has 14 distinct frames, not 15 like the original.

The spec has two layers:
- **Flame:** a wide, very ragged fire layer filling most of the frame, turned down a bit so it's less bright.
- **Glow:** a small orange glow in the lower middle, for the bright area low in the flame.

The tool scored it within range of Half-Life's own fire loops on all 5 of its measures. There's no light at the border, and the loop doesn't jump where it wraps.

Next to the original, mine still differs in two ways:
- **Core colour:** its brightest part is a little paler and nearer white, where the original stays orange-red throughout.
- **Shape:** it narrows to a point at the top, while the original stays wider and more column-like with loose tongues of flame.

I tried one more tweak to warm up the core, but it turned the core grey, so I went back to the build before it.

The sheet of frames and an animated preview are saved beside the sprite.
