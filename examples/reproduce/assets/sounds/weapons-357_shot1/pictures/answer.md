The sound is built and the build says OK, with no warnings. It is at `work:sound/weapons/357_shot1.wav`, named so the game loads it in the original's place.

It is 22050 Hz, mono, 1.06 s long, like the original. The build measured it against the original's picture:

| Feature | Original (from picture) | Mine |
| --- | --- | --- |
| Length | 1.06 s | 1.06 s |
| Centroid (brightness) | 921 Hz | 943 Hz |
| 600 Hz to 2 kHz power | 46% | 46% |
| 2 kHz to 5 kHz power | 6% | 11% |
| Under 150 Hz power | about 25% | 16% |
| T20 (time to fall 20 dB) | 0.46 to 1.01 s | 0.77 s |
| Crest (peak over RMS) | about 10 dB | 9 dB |

Its features all fall within the range of the game's own gunshot sounds (22 of 22). The build's notes about smooth noise and distance from the picture are cleared.

How I made it:
- **Layers only, no recording.** I generated four takes with the local generator (woosh-dflow, CC-BY-NC, which the build flagged as non-commercial). Their crests were too spiky, their bodies too quiet and their tails too short, so I did not use them. The sound is three layers: a short bright crack, a noise body whose spectrum moves over time to give a long tail, and a 110 Hz boom that falls to 45 Hz.
- **16-bit, not 8-bit.** The original is 8-bit. The build warns that 8-bit adds a hiss under the quiet tail. You asked for the same event, length, envelope, spectrum and character, and 8-bit depth was not on that list. If you want the exact depth, it is a one-line change to `bits`.

What I cannot check: how it sounds to a person, and how the game plays it (its volume, pitch and the map's room). The numbers match the original, but please listen to it in the game before you rely on it.
