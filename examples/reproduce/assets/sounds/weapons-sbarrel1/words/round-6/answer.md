The sound is built and the build says OK: `work:sound/weapons/sbarrel1.wav`, 22050 Hz, 8-bit, mono, 1.043 s, peak -0.6 dBFS. It is a layered synthesis, with no recording.

The build measures it at 22 of 22 features in the range of the game's gunshot sounds. Those are the class ranges, not a side-by-side comparison, because the game's own `weapons/sbarrel1.wav` was not in any game folder the server was given. So I could not check it against the original itself, and the numbers are only as close as the class ranges allow.

What the spec does:
- **Boom:** a sine tone sweeping from 170 Hz down to 70 Hz over 0.3 s, decaying over 0.6 s, at -10 dB.
- **Body:** white noise bandpassed 120 Hz to 1 kHz, driven hard for grit, held for 0.2 s and then decaying over 0.9 s. This carries the 50 to 500 Hz thick low-mid body.
- **Crack:** white noise with a spectrum that moves from broadband (up to about 9 to 11 kHz) at the start to dark by 0.3 s, decaying over 0.35 s. This gives the bite and the highs dying first.
- **Snap:** a 4 ms burst of white noise high-passed at 2 kHz, added after the saturation so the onset is sharp.
- **Pops:** a sparse train of short grains between 300 and 3000 Hz in the first 0.3 s.
- **Rumble:** brown noise lowpassed at 400 Hz, fading to silence by the end.
- **Finish:** saturation at 4 for the clipped roar, a limiter at a crest of 8 dB, and no room reverb.

Measured figures: T20 0.66 s, T40 0.89 s, centroid 942 Hz, flatness 0.17, power in the 150 to 600 Hz band 31%.

Things I could not verify:
- How it sounds. The numbers and the picture show how it measures, not whether it sounds like the original. Listen to it in the game.
- The original's exact envelope and spectrum over time. The description is the only reference I had, so the match is to that description.
- Length: it is 1.043 s against the target 1.04 s, which is within sample rounding.
