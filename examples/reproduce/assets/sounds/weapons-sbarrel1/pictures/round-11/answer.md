The sound is built and the build says OK, with no faults. It's at `work:sound/weapons/sbarrel1.wav`, and it replaces the game's file of that name when placed in `<mod>/sound`.

I built it from layers only. I didn't call a generator, so no generator licence applies to this file.

**What the final build measures against the original's picture (1.04 s, 22050 Hz, 8-bit):**

| Feature | Ours | Original (from picture) | Notes |
| --- | --- | --- | --- |
| Length | 1.04 s | 1.04 s | Exact |
| Centroid (brightness) | 678 Hz | 615 Hz | 10% off, within the 15% aim |
| Band under 150 Hz | 35.7% | about 36% | |
| Band 150 to 600 Hz | 28.1% | within 3.8 points | |
| Band 600 Hz to 2 kHz | 28.5% | within 3.8 points | |
| T20 (decay to -20 dB) | 0.70 s | 0.46 to 1.01 s range | In range |
| Crest (peak over RMS) | 10.5 dB | about 11.2 dB | Within 3 dB |
| Attack | 0 ms | loud from the start | |

Against the game's gunshot sounds, all 22 features are in range.

**How it's built:** a noise blast whose spectrum falls over time, a 90 Hz sine that sweeps down to 40 Hz for the thump, and a short high-passed crack. There is a limiter at 10.5 dB crest and no saturation, because saturation lifted the tail and made it ring for a full second.

**Choice for you:** I kept 8-bit, because the original is 8-bit and its quantization is part of its character. The build warns that 8-bit adds a hiss under the quiet tail. If that hiss is a problem in the game, change `bits` to 16 and the rest of the sound stays the same.

**What I could not check:** how it sounds, and how the game plays it (volume, pitch, the map's room). I have no listening test, so you should hear it in the game next to the original. I also could not compare against the original file itself, only against its picture and the game's gunshot range.

The spec I used lives only in this chat. Say the word and I'll save it into the project next to the reference assets.
