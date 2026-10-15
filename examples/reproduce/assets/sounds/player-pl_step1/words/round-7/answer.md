I built `player/pl_step1.wav` as a `smak.sound/1` spec, and the build says OK with every check passed. It matches the original's event, length and format. It sits close to the game's concrete steps but not inside every range.

It plays once, as a mono 11025 Hz, 8-bit file of 0.27 s. A noise burst gives the heel strike, a few short grains give the scuff, a small second tap lands at 0.08 s, and a faint noise tail runs to the end. The burst starts at full level and darkens as it dies.

It is written to `sound/player/pl_step1.wav` in the work folder. It takes the place of the game's own file once you put it in `<mod>/sound`.

Against the game's step-concrete sounds, 18 of 22 measures are in range. The last build was:

| Measure | Mine | Game's range |
| --- | --- | --- |
| Centroid (brightness) | 661 Hz | 678 to 1024 Hz |
| Flatness (0 is a pure tone, 1 is white noise) | 0.18 | 0.2 to 0.35 |
| Power below 150 Hz | 13% | 15 to 37% |
| Power 600 Hz to 2 kHz | 25% | 0 to 18.5% |

Nudging one of these moved another out of range in my earlier builds. I stopped here rather than keep trading them off. I didn't compare the envelope against the original's waveform, only against those class ranges. The report also can't say how it sounds or how the game plays it (volume, pitch, the map's room), so it needs a listen in the game.

I did not use `generate`, so no non-commercial model licence is involved.
