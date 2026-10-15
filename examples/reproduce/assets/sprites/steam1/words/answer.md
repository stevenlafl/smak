The sprite builds OK: `work:sprites/steam1.spr`, with `-sheet.png` and `-animated.png` beside it. The build reports 32x48, 16 frames, index alpha, parallel oriented, env_sprite, render mode 4 (Solid), 10 fps. Its comparison against Half-Life's smoke puff class is 5 of 5 in range. I had no original file to compare against, only your description, so the match is to that description and not measured side by side.

What matches the description:
- **Frames 0 to 7:** a puff from a point just left of centre and just below middle, growing to about 26 to 30 px wide in frames 4 to 7, opaque at the centre with lumpy edges.
- **Frames 8 to 13:** the top fades, a column reaches toward the bottom of the frame, and the cloud breaks into a streaky veil with gaps.
- **Frames 14 and 15:** only a faint wisp remains, nearly invisible.
- **Opacity:** peaks around the middle of the play (frames 6 to 7) and falls to zero by frame 15. The build measures the peak at 0.4 of the play.
- **Play:** plays once and does not loop.

What is off:
- **Frame 0:** the bright 3 px dot is only a faint speck. A single-sphere billow layer gives it, and I could not make it brighter. A glow layer gave a visible dot but left a bright spot in the middle of later frames, so I dropped it.
- **Colour:** I could not set the three-stop colour ramp (0.96, 0.85, 0.72). The list form of `ramp` made the frames blank, so the build uses the default ramp. The result is a neutral grey-white, but it is not tuned to your three values.
- **Texture:** the build reads the sprite as smoother than the original's turbulent, mottled look, though its measured jitter is inside the expected range.
- **Frames 1 to 3:** the puff is about 10 to 16 px wide, a little narrower than the 12 and 20 px you gave.

I used the spec inline and did not save it as a file. Nothing has been checked in the game.
