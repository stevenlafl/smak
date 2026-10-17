The sprite builds and the build says OK, with one warning still open: the flame's shape doesn't match the original closely enough.

**Output:** `work:sprites/fire.spr`, built from `work:sprites/fire.json` (the smak.sprite/1 spec). The build also wrote `fire-sheet.png` and `fire-animated.png` beside it.

**What it is:** a fire loop: a flame on its base, parallel and oriented (it faces the camera), additive (black is clear).

**Size and frames:**
- 32x96 pixels, the same as the original.
- 15 frames, matching the original. The loop has 14 frames of its own, and the engine's wrap adds the first frame again at the end.
- Played at 10 frames a second, placed as an `env_sprite` with render mode 5 (additive).

**Colour:** the flame's colours are read from the original's own sheet, frame by frame, so its hot middle is the original's cream-to-orange and its faint edges its dark red. Colour difference from the original is 0.6 (the bar is 15 or under). The share of dark pixels is 0.42 against the original's 0.38.

**Brightness:** the brightest frame is 0.7 of full brightness against the original's 0.69, and no pixels go over 0.7. The first and last frames are 0.92 and 0.92 of the brightest, against 0.9 and 0.84 in the original, so the loop wraps cleanly. The light at the frame's border is 0.22 against 0.275.

**Layers:**
- A fire layer: the flame, 1.3 wide, no taper so it fills the frame's width, tongues 0.5, gain 0.9.
- A glow layer behind it: power falloff, radius 1.4, gain 0.4, at [0, -0.4]. It gives the border light.

**Still open:** the shape overlap with the original is 0.63 against the bar of 0.8. The original's flame reaches up to about rows 6 to 18 of its 96 rows; mine stops near row 30. Taller settings (`height`), `rise`, and masking the layers to the original's outline each either worsened the colour or made frames go blank, so I kept the closest version. Closing that gap probably needs a tuned `height` or an extra layer; I did not find the setting in the time I spent on it.

Other things to know:
- The peak frame is 0.14 of the way through the play against the original's 0.07. The report does not flag this, and an envelope on the flame made frames go blank, so I left it.
- A preview render of the finished sheet failed on an offset error in the render tool. The build's own sheet image above shows the frames.
