I built `sprites/flare1.spr` and the build says OK on every check.

It's a 64x64 sprite with one frame and no animation, type parallel, format additive. It's set up as an `env_glow`, so the game draws it in render mode 3 (Glow). It has a white core inside a soft lavender-pink halo, with faint fine rays fanning out. The edges fade to black, so the frame's square doesn't show.

Measured against the original's picture:

```
measure                     original   mine    bar
mean colour (delta E)          -        10     15 or under is near
share of frame that is dark   0.39     0.40    within 0.05 is near
border brightness              0        0
frames                         1        1
```

Side by side, my bright core still has a slightly harder edge than the original's. In the original the white fades into the pink more gradually. I left it at that because both measures are well inside their bars.

The file is in the work folder at `sprites/flare1.spr`, with `flare1-sheet.png` and `flare1-animated.png` next to it.
