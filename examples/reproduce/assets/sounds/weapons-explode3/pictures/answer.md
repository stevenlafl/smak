The sound builds clean: `work:sound/weapons/explode3.wav` is written, and the last build reports OK with no warnings. All 22 of its features are in the range of the game's own explosion sounds.

**What I matched against:** the only copy of the original I had was its picture and facts (`sound.png`, `facts.txt`). The WAV is not in the input folder, so the comparison is against those numbers, not a listen.

| Feature | Original (picture) | Made |
| --- | --- | --- |
| Length | 1.3 s | 1.30 s |
| Rate | 22050 Hz | 22050 Hz, mono |
| Centroid | 605 Hz | 617 Hz |
| T20 (time to -20 dB) | about 0.67 to 1.11 s | 0.92 s |
| Crest | about 8.1 dB | 8.4 dB |
| Band 150 to 600 Hz | about 36% | 33% |
| Band 600 to 2000 Hz | about 21% | 20% |

**How it is made:** a generated explosion take (woosh-dflow, seed 3), cut from its onset, high-passed at 200 Hz, low-passed at 2 kHz, with a notch at 300 Hz and a lift at 900 Hz. It sits under a 70 Hz sine body and a grain layer of 500 to 2000 Hz, then goes through saturation at 6 and the explosion class's limit.

**Licence:** the take is from woosh-dflow, whose weights are CC-BY-NC 4.0 (non-commercial). You said that was accepted for this test. It is not cleared for a commercial release.

**Choices I made that you can redirect:**
- **16-bit, not 8-bit.** The original is 8-bit, but the kit warns that 8-bit adds a hiss under the quiet tail, which is not in the original's character. I kept 16-bit.
- **No room.** A room tail pushed the length past 1.3 s, so I dropped it.

**Not checked:** how it sounds in the game, its volume there, and how it compares by ear. Listen to it in the game against the original before you accept it.
