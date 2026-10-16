The sound is built and the build says OK: `work:sound/weapons/357_shot1.wav`, which takes the place of the game's own file of that name when it's put in `<mod>/sound`. I haven't listened to it, and the measures can't say how it sounds in the game, so that's the test that counts.

**How it was made:** a generated take from the local `woosh-dflow` model (CC-BY-NC 4.0 weights, which you said to accept for this test, so this is non-commercial) as the crack and echo, plus a falling sine body and a grain layer for the texture. The best of four takes was the one used, and the finish is a saturation and limiter at a 9 dB crest.

| Measure | Original | Made | Notes |
| --- | --- | --- | --- |
| Length | 1.06 s | 1.059 s | matched |
| Centroid | 921 Hz | 920 Hz | matched |
| <150 Hz | 21% | 20% | within 1 point |
| 150-600 Hz | 26% | 27.4% | within 1.4 points |
| 600-2k Hz | 46% | 43.3% | within 2.7 points |
| 2k-5k Hz | 6% | 7.2% | within 1.2 points |
| >5k Hz | 2% | 2.1% | matched |
| Loudest point | 0.012 s | about 0.002 s | the take's onset is at 0.002 s |
| Falls 20 dB | 0.813 s | 0.953 s | still inside the class range, but 17% long |
| Flatness | 0.106 | 0.08 | noisier than the take alone, still a little tonal |

The report has no warnings, and the sound matches all 22 of the game's gunshot features.

**Choices I made that you can redirect:**
- **16-bit, not 8-bit.** The original is 8-bit, but the guide warns that 8-bit adds a hiss under quiet tails. Switching to 8-bit is a one-word change if you want that grit.
- **The picture is the original's own picture** (`pictures/sound.png`), so its measured numbers are the target.

**Not yet done:** the build's spec isn't saved as a file in the project, so the sound can't be rebuilt from the repo. If you want it reproducible, I can write the spec into the project and wire the take's generation into a script.
