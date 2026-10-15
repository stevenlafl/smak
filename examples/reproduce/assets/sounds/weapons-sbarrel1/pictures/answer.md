The sound is built and the build says OK: `weapons/sbarrel1.wav` is in the work folder at `work:sound/weapons/sbarrel1.wav`, ready to go into `<mod>/sound/weapons/` in place of the original.

I did not use the generated takes. The final sound is entirely from layers, so the woosh-dflow licence (non-commercial, CC-BY-NC) does not apply to the output.

**Measured against the original's picture (the kit's numbers read off `pictures/sound.png`):**

| Measure | Original (picture) | Made sound | Off by |
| --- | --- | --- | --- |
| Length | 1.04 s | 1.042 s | 0% |
| Centroid (brightness) | 615 Hz | 610 Hz | 1% |
| Band 150–600 Hz | 31.9% | 30.7% | about 1 point |
| Band 600–2 kHz | 26.1% | 28.3% | about 2 points |
| Crest (peak over RMS) | about 11.2 dB | 11.2 dB | 0 |
| Onsets | 1 | 1 | none |
| T20 (time to −20 dB) | 0.458 to 1.013 s range | 0.529 s | in range |

Against the game's own gunshot sounds, all 22 features are in range. The build gave no warnings and no faults.

**The spec (`smak.sound/1`, class `gunshot`, seed 7):**
- **Body:** pink noise shaped by a spectrum curve, heavy at 150–600 Hz and falling above 1 kHz, with a 0.45 s decay.
- **Boom:** a sine tone sweeping 95 → 40 Hz over 0.25 s, for the low thump.
- **Crack:** 60 ms of white noise high-passed at 1.8 kHz, for the sharp onset.
- **Tail:** shaped noise starting at 0.15 s and decaying over 0.85 s, which fills the 1.04 s length.
- **Finish:** saturate 1.5, room 0.2 s at 10% wet, limiter at a crest of 12 dB, peak −0.5 dBFS.

**Choices I made:**
- The layers are synthetic, so the grain and room of a real recording are missing. The original is closest on the spectrum and envelope numbers above, and I can't confirm how it sounds.
- I kept the tail starting at 0.15 s: starting it at 0.1 s gave the original's two-onset count, the build flagged it, and I moved it.

I could not listen to the result. The build measures the sound; it cannot say how it plays in the game. Please play the two side by side in the game before you judge it.
