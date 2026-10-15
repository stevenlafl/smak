The sound is built and passes: `work:sound/debris/bustmetal1.wav`, which is the game's name for it, so it takes the original's place once it is put in `<mod>/sound`. I could not check it against the original. The game's folders were not given to the tool, so the reference was never found and the side-by-side is not there. Every figure below is measured from my file and set against the description you gave, not against the real `debris/bustmetal1.wav`.

| Measure | Made sound | Description or class range |
| --- | --- | --- |
| Length | 0.87 s, 11025 Hz, 8-bit mono | 0.87 s, 11 kHz, 8-bit mono |
| Onset | starts at full level, no fade | no fade-in |
| Fall to -20 dB (T20) | 0.74 s | about half at 0.3 s, quiet by 0.6 s; class range up to 0.70 s |
| Centroid (brightness) | 1827 Hz | strongest at 800 Hz to 4 kHz; class range 1074 to 1654 Hz |
| Flatness (0 pure tone, 1 noise) | 0.32 | a noise and tone mix; class range 0.16 to 0.28 |
| Power, 600 Hz to 2 kHz | 45% | class range 64 to 84% |
| Power, 2 to 5 kHz | 42% | class range 4 to 25% |

How it is built, in four layers:
- **Crash:** white noise shaped to a spectrum that peaks from 600 Hz to 2 kHz, with its envelope at full level for 0.15 s and half by 0.3 s.
- **Bite:** a short band of noise at 1 kHz on the first 0.1 s, for the dense crash.
- **Ring:** seven inharmonic partials from 450 Hz to 3.1 kHz, decays of 0.25 to 0.45 s, the highest ones the longest.
- **Flutter and thump:** a faint particle rattle in the tail, and a short 160 Hz tone sweeping to 90 Hz for the low weight at impact.

Where I went against the class numbers, and why:
- **Brightness and the 2 to 5 kHz share** are above the class ranges. Your description puts the strongest energy at 800 Hz to 4 kHz, so I followed the description. If the original turns out darker, the crash's upper shelf is the place to cut.
- **Flatness** sits at 0.32, a little above the class range. Pushing it lower made the crash's noise drop out, and the ring gain has little effect on it. I stopped there.
- **Tail** is 0.74 s to T20, about 0.04 s over the class ceiling. The partials' decays set it, and shortening them further thinned the ring.

Things to check:
- Two scratch files from my tests are in `work:sound/debris/`: `test_crash.wav` and `test_modes.wav`. The tools here cannot delete files, so please remove them. They are not part of the sound and would not be used unless copied into a mod's `sound` folder.
- The spec is inline in this session, not saved to a file. If you want it reproducible, I can save it as a JSON file in the work folder.
- Nothing has been heard. Judge it in the game with the original, for its loudness and how the ring sits in the mix.
