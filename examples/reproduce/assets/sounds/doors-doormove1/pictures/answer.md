The sound is built and the build says OK with no warnings: `work:sound/doors/doormove1.wav`, 11025 Hz, 8-bit, mono, 5.04 s, the same length as the original. It is in the server's work folder, not in the reproduce assets folder, so the game will only use it once it is copied to `<mod>/sound/doors/doormove1.wav`.

I could not listen to it, so how it sounds is untested. The measures against the original's picture are these:

| Measure | Original (picture) | Built | Result |
| --- | --- | --- | --- |
| Length | 5.04 s | 5.04 s | match |
| Crest (peak over RMS) | about 12.7 dB | 12.7 dB | match |
| Centroid (brightness) | 589 Hz | 530 Hz | 10% off (copy allowed 15%) |
| Band power, under 150 Hz | 30.1% | 30.3% | match |
| Band power, 150 to 600 Hz | 37.8% | 41.5% | within 4 points |
| Band power, 600 Hz to 2 kHz | not read | 23.8% | within 4 points |
| T20 (time to fall 20 dB) | 0.35 to 0.58 s | 0.45 s | in range |

The picture shows the same events as the original: a rumble across the whole length, clicks at about 1.56 s and 2.8 s, and a ringing stop burst at about 4.06 s that rings out to the end. The first draft had clicks that were too spiky and a tail that rang too long, and I fixed both.

The spec is still in this conversation, not saved as a file. Its seed is 1, so rebuilding it gives the same bytes. Say if you want it saved in the project folder.
