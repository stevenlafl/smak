The sound is built and the build says OK. It is at `work:sound/doors/doormove1.wav`, and goes into the mod at `<mod>/sound/doors/doormove1.wav`, where it replaces the game's file with no code.

**What it is**
- A 2.4 s mono WAV at 22050 Hz, 16-bit, peak -0.5 dBFS.
- It is one generated take, not layers. The motor whine rises in pitch with stacked harmonics, and a heavy thud comes at about 1.75 s. A rumbling tail runs for about 0.6 s after the thud.
- The take came from the local model `stable-audio-3-sfx`, prompted with: "an electric motor whine rising in pitch like an alarm, then a heavy metal door thud as it stops, close-miked, dry". I picked this wording over an earlier one ("a sliding door driven by an electric motor, ...") because its takes showed a clearer rising whine and a clearer thud. I chose seed 2 of four takes.
- The spec adds only a limiter (crest 14 dB), so the thud stays punchy.

**Measured by the build**

| Measure | Value |
| --- | --- |
| Attack | 1437 ms (the whine builds slowly, so the first sound is quiet) |
| T20 (time to fall 20 dB) | 0.51 s |
| Centroid | 366 Hz (dark) |
| Power below 150 Hz | 49.6% |
| Power 150 to 600 Hz | 38.3% |
| Onsets counted | 3 |

**Things to know before listening**
- The build did not compare it to the game's own `doors/doormove1.wav`. The spec had no class for doors, and no game folder was given, so it has no reference. The comparison is by ear.
- The thud is about 0.6 s before the end. If it sounds like it trails off too long, the length can be cut to around 2.0 s.
- The take is non-commercial-limited only in the sense that the Stability AI Community Licence applies: commercial use is free for an organisation under US$1M annual revenue, and an enterprise licence is needed above that. You accepted the local generators' licences for this test, so that is noted here for any later release.
- The report cannot say how it sounds in the game, or what volume and room the map gives it. Those are for the modder to judge by listening.
