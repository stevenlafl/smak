The sound builds OK at `work:sound/debris/bustmetal1.wav`, named so the game loads it in place of the original.

**What it is:** a metal sheet breaking apart, from a generated recording (seed 3), with a +7 dB peak at 3.5 kHz and a short metal ring at 620 Hz added under it. The final file is 11025 Hz, 8-bit, mono, 0.836 s.

**Against the original's picture** (the build's reading of `pictures/sound.png`):

```
feature                 made        original (picture)   verdict
length                  0.836 s     0.87 s               4% short
centroid (brightness)   1914 Hz     1896 Hz              1% off
bands 600-2k            50.8%       about 54%            within 3.5 points
bands 2k-5k             41.3%       about 41%            within 3.5 points
crest (peak over RMS)   11.8 dB     about 12.4 dB        within 1 dB
T20 (time to -20 dB)    0.419 s     inside the 0.24-0.7 s range
```

**Gaps and choices to know about:**
- **Metal-hit class:** the build's class check passes on picture matching, but 17 of 22 game metal hits are in range. The misses are centroid (too bright), flatness (too noisy, ~0.49 against 0.16 to 0.28) and the 600 Hz to 2 kHz and 2 to 5 kHz bands. I followed the original's picture over the class, since the original is the target. If you'd rather the sound sit in the game's metal-hit range, that means less highs and more tone, and it moves away from the original.
- **8-bit:** the build warns of a hiss under the quiet tail. I kept 8-bit because the original is 8-bit. Dropping to 16-bit would remove the hiss but break the match on depth.
- **Licence:** the take comes from woosh-dflow, whose weights are CC-BY-NC 4.0 (non-commercial). You said that's acceptable for this test, so the file is fine for it, but it can't ship in a commercial mod.
- **Not measured directly:** the original WAV sits outside the folders the tool can read, so I could only compare against the kit's picture of it, not the raw file. The build can't tell how it sounds or how the game's volume and room affect it, so that needs a listen in the game.

The file is in the work folder; it goes in `<mod>/sound/debris/` to replace the game's own.
