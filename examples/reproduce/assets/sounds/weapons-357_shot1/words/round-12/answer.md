The sound is built and the check says OK: `work:sound/weapons/357_shot1.wav`, which the game loads in place of its own `weapons/357_shot1.wav` when it sits under `<mod>/sound`.

**What it is built from:** a take from woosh-dflow, a local sound model (seed 1, prompted as an outdoor .357 magnum shot with a clipped roar, crackle and a low boom fading into an echo). Its licence is CC-BY-NC 4.0 (Creative Commons, non-commercial), so it is fine for this test but not for a commercial release. That call is yours.

**Shaping:** I cut the take to 1.06 s at 22050 Hz, 8-bit mono. The envelope holds full level to 0.45 s, has a brief dip at 20 to 30 ms, falls to about -12 dB (a quarter scale) by 0.6 s, and is near silent by 0.95 s. A saturation stage gives the pinned, clipped roar. A limiter sets the crest at 8 dB. A small peak boost near 3.5 kHz adds some top end.

**Measured against your targets:**

| Feature | Target | Made |
| --- | --- | --- |
| Length | 1.06 s | 1.056 s |
| Sample rate, depth | 22050 Hz, 8-bit | 22050 Hz, 8-bit |
| Under 150 Hz | 30% | 27.8% |
| 150 to 600 Hz | 30% | 31.4% |
| 600 to 2000 Hz | 22% | 23.4% |
| 2000 to 5000 Hz | 13% | 14.9% |
| Over 5000 Hz | 5% | 2.5% |
| T20 (time to -20 dB) | about 0.6 to 0.7 s | 0.698 s |
| Peak, crest | clipped | -0.6 dBFS, 8 dB |

Every gunshot feature the report checks against the game's own sounds is in range (22 of 22).

**Known gaps:**
- **Attack:** the report reads 40 ms to peak, not an instant crack. The take's own first hit is soft, and my extra crack layer did not change that reading. Fixing it means a sharper source take, which I did not try.
- **Top end:** the over-5 kHz share is 2.5% against 5%, so it is a little dull at the very top.
- **8-bit hiss:** the build warns of hiss under the quiet tail. I kept 8-bit because your facts say the original is 8-bit and the copy should match it. If it sounds like static in the game, set `bits` to 16.
- **Not checked here:** how it sounds to a person and how the game mixes its volume and room. You will need to listen in the game.
