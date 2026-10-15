The sound is built and the build says OK: `work:sound/weapons/357_shot1.wav`, 22050 Hz, 8-bit mono, 1.06 s, peak -0.6 dBFS. Against the game's gunshot sounds it passes 22 of 22 features. I could not listen to it, so the judgement of how it sounds is still yours.

The spec is in the work folder's sound spec, and the layers are:

- **Click:** 3 ms of high-passed white noise at 2 kHz, placed after the limiter so it keeps its sharpness.
- **Gap:** about 14 ms of near silence.
- **Blast:** broadband noise, driven hard so the first 0.43 s is a dense, clipped wall. It then decays from -12 dB at 0.7 s to -48 dB at 1.0 s. Its spectrum has the most energy at the low end and falls off in the highs, and the shape darkens over time.
- **Boom:** a sine at 80 Hz sweeping down to 40 Hz, for the low punch.
- **Finish:** a limiter with a crest of 7 dB. I left out the room reverb, because it pushed the file past 1.06 s.

The final numbers are: T20 0.71 s (time to fall 20 dB), centroid 1022 Hz, flatness 0.19, onset count 1, and band power at 39% for 150 to 600 Hz and 20% below 150 Hz.

Two points where it differs from the description:

- **Attack:** the measured attack time (to -20 dB) is 65 ms. The click and gap are there, but the blast takes a while to reach -20 dB on the report's measure. I did not chase this further.
- **Tail:** the tail is a single decay, with no separate echo or room rumble. The room reverb is the part I dropped to hit the length.
