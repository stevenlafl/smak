`sprites/glow01.spr` is built, and the build says OK with every check passing. It's in the work folder with `-sheet.png` and `-animated.png` beside it.

It's a 64x64 sprite with 1 frame, type parallel and format additive, as specified. It's a soft white-grey glow: a small bright white core fading into a wide grey haze that reaches most of the frame and goes fully dark before the border.

How it compares to the original, as the build measured it:

```
measure                         original   mine    bar
mean colour (delta E)           -          7.9     15 or under is near
share of frame that's dark      0.47       0.42    within 0.05 is near
border brightness (brightest)   0          0       -
frames                          1          1       -
```

The build also checks it against Half-Life's own glow sprites, and it's within their range.

It has two layers:
- **Core:** pure white with a power falloff (core 0.1, power 1.6, gain 0.8).
- **Haze:** pale grey-blue with a smooth falloff (radius 1.1, core 0.4, gain 0.38).

The build also set it up for an `env_glow` entity, which places it with render mode 3 (Glow). I picked that because it's a glow; it doesn't change anything in the file.

The first few builds came out as a solid white disc because I gave colours on a 0 to 255 scale, and the spec wants 0 to 1. I also tried a narrower haze (radius 1.06). It left too much of the frame dark (0.52 against 0.47), so I went back to the 1.1 version above.
