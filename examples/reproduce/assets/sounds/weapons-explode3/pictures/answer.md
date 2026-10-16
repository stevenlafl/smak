The sound is built and the build says OK with no warnings. It is at `/tmp/smak-repro-GjAvkN/work/sound/weapons/explode3.wav`, with the spec at `work/weapons_explode3.spec.json`. I have not listened to it. Everything below is from the build's measurements.

| Measure | Original | Mine | Result |
|---|---|---|---|
| Length | 1.3 s | 1.3 s | match |
| Centroid | about 605 Hz | 648 Hz | 7% off |
| Power below 150 Hz | 37% | 34.3% | within 3 points |
| 150 to 600 Hz | 36% | 35.5% | within 1 point |
| 600 Hz to 2 kHz | 21% | 24.8% | within 4 points |
| 2 to 5 kHz | 4% | 3.6% | match |
| Above 5 kHz | 2% | 1.8% | match |
| Fall of 20 dB (T20) | 0.871 s after the peak | 0.85 s | in range |
| Crest | about 8.1 dB | 8 dB | match |
| Loudest point | 0.255 s | 0.255 s | kept |

The build's class check (against the game's explosion sounds) reports 22 of 22 features in range.

**Choices I made:**
- **Built from layers only.** I did not use a generated take, so no model licence applies. The spec is a three-hit boom: a low-passed noise punch and a sine sub sweeping 62 to 38 Hz, a pink-noise body with a moving spectrum, three bandpassed cracks at 0, 0.12 and 0.25 s, and a short high-passed crack at the start.
- **16-bit, not the original's 8-bit.** The build warns that 8-bit adds hiss under the quiet tail. Say if you want 8-bit to match the original's depth.
- **Onsets read 2 where the original has 3.** The tool reads the original as 2 to 3, so I left it.

**What I could not check:** how it sounds. The build cannot judge that, and the volume the game plays it at depends on the map. Listen to it in the game before calling it done.

**What I learned about the tool:** the finish's crest limiter lifts quiet tails back up. A tail only fell in T20 once I drove its envelope to -55 to -60 dB. I tried to save that as a memory, but the write tool is disabled in this session, so it is not saved.
