The sound is built and the build says OK: `work:sound/weapons/357_shot1.wav`, 22050 Hz, 16-bit mono, 1.06 s, peak -0.5 dBFS. It is written in place of the game's own file of that name.

**Measured against your description of the original**

| Feature | Original | Built |
|---|---|---|
| Length | 1.06 s | 1.06 s |
| Energy under 150 Hz | about 30% | 33% |
| 150 to 600 Hz | about 30% | 23% |
| 600 to 2000 Hz | about 22% | 24% |
| 2000 to 5000 Hz | about 13% | 16% |
| Over 5000 Hz | about 5% | 6% |
| Onset | hard crack at 0 | one transient counted at the start |
| Dip at 20 to 30 ms | yes | yes, a 5 dB dip at 22 ms |
| Tail | quarter level by 0.6 s, near silent by 0.95 s | T20 0.81 s (time to fall 20 dB) |

**What it is made of**

- **Blast:** a generated take of a revolver shot from the local woosh-dflow model (seed 2), trimmed to start at its first hit, with the dip and a fade shaped to your envelope. It is driven hard to pin it near full scale.
- **Crack:** a 12 ms burst of high-passed white noise on the first sample, for the instant broadband onset.
- **Air:** shaped white noise that falls off faster in the top end over time, for the top end and the grainy texture.
- **Rumble:** brown noise low-passed at 350 Hz, for the low boom in the tail.
- **Finish:** saturation at 4, then a limiter set to a 7 dB crest.

**What does not match, and why**

- **Flatness 0.256, against the game's gunshot range of 0 to 0.2.** The class check wants more tone. Your description says the sound has no tonal component, so I kept it noisy. If you want it closer to the game's own gunshots, a faint tonal ring would bring this into range.
- **Attack reads 140 ms, not 0.** The waveform starts at full scale, but the tool's attack figure is measured from the level envelope, and the clipped body takes that long to settle. I did not force it lower, since that would mean changing the blast itself.
- **Licence:** the blast comes from woosh-dflow, whose weights are CC-BY-NC 4.0 (non-commercial). You said this test accepts the local generators' licences, so I have used it. Before this goes into a commercial mod, that needs a different source.

The sound has not been heard in the game, and its volume and room are set by the map. Listen to it there before judging the mix.
