The sound is built and the build says OK: `work:sound/items/smallmedkit1.wav`, 0.76 s, 22050 Hz, 8-bit mono, one shot, no loop. Copy it into `<mod>/sound/items/` so the game plays it in place of the original. I have not heard it, and I don't have the original to compare against, so the match is against your description and the measurements.

**How it's built** (the spec's layers, all in the build's work folder):

- **0 to 0.33 s, beeps:** four 600 Hz square-wave beeps, low-passed at 2.5 kHz. The first is a 0.05 s blip; the other three are 0.065 s each, with gaps. Each starts and stops hard.
- **0.33 to 0.58 s, fumbling:** pink noise band-limited to 150 to 2000 Hz, about 16 dB under the beep level. Three short dry clicks sit at 0.38, 0.42 and 0.48 s.
- **0.58 to 0.76 s, spray:** a generated take of a pressurized spray (woosh-dflow, seed 0), from its onset, high-passed at 2 kHz and low-passed at 6.5 kHz. A low pink-noise body (120 to 700 Hz) sits under it. It is the loudest part and ends with a hard cut.

**Measured against your numbers** (energy share over the whole sound):

| Band | Target | Built |
| --- | --- | --- |
| Under 150 Hz | about 5% | 2.7% |
| 150 to 600 Hz | about 25% | 19% |
| 600 to 2000 Hz | about 30% | 28% |
| 2000 to 5000 Hz | about 15% | 24.5% |
| Over 5000 Hz | about 25% | 26% |

The 2 to 5 kHz band runs high and the low end runs light. I stopped there; another pass would close those, and I can make it if you want.

**Things you should know:**

- **Licence:** the spray take comes from woosh-dflow, which is CC-BY-NC 4.0 (non-commercial). You said you accept the local generators' licences for this test. If the mod is ever sold or monetised, this file needs replacing.
- **8-bit:** I kept 8-bit to match your facts. The build warns that 8-bit adds a faint hiss under quiet tails. This sound has no long quiet tail, so it should be fine.
- **Build warnings I did not clear:** the build flags the sound as swelling to its peak (about 0.63 s), because the spray is the loudest part. That matches your description, so I left it. It also notes the noise layers over the take; I shaped them rather than removing them, since the fumbling and clicks need that texture.
- **Stray file:** I made a test build, `work:sound/items/test_spray_only.wav`, while checking the take. I have no delete tool, so please remove that file by hand. It is not part of the mod.
- **Not checked:** how it sounds to a person, its volume in the game, and the mix against other sounds. Listen to it in the game and say which parts are off, and I'll adjust the layers.
