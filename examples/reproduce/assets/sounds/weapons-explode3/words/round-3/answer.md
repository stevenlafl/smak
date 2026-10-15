The sound is built and the build says OK: `work:sound/weapons/explode3.wav`, 22050 Hz, 8-bit mono, 1.3 s. To use it in the game, put it in your mod's `sound/weapons/` folder so it replaces the original.

The final build measured against the kit's explosion ranges, and all 22 features were in range:

| Feature | Built sound | Your description |
| --- | --- | --- |
| Start | 0 ms attack, full scale at the first sample | No fade-in, no click |
| Decay (T20: time to -20 dB) | 1.01 s | Full scale to about 1/3 by 0.8 s, quiet rumble by 1.1 s |
| Spectrum | 37% under 150 Hz, 39% at 150 to 600 Hz, 17% at 600 Hz to 2 kHz, 6% at 2 to 5 kHz, 2% above 5 kHz | Strongest under 300 Hz, mids strong early, highs weak |
| Centroid (brightness) | 616 Hz | Darker over time as the highs fade |
| Flatness (0 is pure tone, 1 is white noise) | 0.09 | Entirely noisy, no tone |

How it is built, from the spec:
- **Body:** noise with a spectrum that moves over time. It is boosted under 300 Hz and rolls off above 1 kHz, and the treble falls faster at 0.7 s and 1.3 s.
- **Level:** pinned near full scale until 0.4 s, then -6 dB at 0.8 s, -12 dB at 1.1 s and -26 dB at 1.3 s.
- **Crackle:** a train of 2.5 kHz-band particles, rate 500 per second, gives the bursty grain.
- **Finish:** saturation at 4 (the hard clipping) and a limiter with a crest of 8 dB.

Points to check:
- **No side-by-side reference:** the server was not given your game folders, so the comparison used the kit's built-in explosion ranges, not the original file. The judgement against the original is still yours to make by ear in the game.
- **Decay is a compromise:** your description reads as about 0.8 s for a third of full scale, which implies a T20 nearer 0.85 s. Matching that cost the spectrum its brightness, so I kept T20 at 1.0 s. If it sounds too long, the 0.8 s point in the envelope is the place to change.
- **Spec not saved:** the spec exists only in this conversation, not as a file in the work folder. If you want to rebuild or tweak it, say so and I'll save it into the project.
