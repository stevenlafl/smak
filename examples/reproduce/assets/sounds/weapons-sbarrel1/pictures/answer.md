The sound is built and the build says OK: `weapons/sbarrel1.wav` is in the work folder at `work:sound/weapons/sbarrel1.wav`, ready to go in a mod's `sound` folder in place of the game's file.

I used the spec path with no generated recording. The generator's shotgun takes were poor: none matched the blast's density, and their crest and length were far off. So the sound is layered from scratch, shaped to the original's picture.

| Feature | Original (from picture) | Made |
| --- | --- | --- |
| Length | 1.04 s | 1.04 s |
| Crest (peak over RMS) | about 11.2 dB | 10.5 dB |
| T20 (time to -20 dB) | 0.46 to 1.01 s | 0.79 s |
| Centroid (brightness) | 615 Hz | 538 Hz (13% off) |
| Power under 150 Hz | 36% | 38% |
| Power 150 to 600 Hz | 32% | 33% |
| Power 600 to 2k Hz | 26% | 25% |

The build's own checks: the class `gunshot` has 22 of 22 features in range, with no faults reported. The picture check puts every band within 2 points of the original's.

The construction: a noise blast that holds for about 0.3 s then decays, driven hard for its dense body, with a low sine boom sweeping from 110 Hz to 45 Hz, a short high crack, and a saturation of 5. The rate is 22050 Hz, 8-bit, mono.

What I could not check: how it sounds. I can't hear it, so the match rests on measurements from the picture, which is only a rough reading. Please listen to it in the game against the original, especially the attack and the tail. The spec is inline in this session and not saved to a file; I can write it to the project if you want it kept.

The scratch file `work:sound/test/diag.wav` from my experiments is still in the work folder and can be deleted.
