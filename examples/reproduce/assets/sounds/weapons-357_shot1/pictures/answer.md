The sound is built and the build says OK, with no warnings.

**Result:** `work:sound/weapons/357_shot1.wav`, mono, 22050 Hz, 16-bit, 1.06 s. The work folder is the server's, so the file takes the game's place once it is copied into `<mod>/sound/weapons/`.

**How it is made (a layered spec, no recording):**
- **Crack:** a 30 ms burst of white noise, high-passed at 2 kHz, for the sharp onset.
- **Blast:** pink noise over the full 1.06 s. Its level holds near full for about 0.45 s, then falls to -42 dB at the end. Its spectrum shifts down over time and is shaped to match the original's centre of energy.
- **Boom:** a sine swept from 110 Hz to 45 Hz over 0.25 s, for the low thump.
- **Finish:** saturate 3, limiter at a crest of 9 dB, peak -0.5 dBFS. No room reverb, because it lengthened the file past 1.06 s.

**Measured against the original's picture (read off it):**

| Feature | Original (picture) | Made |
| --- | --- | --- |
| Length | 1.06 s | 1.06 s |
| Centroid | 921 Hz | 841 Hz (9% off) |
| Bands, under 150 Hz / 150 to 600 / 600 to 2k / 2k to 5k | about 21 / 26 / 46 / 6 % | 14 / 31 / 49 / 6 % |
| T20 (decay to -20 dB) | 0.46 to 1.01 s range | 0.79 s |
| Class "gunshot" | n/a | 22 of 22 features in range |

**What I did not do, and why:**
- **Generated takes:** I generated four `woosh-dflow` takes. Their peaks sat 15 to 30 dB below the original's, and none had its crack, so I used none. The non-commercial licence therefore does not apply to this file.
- **8-bit:** I kept the GoldSrc default of 16-bit, because 8-bit adds a hiss under the quiet tail. If you want the original's depth, it is a one-line change to `bits`.
- **Not heard:** I cannot listen to it. The side-by-side judgement, and the game's volume and room, need a listen in the game.
