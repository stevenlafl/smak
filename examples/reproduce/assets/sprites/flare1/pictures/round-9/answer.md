I built `sprites/flare1.spr` and the build says OK, with every check passed and no warnings left against the original. It's 64x64, one frame, parallel type, additive format.

It's a soft pinkish-white glow: a broad white-pink core inside a pink-violet haze, with faint thin rays. Measured against your reference picture:

```
measure                         original   mine
colour difference (delta E)     -          11.2  (15 or under counts as near)
share of frame that is dark     0.39       0.42
shape overlap                   -          0.85  (0.8 is the bar)
brightest                       0.91       0.91
pixels over 0.7 (hot core)      530        598
brightest pixel on the border   0          0.019
```

The core is about 13% larger than the original's, and a faint trace of light reaches the border. Neither was big enough to trigger a warning. I tried one more colour tweak, but it made the dark share fail its check without improving the colour, so I went back to this version.

The tool placed it as an env_glow with render mode 3 (Glow). Files are in the work folder:
- `sprites/flare1.spr`
- `sprites/flare1-sheet.png`
- `sprites/flare1-animated.png`
