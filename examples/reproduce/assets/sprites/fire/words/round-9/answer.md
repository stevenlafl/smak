I built it and the build says OK. The checks found no light on the border, no jump at the loop wrap, and all five measures inside Half-Life's range for a fire loop.

**What it is:** `sprites/fire.spr`, 32x96, 15 frames, parallel oriented, additive. It's placed as an `env_sprite` (render mode 5, Additive) at 10 frames a second, with its origin at the base.

**How it's made:** a fire layer with the fire colour ramp, plus a faint glow just above the base for the white-hot core. The ramp runs from yellow-white to orange to dim red-brown and fades into black, with no blue and no smoke. The flame is about 0.7 of the frame wide at the base and narrows into ragged tongues that end a little below the top. The bottom border is faded so the base looks soft instead of cut off.

**Frame count:** a looping sprite gets its first frame repeated at the end, so I asked for a loop of 14 to come out at 15 frames on disk. That repeated frame is how the sequence wraps without a jump.

Some limits:
- **No reference picture:** with nothing to measure against, the closeness to the original is my reading of the description. There are no shape or colour scores against it.
- **Frames 3 to 5:** these come out dimmer and more smeared than the rest, a stronger flicker than the "pulses slightly" in the description. The tools I had don't give per-frame control over that, so I left it.
- **Close-up view:** the render tool fails on `.spr` files ("offset out of range"), so I couldn't look at single frames close up. All I saw was the build's contact sheet.

Files are in the work folder: `sprites/fire.spr`, plus `fire-sheet.png` and `fire-animated.png` next to it.
