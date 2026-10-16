The sound is built and the build says OK: `work:sound/weapons/explode3.wav`, 1.3 s, 22050 Hz, 8-bit mono, one shot with no loop. It is a layers-only sound. I did not use a generated recording, so the grain is from particle layers, not a real explosion.

The build has one warning, that 8-bit adds a hiss under the quiet tail. I kept 8-bit because the original is 8-bit. Leaving `bits` out would give 16-bit with less hiss, if you prefer that.

The original is not in the game folders I could read, so the build compared against the class ranges for explosions, not against the original file itself. Against those ranges, all 22 features are in range.

| Measure | Target (original) | Built |
| --- | --- | --- |
| Length | 1.3 s | 1.3 s |
| Onset | instant, no attack | 0 ms attack |
| Loudness fall (T20: time to -20 dB) | about half amplitude by 0.8 s, nearly silent by 1.3 s | 1.00 s |
| Spectrum below 150 Hz | 35% | 40% |
| 150 to 600 Hz | 30% | 33% |
| 600 Hz to 2 kHz | 20% | 18% |
| 2 to 5 kHz | 10% | 7% |
| Above 5 kHz | 5% | 2% |
| Centroid (brightness centre) | class range 493 to 739 Hz | 661 Hz |
| Crest (peak over average level) | class range 2.7 to 8.7 dB | 8.5 dB |

How it is built, in the spec's terms:
- **Body:** brown noise shaped by a spectrum that moves over time. It starts full, darkens after 0.45 s, and its level falls from -1 dB at 0.45 s to -50 dB at 1.3 s.
- **Clipped wall:** a second copy driven hard for the first 0.45 s, so the start is saturated and then cuts into the body.
- **Crackle:** particles from 400 to 3000 Hz, fading out by about 0.7 s.
- **Blast transient:** a 12 ms highpassed noise crack at the start.
- **Finish:** saturation of 2 and a limiter.

I could not check how it sounds to a person, or how the game plays it (its volume and the map's room). Those need a listen in the game. The spec itself was passed inline and is not saved as a file in the work folder, so it will need writing down if this has to be reproduced.

If the side-by-side judgement finds it too thin or too clean, the next step is a generated explosion take as a sample layer, with the licence noted.
