The sound is built and the build says OK with no warnings: `work:sound/weapons/357_shot1.wav` (22050 Hz, 8-bit, mono).

Against the original's picture, measured by the build:

| Feature | Original (picture) | Made |
| --- | --- | --- |
| Length | 1.06 s | 1.083 s (2% off) |
| T20 (time to -20 dB) | in the 0.458 to 1.013 s range | 0.783 s |
| Centroid (brightness) | 921 Hz | 874 Hz (5% off) |
| Crest (peak over RMS) | about 10 dB | 9.6 dB |
| Bands, worst off | | 2.8 points (600 to 2k Hz) |

All 22 of the game's own gunshot features are in range, and the report raised no faults.

How it is made: a sharp crack at the start, a broadband blast with a spectrum shaped to the original's (a fast decay, most energy 150 Hz to 2 kHz), and a sine boom sweeping from 120 Hz down to 45 Hz. It has a short room tail and a limiter at a 10 dB crest, to keep the tail's dynamics close to the original's. The spec sets no seed-dependent recording, so it uses no generator and no non-commercial licence.

Caveats:
- The build only gives me the original's measured numbers; I could not hear either file. The "as close as I can" judgement rests on those measures, and a listen in the game (and against the original) is the real test.
- The 1.083 s length is slightly over 1.06 s. I left it because the room tail sets it; trimming it would be a small follow-up if you want it exact.
- I could not open the work folder's picture files directly, so I read the original's numbers from the build report rather than from the picture itself.
