The sound builds OK: `work:sound/player/pl_step1.wav`, 11025 Hz, 8-bit mono, 0.27 s, peak -0.6 dBFS. The build's check passed every item, and 21 of its 22 features fall within the range of the game's own concrete step sounds. The one miss is the 600 Hz to 2 kHz band at 19.9%, against a ceiling of 18.5%, a marginal miss.

I built it from layers, following your description:

- **Heel strike:** shaped noise with a thump around 150 to 400 Hz, presence up to about 5 kHz, and a fast decay. It starts at full level with no fade-in, and its spectrum darkens over the decay.
- **Scuff:** a short burst of high-band particles (1.8 to 5 kHz) and a 15 ms white-noise crack. These give the click and the rattle in the first few milliseconds.
- **Toe tap:** lowpassed pink noise at 0.08 s, about 12 dB below the heel, dying within about 20 ms.
- **Tail:** low pink noise from 0.1 s, fading to silent by 0.27 s.
- **Finish:** a gentle saturation for the 8-bit grit, and a limiter with a 16 dB crest factor, which is in the game's step range.

Measured: attack 0 ms, centroid 699 Hz, flatness 0.215, band power at 20.7% below 150 Hz, 48.9% at 150 to 600 Hz, 19.9% at 600 Hz to 2 kHz, and 9.9% at 2 to 5 kHz.

Caveats:

- I did not hear it, and I had no recording of the original. The check compares it with the game's step sounds, not with the original. Only you can judge the match by ear, in the game.
- The T20 (time to fall 20 dB) is 0.085 s, which is slower than your description implies. The envelope targets a fifth of peak by 0.04 s, and the tail adds some length.
- The spec was passed inline and not saved as a file. If you want it kept for re-running, say where and I'll write it there.
- The file goes into `<mod>/sound/player/` to replace the game's own `pl_step1.wav`. I haven't tested it in the game.
