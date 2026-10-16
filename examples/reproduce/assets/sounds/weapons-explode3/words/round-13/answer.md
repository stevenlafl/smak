The sound is built: `work:sound/weapons/explode3.wav`. The build says OK with no warnings, and every feature is in the explosion class range.

**What it measures against your original figures:**

| Feature | Original (your figures) | Made |
| --- | --- | --- |
| Length | 1.3 s | 1.3 s |
| Rate | 22050 Hz | 22050 Hz |
| Attack | instant | 0 ms |
| Power under 150 Hz | 37% | 36.8% |
| Power 150 to 600 Hz | 36% | 36.6% |
| Power 600 to 2k Hz | 21% | 21.3% |
| Power 2k to 5k Hz | 4% | 4.2% |
| Power over 5k Hz | 2% | 1.1% |
| Centroid | about 605 Hz | 549 Hz |
| Crest (peak over RMS) | 6 to 10 dB for weapons | 8 dB |
| T20 (time to fall 20 dB) | not given | 0.80 s |

The centroid is about 55 Hz low, and the top band is about 1 point low. Both are inside the explosion class range, and I left them there rather than chase the last few points.

**How it is made:**
- **Source:** one take from the local generator `woosh-dflow` (seed 0), prompted for a close grenade-style blast. Its licence is CC-BY-NC 4.0 (non-commercial). You accepted that for this test, so I have not used it anywhere else. Its sidecar is `work:gen/explode3_s0.json`.
- **Main layer:** the take, cut from its onset, driven hard so the first 0.4 s sits pinned at the ceiling. Its envelope falls to about -3 dB at 0.4 s, -30 dB at 0.9 s and -60 dB at 1.3 s. Its filters shape the spectrum toward your figures and sweep a low-pass from 2.5 kHz down to 260 Hz over 0.9 s, so the highs go first.
- **Crack:** 1 to 4 ms of high-passed white noise added after the limiter, which gives the instant onset.
- **Debris:** a short train of particles in 800 Hz to 4 kHz, fading by 0.9 s.
- **Finish:** saturation 4, with a limiter at crest 8 dB.

**Choices to check:**
- **16-bit, not 8-bit.** Your original is 8-bit. I used 16-bit because the guide notes that 8-bit adds a hiss under the quiet tail. If you want the exact original depth, change `bits` to 8 in the spec.
- **Not compared to the original file.** I had no copy of the game's `explode3.wav` to draw beside this one, so every number above is against your description, not the real sound. I could not listen to it either. The judgement on character still needs your ears: the roar, the grit, the rumble.

To use it, place `work:sound/weapons/explode3.wav` at `<mod>/sound/weapons/explode3.wav`. The game then plays it in place of the original.
