The sound is built and the build says OK: `work:sound/weapons/357_shot1.wav` (22050 Hz, 8-bit mono, 1.06 s). It is not yet in the game folders; put it in `<mod>/sound/weapons/` to replace the original.

**How it was made**

- **Source take:** a generated shot from the local `woosh-dflow` model (seed 2), the only take with a sharp onset and a crack. Its licence is CC-BY-NC 4.0, non-commercial. You said that's accepted for this test; it's flagged in the file's facts, so it's there if the mod ever goes commercial.
- **Shaping:** the take is cut to 1.06 s and filtered: a high-pass at 60 Hz, a cut at 350 Hz (−6 dB), a dip at 1.2 kHz (−3 dB) and a low-pass at 4 kHz. Its envelope holds to 0.4 s, is −6 dB at 0.6 s, and is −40 dB by 0.95 s.
- **Extras:** a short white-noise crack at the onset, and crackly grit (2 to 5 kHz pulses) inside the body.
- **Finish:** saturation of 6 and a limiter at a crest of 9 dB to get the clipped body.

**Measured against the figures you gave**

| Feature | Original | Made |
| --- | --- | --- |
| Length | 1.06 s | 1.06 s |
| Under 150 Hz | 21% | 25.8% |
| 150 to 600 Hz | 26% | 26.5% |
| 600 to 2k Hz | 46% | 46.3% |
| 2k to 5k Hz | 6% | 1.4% |
| Over 5k Hz | 2% | 0% |
| Centroid | ~921 Hz | 611 Hz |
| Class check | — | 22 of 22 features in range |

**What's still off**

- **Brightness:** the 2k to 5k band is the weak spot. The grit layer is the lever, but its gain barely moved the result in my last tries. The tool's band warning passes it, but the centroid is about 300 Hz darker than the original's.
- **Shot body:** the sound is not as ragged as the original's. The generated take is smoother than a real clipped blast.
- **8-bit hiss:** the build warns that 8 bits adds a hiss under the quiet tail. I kept 8 bits because you said the original is 8-bit.
- **Reference:** I did not have the original file, only your description and figures. So there is no side-by-side picture or waveform comparison, and the numbers are checked against your description, not the real sound.

I stopped at this point because the rest is listening. Put it in the game and compare it with the original; if the tail or the top end still sounds off, tell me which way and I'll adjust.
