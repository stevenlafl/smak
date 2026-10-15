The sprite is built and the build says OK: `sprites/steam1.spr` is in the work folder, with a contact sheet and an animated preview beside it.

The file is 32x48, 16 frames, type `parallel oriented`, format `index alpha` (the coverage alpha mask), placed as an `env_sprite`, and it plays once without looping. I used the `smoke puff` class and set the frame rate to 10 a second, since your description gave no rate and an `env_sprite` runs at most 10.

What the sheet shows against your description:
- **Frame 0:** a small bright white dot a few pixels across, low and a little left of centre.
- **Frames 1 to 3:** a dense white cloud that grows to about 12 px, then about 25 px. This is close to your 12 and 22.
- **Frames 4 to 7:** the cloud swells to nearly the full 32 px width, white in the middle, with grey shading on the edges and underside.
- **Frames 8 to 11:** it loosens and dims toward grey, with gaps between the puffs and a ragged trail below.
- **Frames 12 to 15:** it breaks into faint, see-through grey streaks and fades almost to nothing by frame 15.

Where it falls short of the description:
- **Frames 8 to 11:** the cloud stays broader than it is tall. Your description has a tall column with the top as the widest part, and I did not get that shape.
- **Frames 12 to 15:** the streaks are broader and blobbier than the thin vertical wisp you described.
- **Border light:** the report puts it at 0.017 against Half-Life's 0 to 0.005. A stronger edge fade (edge 3) cut the brightest pixel from 0.75 to 0.50 and greyed the whole cloud, so I kept edge 2.

I had no contact sheet of the original, so every comparison here is against your description, not the original's pixels. If you can supply a sheet, I can add it as the `reference` and tune the shape to it.
