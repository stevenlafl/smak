The sound is built and the build says OK. It is written to `work:sound/player/pl_metal1.wav` (11025 Hz, 8-bit, mono, 0.58 s), and every check passed.

Against the picture of the original, the measured numbers are:

| Feature | Original (from picture) | Built |
| --- | --- | --- |
| Length | 0.58 s | 0.58 s |
| Centroid (brightness) | about 361 Hz | 343 Hz |
| T20 (time to fall 20 dB) | 0.32 to 0.53 s range | 0.334 s |
| Under 150 Hz power | about 35% | 42% |
| 150 to 600 Hz power | about 46% | 45% |
| Crest (peak over RMS) | about 16 dB | 16 dB |

Against the game's own `step metal` sounds, all 22 features are in range.

What the build is made of: a short high-passed click, a sine thump that drops from 110 to 55 Hz, a pink-noise rumble, a white-noise grit bed for flatness, and two struck-metal ring layers (300 Hz and 1000 Hz). The mix is saturated and limited to a 16 dB crest.

Things to know:

- **I could not read the original file itself.** The Packages folder asked for permission, and the work folder holds only the picture and a facts file. So the match is to the picture's numbers, not the waveform sample by sample.
- **The reference is the game's first `step metal` file, not the original.** The build named no specific reference, so the comparison is against the class as a whole.
- **I can't judge how it sounds.** Listen in the game: the volume and pitch as the code plays it, and how the map's room changes it, are outside what the build can measure.
- **The spec is not saved to a file.** The final spec is the last build call above; if you want it kept, I can write it into the project.
