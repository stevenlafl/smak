I built `player/pl_metal1.wav` and the build says OK with every engine check passing. I couldn't compare it with the real original, though: the server has no game folders set, so it had no `pl_metal1.wav` to draw beside mine. All 22 of its measurements fall inside the range of the game's own metal footsteps.

**What it is:** 11,025 Hz, 8-bit, mono, 0.59 s, and it plays once. It starts at full loudness with a short burst of broadband noise, sharp clicks and a 1 kHz clank, all in the first 0.15 s. A second, smaller hit at 0.17 s has its own short ring. Under both is a metallic ring of fixed, inharmonic tones from about 100 Hz to 1.7 kHz, with the higher tones dying first. It fades to a soft tail.

```
measure            this file      game's step-metal range
RMS (loudness)     -14.9 dBFS     -18.5 to -12.5
crest              14.4 dB        11.6 to 19.4
T20 (to -20 dB)    0.329 s        0.32 to 0.53
T40 (to -40 dB)    0.569 s
centroid           335 Hz         260 to 460
flatness           0.029          0.01 to 0.11
power <150 Hz      33.9 %         24.8 to 44.8
power 150-600 Hz   51.7 %         33.8 to 53.8
power 600-2k Hz    13.3 %         9.6 to 29.6
power 2k-5k Hz     1.2 %
```

Two places it may differ from your description:
- **Start:** the tool measures a 10 ms attack, though the drawn waveform starts at full level.
- **Second hit:** the onset counter found only one onset. The hit at 0.17 s shows in the spectrogram but is weaker than the first.

The checks can't tell how it sounds or how the game plays it, so it needs a listen in the game. It's written to `work:sound/player/pl_metal1.wav`; copy it to `<mod>/sound/player/` to replace the original.

**Problems with the SMAK kit**, worth reporting upstream:
- In a `modes` layer, the per-mode `gain` and `gains` values are **linear amplitudes, not dB**, and the guide doesn't say so. A gain of 0 makes that mode silent, and negative values like `-2` play louder instead of quieter.
- An all-silent file (peak -Infinity dBFS) still gets "OK: built, and every check passed". The silence shows up only as warnings.
- Once a `class` is set, the file sometimes came out shorter than its `length` (0.48 s for 0.58), apparently trimmed.
