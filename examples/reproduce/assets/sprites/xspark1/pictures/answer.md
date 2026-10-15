The sprite is built and written as `sprites/xspark1.spr` in the work folder, with `-sheet.png` and `-animated.png` beside it. The build says OK, but one warning remains: the shape overlap with the original is 0.71 against the 0.8 bar, so it is not fully close yet.

**What it is:** a cyan-blue glow with a bright white core and soft lobes that shift from frame to frame, like the original's. The class is `glow`, used as an `env_sprite`, so it plays at 10 frames a second with render mode 5 (additive).

**Shape, size and frames:** 32 by 32 pixels, parallel to the camera, centred. It has 11 frames: 10 written plus the first again at the end, so the loop wraps cleanly and the original's 11 frames match.

**Colours:** a ramp from black through deep blue (0, 0.275, 0.784) and cyan (0.157, 0.784, 1) to near-white at the core. Mean colour difference from the original is 12.7 (bar 15). Dark share is 0.51 against the original's 0.46, which is inside the 0.05 bar.

**Format:** type `parallel`, format `additive` (black is clear), border dark, as the original.

**Build history:** I went through about nine builds. The main changes were:
- Using 10 frames with a loop, not 11 frames, because the loop writes the first frame back in.
- Replacing the blue ramp with a cyan-to-white ramp, which brought the colour difference from 22.5 down to 12.7.
- Setting the glow layer's outline to follow each of the original's frames (`mask: "reference"`), lowered 2 to 3 pixels to match the core's position.

**What is still off:** the shape overlap stayed between 0.66 and 0.71 in every variant. The glow follows the original's outline, but the blob layer adds random lobes that spill past it, and removing them made the sprite a static disc (overlap 0.42). I could not get past 0.71 without losing the shape or the dark share.

**Disclosure:** the glow layer's outline is traced from the original's contact sheet by the `mask: "reference"` setting. That is the tool's documented way to match a shape to a reference, and you asked for the closest match, but it means the outline comes from the original rather than being built from scratch.
