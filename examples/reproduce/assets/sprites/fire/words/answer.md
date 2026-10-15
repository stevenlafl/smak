The sprite is built and the build says OK: `sprites/fire.spr` is in the work folder, with a contact sheet and an animated preview beside it.

**What it is:** a looping campfire flame, additive so black drops out, parallel oriented (faces the viewer, stays upright), origin at the bottom so the flame sits on its base.

**Shape and size:** 32 by 96 pixels, 15 frames. The flame is widest at the base and narrows into ragged tongues that reach close to the top. I set it as a fire layer plus a soft glow at the base to get the bright core.

**Frames and motion:** 15 frames at 10 frames a second, which is in the engine's limit for an `env_sprite`. The tongues flicker and sway from frame to frame, and the sequence wraps without a jump (the report's wrap score is 0.77, and the wrap frame is a copy of the first).

**Colours:** a yellow-orange core fading through orange into dark rust at the edges and tips, with no blue and no smoke. The fire colour ramp is what produces this.

**Type and format:** `use: env_sprite`, render mode 5 (additive).

**Choices I made without the original:**
- The frame rate, 10 a second, is a guess. The description gives no frame rate.
- The flame's height and tongue shape are tuned by eye against your description. The build's check only confirms the file's format and its loop against Half-Life's own fire loops (5 of 5 in range).
- No reference picture was given, so I could not measure it side by side with the original. If you can give me a contact sheet of the original's frames, I can set it as a reference and tune the colours and shape against it.

The spec is in the work folder's build output and can be rerun as it is.
