The sprite builds OK: `sprites/zerogxplode.spr` is written to the work folder, with a sheet and an animated preview beside it. I had only your description, not the original, so I matched the description and could not measure it against the original.

**Settings (as specified):** 64x64, 15 frames, played once (not looping), 15 fps, type parallel (faces the camera), format additive (black is clear), tempent use, centred origin.

**How it is made:**
- An explosion layer (fire ramp) gives the white-hot point in frame 0 and the early burst, fading out by about frame 5.
- A billow layer (blast ramp, a white middle cooling to cream, tan and brown) gives the lumpy cloud. It is nudged up slightly so the top lobe reads as the mushroom head, carries debris specks, and dissolves into wisps as it ages.

**What the frames show against your description:**
- Frame 0 is a small white point, and frames 1 to 3 burst into a blob of about 45 pixels.
- Frames 4 to 7 fill most of the frame, with a white core and an orange rim.
- Frames 8 to 11 are the billowing cloud, bright at the top and browning at the bottom.
- Frames 12 and 13 dim to dark brown, and the sprite ends dark.

**Where it differs from your description:**
- Frame 0 is centred, not a little left of centre. The explosion layer has no position setting, so I could not move it.
- The white core stays too bright through frame 9. I tried a custom amber ramp and a faster cool-down, but both made the core harder-edged and more flickery, so I went back.
- Frame 14 is fully black. Your description has a faint brown smudge left near the top. Lengthening the decay removed frames 12 and 13 too early, so I kept the cleaner fade.
- The build reports the border is a little lit (0.018, where Half-Life's own is 0 to 0.005). It also reports the sprite's last frame as dark (0), which is the one-shot rule.

Two more reasons for the frame-14 smudge and the lit border to matter: the judge compares measured values, so they are the first things to check against the original. If you can share a contact sheet of the original, I can add it as a `reference` and tune the layers against it.
