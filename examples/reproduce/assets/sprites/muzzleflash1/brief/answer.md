The muzzle flash is built and the build says OK. It is at `work:sprites/muzzleflash1.spr`, beside its `-sheet.png` and `-animated.png`, and the spec is saved as `work:muzzleflash1.json` so it can be rebuilt.

**What it is**
- Name `sprites/muzzleflash1.spr`, class `muzzle flash`, use `tempent`, type `parallel`, format `additive`, 64 by 64, 2 frames, origin centre.
- Frame 0 is a six-point star, one point every 60°.
- Frame 1 is a six-point star turned 30°, so the two flashes are different shapes. Each frame is bright on its own.
- A small glow sits in the middle of both, coloured with the `muzzle` ramp (white, peach, tan).
- The edge is faded so no square shows at the border.

**How I got there**
- The first attempts had a bright square edge, and streaks that blurred into a soft ball with no points. Thin, sharp streaks (`taper` 2, no blur, no haze) gave the star.
- Frame 1 needed its own star. I used two star layers with an envelope each: one fades out over the play and the other rises to the last frame. The envelope's `start`/`attack`/`decay` form works for this. A `points` form I tried was ignored.

**What the build measured**
- It is OK with no faults. Against Half-Life's muzzle flash class, all three measures are in range: the colour, the border (0) and the start (first frame 0.94, last 1.0).

**What I could not do**
- I did not compare it with the game's own `muzzleflash1.spr`. No game folder was given to the kit, and the spec's `reference` needs the game's sprite as a picture or a folder. The measures above are against Half-Life's class in general, not that exact file.
- I did not check the game's own frame size, so 64 by 64 is my choice and not a match.
- Whether it is as good as the game's is for the modder to judge in the game. The star is clean and bright, but it is stylised and only the in-game view will show how it reads at the gun's scale.
