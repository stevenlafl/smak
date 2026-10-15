`sprites/laserbeam.spr` is built and the build says OK with no warnings. It's in the work folder, with `-sheet.png` and `-animated.png` beside it.

It's a white laser beam running the length of a 32x64 frame. It has a solid white middle, softer grey edges with streaks running along the beam, and it's lit all the way to both ends so it tiles along its length. It has 1 frame, type parallel and format additive, and the build places it as a beam with render mode 5 (Additive).

The spec: one `beam` layer, white, with a flat profile (core 0.5, shoulder 0.35) and streaks at 0.3.

How the build measured it against the original:

```
measure                          original   mine
mean colour difference (delta E)    -        1.0   (15 or under counts as near)
share that is dark                 0.02     0.03
border, brightest                  0.914    0.914
border, mean                       0.251    0.272
brightest pixel                    0.91     0.91
pixels over 0.7                    1064     948
shape overlap (edge/body/core)      -       0.96 / 0.93 / 0.88, mean 0.92 (0.8+ gets full marks)
frames                             1        1
```

I tried four settings. A wider core matched the original's count of bright pixels better (1074 against 1064), but the colour and shape scores got worse, so I kept the setting above. Its bright middle is a little smaller than the original's, and its edges are slightly brighter on average.
