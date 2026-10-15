The sound is built and the build says OK: `work:sound/debris/bustmetal1.wav`, 11025 Hz, 8-bit mono, 0.87 s, peak -0.6 dBFS. It is drop-in for `debris/bustmetal1.wav` under a mod's `sound` folder.

**What I matched against:** the only original material in the input folder was `sound.png` (its waveform over its spectrogram) and `facts.txt` (rate, length, bit depth). The original `.wav` is not there, so every number below is read off the picture, not measured from the real file.

| Measure | Picture (original) | Our sound |
| --- | --- | --- |
| Length | 0.87 s | 0.87 s |
| Onset | immediate | 0 ms attack |
| T20 (time to -20 dB) | 0.24 to 0.7 s range | 0.37 s |
| Centroid (brightness) | 1896 Hz | 1940 Hz (2% off) |
| Band 150 to 600 Hz | matched | within 1 point |
| Band 600 Hz to 2 kHz | matched | within 2 points |
| Crest (peak over RMS) | about 12.4 dB | 12 dB |

**How it's built:** four layers, no recording. A sharp high-passed crack at the onset, a broadband crash whose spectrum falls over three keys (0, 0.25 and 0.6 s), a sparse rattle of 1.2 to 4.5 kHz particles, and a short metal ring near 1.1 kHz. The finish is saturation 2 and a limiter at 12 dB crest. I tried the four generated takes first. None matched the picture: seed 2 had the right onset, but its envelope was wrong, so I didn't use one.

**What the report still flags, and why I left it:**
- **Flatness 0.70 against a 0.16 to 0.28 range for the game's metal hits.** This is a class-level mismatch: the game's metal hits are tonal, and debris is not. The picture's spectrum is smooth noise with no tonal lines, so adding more ring would move the copy away from the original.
- **Length 0.87 s against a class range of 0.37 to 0.86 s.** The original is itself 0.87 s, so this stays.
- **2 to 5 kHz power at 39.7% and 600 Hz to 2 kHz at 48.1%, against the class ranges.** These also fit the picture, which is why I didn't push them.

**Not checked:** how it sounds to a person and how the game plays it (volume, pitch, the map's room). Please listen to it in the game and against the original WAV. If it is too loud or bright there, the first thing to change is the crash's top keys (3 and 5 kHz) and the finish's saturation.

The spec exists only in this session; I did not save it to a file. Say the word and I'll put it next to the reproduce example.
