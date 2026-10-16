The sound builds OK and is written to `work:sound/doors/doormove1.wav`. It has no warnings, but I have not listened to it, so please hear it in the game before you call it done.

**Result against the original (measured, from the build report)**

```
Measure           Original        Built           Gap
length            5.04 s          4.98 s          1% short
centroid          589 Hz          534 Hz          9% low (inside the 15% aim)
power <150 Hz     30%             28.7%           -1.3
power 150-600 Hz  38%             38.2%           +0.2
power 600-2k Hz   28%             30.1%           +2.1
power 2k-5k Hz    4%              2.9%            -1.1
power >5k Hz      0%              0%              0
T20 (to -20 dB)   0.35-0.58 s     0.374 s         in range
crest             about 12.7 dB   17.9 dB         5 dB high (see below)
```

**What I built from**

- **Body:** the `woosh-dflow` take seed 1 (a generated door-on-track take), starting at the onset. It had the closest band shares of the four takes.
- **Shaping:** a high-pass at 90 Hz, a 5 dB bass lift at 110 Hz, a 1.5 dB lift at 1.2 kHz, and a low-pass at 2.6 kHz. The envelope holds the body near -12 dB and peaks on the stop at about 4.5 s, then falls.
- **Stop rattle:** a train of grains at 300 to 1200 Hz, at 4.2 to 4.9 s, for the rattle at the end.
- **Format:** 11025 Hz, 16-bit mono. I left out the original's 8-bit depth, because the build warns that 8-bit adds hiss under the quiet tail and a copy is not held to the original's depth. It is the same rate as the original.

**What is left open**

- **Crest:** the picture's outline reads about 12.7 dB, and mine is 17.9 dB. I tried limiter settings of 13 and 15 dB, but either one moved the loudest point to the early body and broke the T20 match, so I kept 18 dB.
- **Centroid:** 9% low. Pushing it up further cost the bands, so I stopped at the balance that keeps all bands within 2.5 points.
- **Licence:** the body is from `woosh-dflow`, under CC-BY-NC 4.0 (non-commercial, weights; code MIT). You said you accept that for this test. It would need a different take before any commercial use.

**Other notes**

- The spec lives only in this session. The Write tool is disabled here, so I could not save it as a file in the project. The layer list is in the build call above.
- Two of my own mistakes along the way, both fixed: the picture path must be `pictures/sound.png`, not `sound.png`, and T20 is measured from the loudest point, not from the start. The final build reads the picture correctly.
- To use it, copy the file into a mod's `sound/doors/` folder so the game plays it in place of its own `doormove1.wav`.
