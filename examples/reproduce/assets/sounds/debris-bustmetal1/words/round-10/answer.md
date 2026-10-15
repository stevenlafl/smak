The sound is built and the build says OK: `work:sound/debris/bustmetal1.wav`, 11025 Hz, 8-bit mono, 0.87 s. It is written under the game's own name, so it takes the place of `debris/bustmetal1.wav` when placed in a mod's `sound` folder.

**What I made.** The spec layers a short high-passed crack at the start, a low thump under the first hit, a shaped noise body, a grain clatter, two struck-plate ring modes, and a generated take (woosh-dflow, seed 1) brought in from its first hit. The body and clatter fall over the 0.87 s to the envelope you gave (about -6 dB by 0.3 s, -12 dB by 0.45 s, silent at the end). The plate modes give the faint inharmonic bands.

**Measured against your brief** (the build's readings of the file):

```
Measure           Original (brief)   Made
Under 150 Hz      8%                 6.6%
150-600 Hz        22%                24.9%
600-2000 Hz       38%                37%
2000-5000 Hz      30%                31.4%
Over 5000 Hz      2%                 0.1%
Length            0.87 s             0.87 s
Attack            instant            5 ms
T20 / T40         -                  0.60 s / 0.78 s
Centroid          -                  1523 Hz
```

The bands are within about 3 points of your figures. The top band sits lower because the 11025 Hz rate cuts off near 5.5 kHz, and the file has almost nothing above 5 kHz.

**Where it departs from the game's metal-hit class, on purpose:**
- Flatness is 0.39, above the class range (0.16 to 0.28). Your brief says the sound is mainly noisy, so I kept the grain dominant rather than adding tone.
- Length 0.87 s is above the class range (0.37 to 0.86). That is the length you asked for.

**Things you should know:**
- **Licence:** the generated take is from woosh-dflow, CC-BY-NC 4.0 (weights; code MIT). That is non-commercial. You accepted it for this test; it would need replacing before any commercial release.
- **Warnings left in:** the build warns that the noise body sits over the take (possible static under the tail) and that 8-bit adds a hiss under the quiet tail. You asked for 8-bit, so I kept it. I did not remove the body noise, because it carries the clatter's spectrum.
- **Not checked:** I could not hear the file. No original was in the folders the server was given, so the comparison is against your figures and the class ranges, not a side-by-side with the real file. The volume and how it sits in the game's mix are untested. Listen to it in the game.
