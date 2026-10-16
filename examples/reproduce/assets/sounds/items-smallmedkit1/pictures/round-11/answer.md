The sound is built and the build says OK: `work:sound/items/smallmedkit1.wav`, which takes the place of the game's `items/smallmedkit1.wav` when placed in `<mod>/sound`.

**Method:** I wrote the spec from the original's picture (`pictures/sound.png`) and ran the build against it, adjusting one thing at a time. The original has three pulsed bursts around a 620 Hz tone (0 to 0.26 s), a quiet tail with one tick at 0.40 s, and a rising air hiss (0.50 to 0.76 s). The spec rebuilds those with a sine pulse layer, a band-limited body, a crackle layer, a tick, a faint room bed and a shaped hiss.

**Measured against the original (read off its picture):**

| Measure | Original | Made |
| --- | --- | --- |
| Length | 0.76 s | 0.76 s |
| Centroid (brightness) | 1936 Hz | 2200 Hz (14% off) |
| Bands 150 to 600 Hz | 14.2% | 9.3% |
| Bands 600 to 2 kHz | 64.4% | 62.3% |
| Bands 2 to 5 kHz | about 4.5% | 8.5% |
| Bands over 5 kHz | 16.8% | 19.4% |
| T20 (time to fall 20 dB) | 0.41 to 0.68 s | 0.59 s |
| Crest (peak over RMS) | about 11.5 dB | 12.1 dB |
| Onsets | 1 | 1 |

Every measure is inside the tolerance the build uses for a copy, and the build's picture check raises no warning. I did not give it a class: the closest class, `click`, grades a medkit's ring as "too long", which doesn't apply here.

**Choices you may want to change:**
- **16-bit, not 8-bit.** The original is 8-bit, but the build warns that 8-bit adds hiss under the quiet tail, and a copy isn't held to the original's depth. To match the original's depth exactly, add `"bits": 8` to the spec.
- **No generated take.** I generated four takes with the local `woosh-dflow` model (its licence is non-commercial). None came near the original: their brightness and band balance were far off, and two had the hiss in the wrong place. So the file has no recorded layer and nothing non-commercial in it.
- **A stray probe file.** While tuning I wrote `work:sound/test/t20probe.wav`. My tools can't delete files, so please remove it by hand. It is not the game's file.

I can't judge how it sounds. Listen to it in the game, where its volume and the map's room will change how it lands.
