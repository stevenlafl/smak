The sound builds OK and is at `work:sound/player/pl_metal1.wav`, in the game's own file name so it replaces the original when it sits in `sound/`. It is 11,025 Hz, 8-bit, mono, 0.58 s long, and plays once.

The last build reports 22 of 22 features in range against the game's step-metal sounds: every measure is inside the range of those sounds, and the attack is instant with one onset.

| Measure | This sound | Range of the game's metal steps |
| --- | --- | --- |
| Attack | 0 ms | — |
| T20 (time to fall 20 dB) | 0.48 s | 0.32 to 0.53 s |
| Centroid (brightness centre) | 389 Hz | 260 to 460 Hz |
| Flatness (0 pure tone, 1 noise) | 0.028 | 0.01 to 0.11 |
| Power under 150 Hz | 35% | 25 to 45% |
| Power 150 to 600 Hz | 51% | 34 to 54% |
| Power 600 Hz to 2 kHz | 12% | 10 to 30% |

How it is built:
- **Clicks (0 to 0.15 s):** a short white-noise heel hit, and a particle cloud of 140 per second between 600 Hz and 2.2 kHz, both at full level from the first sample.
- **Body:** pink noise under 180 Hz, which gives the low weight, plus a pink scrape band around 900 Hz that fades over the length.
- **Second impact (0.17 s):** a toe click and a short plate thud.
- **Ring:** five struck-metal modes from 150 Hz to 780 Hz, fixed frequencies with no pitch slide, fading to near silence by 0.58 s.
- **Hiss:** white noise from 600 Hz to 1.8 kHz, which gives the grain and the flatness.
- **Finish:** a light drive and a limiter at a 16 dB crest, the class's lower steps range, with the peak at -0.5 dBFS.

What I could not verify:
- **Against the original:** I did not have the original file, so the comparison is against the game's step-metal class statistics and your description, not a side-by-side spectrogram. The envelope points (a third of the level at 0.35 s, the fall near silence at 0.58 s) were set from your description and not measured separately.
- **In the game:** the report cannot say how it sounds to a person or how loud it plays. Please listen in the game.
- **Licence:** no generated takes were used, so there is no model licence to note.
