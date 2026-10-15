The sprite is built and the build says OK, but it does not clear every warning the judge gives. The shape and the border light are still well short of the original, so this is the closest the rules rendered in the time I spent, not a finished match.

The file is `sprites/fire.spr` in the work folder (`work:sprites/fire.spr`, with a contact sheet and an animated preview beside it). The spec used: a `fire loop` class, parallel oriented, additive, 32 by 96, origin at the bottom, one `fire` layer with width 1.1, height 2.4, taper 0.1, tongues 0.6, gain 0.7, and the original's contact sheet as the reference.

Measured against the original (the judge's figures from the last build):

| Measure | Original | Mine | Status |
|---|---|---|---|
| Size, frames, type, format | 32x96, 15, parallel oriented, additive | 32x96, 15, parallel oriented, additive | matches |
| Mean colour (delta E, 15 or under is near) | reference | 6.3 | near |
| Share that is dark | 0.38 | 0.35 | near |
| Brightest light and pixels over 0.7 | 0.69, 0 | 0.67, 0 | matches |
| Loop wrap | n/a | 0.74, in Half-Life's range | ok |
| Border light (brightest at the frame edge) | 0.275 | 0.119 | warning |
| Shape overlap, frame by frame (bar 0.8) | 1.0 | 0.59 | warning |
| Brightest frame's place in its play | 0.07 | 0.71 | warning |

The two warnings I could not clear:
- **Shape.** The original's bright body sits higher, and its flame runs the full width at the base. I tried six variants of width, height, taper, tongues and gain. The best overlap was 0.62. Masking the fire layer by the reference (`mask: "reference"`) barely moved the overlap and made the flame too dark, so I dropped it.
- **Brightest frame.** The original peaks at frame 1. Setting an envelope to move the peak made the first and last frames dark and broke the loop, so I left the envelope out.

Choices I made that you can redirect:
- **Frame rate 10 fps.** The original's rate is not in its facts file, so this is a guess. 10 is also the cap for an `env_sprite`.
- **14 frames with loop on.** The builder writes the first frame again at the end, so 14 gives the original's 15 frames written.
- **Origin bottom**, so the flame stands on its base.
