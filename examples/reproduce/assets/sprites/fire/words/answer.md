The sprite is built and the build says OK: `sprites/fire.spr` is in the work folder, with a `-sheet.png` and `-animated.png` beside it.

The spec I used, as built:

- **Size and frames:** 32x96, 15 frames in the file. The tool writes a loop of 14 and repeats the first frame at the end, so the wrap is seamless.
- **Type and format:** parallel oriented, additive. The build placed it as an `env_sprite` in additive render mode (5) at 10 frames a second. I used 10 rather than 12, because the tool warns that an `env_sprite` changes frame at most 10 times a second.
- **Shape:** one fire layer, origin at the bottom. Width 1.0 so the base fills the frame, taper 0.3 so it narrows upward, tongues 0.9 for the ragged licks. Height 1.5 with rise 1.1 brings the tongues up to roughly the top quarter of the frame.
- **Colour:** the built-in fire ramp, which runs from white-hot through orange to dark red and fades to black. There is no blue or smoke.
- **Motion:** turbulence 0.6 makes the tongues sway and split from frame to frame. The envelope peaks around the middle of the loop, which gives the height and brightness variation.

The build's measures: border light 0.003 (effectively black at the edge), dark share 0.71, wrap 0.8, jitter 1.66. All five class checks against Half-Life's fire loop are in range.

Limits:
- I had no reference sheet, so I could not measure against your original. The match rests on your description alone.
- The tips reach about the top quarter of the frame, not the 10 to 20 pixels below the top your description gives. I tried taller settings, but they lowered the wrap score (0.87 down to 0.78), and the wrap is what matters most for a seamless loop. I kept the middle setting.
- I did not add a separate glow for a brighter core, since your description did not ask for one. It can be added as a second layer if the core looks too dim against the original.
