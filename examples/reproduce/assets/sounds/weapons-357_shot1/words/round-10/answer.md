The sound is built and the build says OK: `work:sound/weapons/357_shot1.wav`. It is written as the game's own file name, so it takes the place of the original when placed in the mod's `sound` folder.

I didn't use the generated takes in the final sound. The four takes were too dark and not clipped, so the sound is built from layers alone. That means no non-commercial model output is in the file.

The spec is one shaped noise blast with a 25 ms dip at the onset, a 2 ms high-passed crack at the start, and clipping on the blast layer (drive 4). The clipping is only on the blast, so the tail keeps its own decay. I first ran a crest limiter on the finish, but it lifted the tail and flattened the decay, so I removed it.

| Measure | Target from the description | Made file |
|---|---|---|
| Length | 1.06 s | 1.057 s |
| Format | 22050 Hz, 8-bit, mono | 22050 Hz, 8-bit, mono |
| Under 150 Hz | about 30% | 30.3% |
| 150 to 600 Hz | about 30% | 29.2% |
| 600 to 2000 Hz | about 22% | 22.9% |
| 2000 to 5000 Hz | about 13% | 12.5% |
| Over 5000 Hz | about 5% | 5.0% |
| T20 (time to fall 20 dB) | about 0.7 s | 0.71 s |
| T40 (time to fall 40 dB) | about 0.95 s | 0.94 s |
| Peak | full scale | -0.6 dBFS |

Against the game's gunshot class, 21 of 22 features are in range. The one that is off is flatness (how noise-like a sound is): 0.225 against the class's 0 to 0.2. I left it that way on purpose, because your description says the sound has no tonal component, and adding tone to match the class would break that.

Things to check:
- **8-bit hiss:** the build warns that 8-bit adds a faint hiss under the quiet tail. I kept 8-bit because you gave it as a fact of the original. If you'd rather have a cleaner tail, 16-bit would sound cleaner, but it would no longer match the original's depth.
- **I did not have the original file.** The numbers above are checked against your description, not against a side-by-side with the recording. Listen in the game before you judge it, because the build can't tell how it sounds to a person or what the map's room adds.
