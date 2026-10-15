The sprite is built and the build says OK: `work:sprites/steam1.spr`, with a contact sheet and an animated preview beside it. It is 32x48, 16 frames, not looping, `parallel oriented`, `index alpha`, placed as an `env_sprite` at 10 fps. The build reports no faults.

Its spec is a single billow layer (a lit cloud of 40 spheres) with a 5-pixel edge fade. It is not an exact match to the original, and the build's measures show where it differs:

- **Frame 0:** the starting dot is about 6 pixels across, not about 3.
- **Frames 1-3:** it grows to roughly 12 and 22 pixels, close to your description.
- **Frames 4-7:** the cloud reaches about 20 to 24 pixels wide, short of the nearly full 32-pixel width you describe.
- **Frames 8-11:** it becomes a tall, ragged column with a broad top, as described.
- **Frames 12-15:** it breaks into grey shreds and is almost gone by frame 14. The thin central wisp you describe is not really there.
- **Frame-to-frame jitter:** 1.62 against a Half-Life smoke puff range of 0.9 to 1.5, so it flickers a little more than the reference class.
- **Colour:** white with grey shading, and no colours outside that range.

I could not get closer than this in the settings I tried. Making the early cloud wider pushed the edge fade up and the cloud could not be made both wide and small at the start. Smoothing the lumps to cut the jitter moved the peak later. Frames 0-3 and 12-15 are where it most differs from your description.

I had only your written description, not the original picture, so I could not set a `reference` for a side-by-side measure. Adding the original's contact sheet would let the report measure these gaps directly, and I can tune against it.
