The sound is built as `player/pl_step1.wav` and the build says OK, with all 22 class features in the game's range. It is at `work:sound/player/pl_step1.wav`, so it goes in `<mod>/sound/player/` to replace the game's own file.

Facts from the final build: 11025 Hz, 8-bit mono, 0.27 s, peak -0.6 dBFS, RMS -19.6 dB, crest 19 dB, T20 0.09 s, T40 0.24 s, centroid 694 Hz, flatness 0.24. Power by band: under 150 Hz 30%, 150–600 Hz 47%, 600–2k 10%, 2k–5k 12%, over 5k 1%.

How it is built, all as layers in one spec:
- **Heel strike at 0 s:** shaped noise with a 150–400 Hz thump and presence up to 5 kHz, decaying in about 20 ms. A sine thump sweeps 200 to 100 Hz under it.
- **Scuff:** a burst of 120 short grains between 1.2 and 6 kHz, for the rattle on the click.
- **Toe tap at 0.08 s:** a smaller, darker noise hit at -12 dB with a -20 dB thump under it.
- **Tail from 0.1 s:** pink noise fading from about -30 dB to -42 dB by 0.27 s.
- **Finish:** a mild saturation of 1.5, a limiter at a 19 dB crest, and a peak of -0.5 dBFS. The 8-bit depth supplies the grit.

Limits of the check:
- The report compares the sound with the game's step-concrete class, not with the original file. No reference file was drawn, so I could not compare it side by side with the original.
- The check cannot judge how it sounds to a listener, or its volume and pitch in the game. Someone should listen to it in the game.
- Its T20 of 0.09 s is inside the class range, but the original's heel burst reportedly falls to a fifth by 0.04 s, which is faster. I did not tighten the decay further because the class check was passing.
- No generated take was used, so there is no third-party licence to note.
