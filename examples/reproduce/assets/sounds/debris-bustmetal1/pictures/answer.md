`debris/bustmetal1.wav` is built and the build says OK, with no warnings against the original's picture. It's written to `sound/debris/bustmetal1.wav`, so the game plays it in the original's place.

I haven't listened to it, and the report can't say how the game will play it (volume, pitch, the map's room). That needs a listen in the game.

It is made from layers alone, since the generate tool wasn't used. The layers are a shaped noise burst with a stepped decay, a rattle of small particles for the debris tail, and a short plate-mode ring. The finish is a light saturation and a limiter set to crest 12 dB. The output is 11025 Hz, 8-bit, mono, played once.

Measured against the original's picture:

```
                original   mine
length            0.87 s    0.85 s   (2% off)
centroid        ~1896 Hz   2100 Hz   (11% off, within the 15% allowed)
crest           ~12.4 dB     12 dB
2k-5k band        40.7%     47.4%    (6.7 points off, within the 7 allowed)
T20           0.24-0.7 s   0.499 s   (inside the range)
```

Against the game's own metal hits, 16 of 22 features are in range. The six it misses are:
- **Centroid:** 2100 Hz is brighter than the 1074 to 1654 Hz range.
- **Flatness:** 0.643 is noisier than the 0.16 to 0.28 range.
- **600-2k band:** 46% is under the 63.7 to 83.8% range.
- **2k-5k band:** 47.4% is over the 3.7 to 24.6% range.

Those four are where the original itself sits outside the metal-hit class. It is a broadband debris burst, so I matched the original's picture rather than the class. I made the length 0.85 s rather than 0.87 s. The class range tops out at 0.86 s, and the picture's allowance is 10%.
