`sprites/steam1.spr` is built and the build says OK, but it is only a partial match to your description. I had no reference sheet, so I judged it by eye against the description. I built it three times.

It is 32x48 with 16 frames, type parallel oriented, format index alpha, and it plays once without looping. I set it to render as a tempent (Solid) at 10 frames per second.

- **Frames 0–7:** a small white dot grows into a lumpy white cloud with grey shading, ending nearly as wide as the frame.
- **Frames 8–11:** it is the broadest part of the cloud at the top, with gaps opening between the puffs.
- **Frames 12–15:** it breaks into faint grey streaks and is dark by frame 15.

The sheet is in `-sheet.png` next to the sprite, and the build also wrote an animated version beside it.

- **Flicker:** the build still warns that frame-to-frame flicker is 1.6 (Half-Life's smoke puffs run 0.9 to 1.5). The other four measures against Half-Life's smoke puff are in range.
- **Position:** the cloud sits a little low and does not stretch into a tall, ragged column filling the height.
- **Trail and wisp:** it has no separate trail of grey vapour hanging below. The ending is scattered flecks rather than the thin vertical wisp you described.
- **Frame 0:** I did not check the dot's exact size or its position left of centre.

I stopped here because tuning the shape for a tall column pushed the ending out of range (it stopped fading to dark). The shape and flicker would need more passes, ideally against the actual reference sheet.
