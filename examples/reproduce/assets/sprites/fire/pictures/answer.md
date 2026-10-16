The sprite builds **OK**, with 4 warnings left. It is written to `work:sprites/fire.spr`, with `-sheet.png` and `-animated.png` beside it.

**What it is:** a flame on its base, 32x96, 15 frames, parallel oriented, additive, placed as an `env_sprite` (render mode 5, framerate 10). Its colours come from the original's own colour at each brightness, frame by frame.

**Spec choices:**
- `frames: 14` with `loop: true`: the tool writes the first frame again at the end, so the file holds 15 frames, matching the original's count.
- `fps: 10`: the original's facts file gives no speed, so this is my choice. It is also the most an `env_sprite` changes.
- `origin: bottom`: the flames rise from the bottom of each cell.
- The fire layer uses `ramp: "reference"`, width 1.2, taper 0.1, tongues 0.5.
- The glow layer uses `mask: "reference"`. This keeps it inside the original's lit outline, frame by frame. It is a built-in feature, but it means the shape is traced from the original, not generated. Tell me if you want that removed.

**Measured against the original:**

```
Measure            Original   Mine      Note
Mean colour (dE)   -          7.2       15 or under is near
Dark share         0.38       0.46      within 0.05 is near
Border light      0.275      0.187      a warning at 0.08 off
Shape overlap      -          0.65      the bar is 0.8
Brightest frame    0.07       0.07      of play, matches
Hot pixels >0.7    0          1         matches
Frames             15         15        matches
Loop wrap          -          1.15      report notes it, no FAULT
```

**Remaining warnings:**
- Coverage is slightly heavy (0.46 dark against 0.38).
- The border light is short of the original's.
- The shape overlap is 0.65 against the 0.8 bar.

I tried masking the fire layer too, to close the shape gap. It made coverage worse (0.51 dark) and the overlap stayed near 0.63, so I reverted it. Raising the fire gain pushed the middle too hot and the colour error up to 14.8, so that was reverted too.
