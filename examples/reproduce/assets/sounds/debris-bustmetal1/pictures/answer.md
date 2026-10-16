The sound is built at `work:sound/debris/bustmetal1.wav`, and the build says OK. It is 11025 Hz, 8-bit, mono, 0.869 s, so it takes the game's name and plays in the original's place.

I could not listen to it, so how it sounds is untested. Put it in `<mod>/sound/debris/` and listen in the game.

**How it matches the picture** (read off the picture, not the original file):

| Measure | Original (from picture) | Built | Note |
| --- | --- | --- | --- |
| Length | 0.87 s | 0.869 s | 0% off |
| Attack | strikes at once | 0 ms | matches |
| T20 (time to -20 dB) | 0.24 to 0.7 s range | 0.514 s | in range |
| Centroid (brightness) | about 1896 Hz | 1853 Hz | 2% off |
| Band 600 to 2k Hz | about 47% | 52.8% | 5.5 points off |
| Band 2k to 5k Hz | about 41% | 42.4% | in tolerance |
| Crest (peak over RMS) | about 12.4 dB | 10.6 dB | within 3 dB |
| Flatness (tonal vs noisy) | metal-hit range 0.16 to 0.28 | 0.266 | in range |

**Choices I made:**
- **Base:** the `woosh-dflow` take seed 2, which starts on its hit. I started from the generated take because a layers-only sound would not have its grain.
- **Spectrum:** I cut 150 to 600 Hz and 1 to 1.8 kHz and lifted 3.2 kHz, to match the picture's brightness.
- **Crack and ring:** a short high-passed noise crack at 0 s and a faint bell-ratio ring give the strike and the tonal lines.
- **Room and finish:** a short room, saturation, and a limiter at 11 dB crest.
- **8-bit:** kept, to match the original. The build warns of hiss under the quiet tail; a 16-bit copy would be cleaner but is not what the original is.

**Warnings still open:** the build also measures the sound against the game's own metal-hit class, and it still reads the centroid as too bright and the 2 to 5 kHz band as high for that class. I followed the picture, because the target is this sound, not the class average. If it sounds too bright in the game, lower the 3.2 kHz lift (13 dB) first.

**Licence:** the take is from `woosh-dflow` (CC-BY-NC 4.0 weights, non-commercial). You accepted that for this test. It would need a different take before any commercial use.

The spec is inline in this session and was not saved to a file. Say if you want it written into the project so it can be rebuilt.
