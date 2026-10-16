The sound is built and the build says OK. It is at `work:sound/doors/doormove1.wav`, ready to go in `<mod>/sound/doors/`.

**Licence:** the sample layer is a take from woosh-dflow, licensed CC-BY-NC 4.0 (Creative Commons Attribution-NonCommercial). You accepted non-commercial licences for this test, so I used it. It cannot go in a commercial release without a different source.

**How it's built** (spec at `work/doors_doormove1.spec.json`):
- **Grinding bed:** a generated take of a door slab on a track, cut to 0 to 5.04 s, with a 0.1 s fade-in, a swell to +3 dB at 4.0 to 4.5 s, and a fade to silence over 4.64 to 5.04 s.
- **Squeal arcs:** four short sine sweeps from 380 to 520 Hz, starting at 0.2, 1.4, 2.6 and 3.8 s, at -22 dB.
- **Judder:** a train of pulses about every 40 ms (jittered), in the 150 to 1200 Hz band, from 4.0 s, with an envelope that fades out by 5.04 s.
- **Thump:** a sine falling from 110 to 50 Hz, starting at 4.0 s, at -20 dB.
- **Format:** 11025 Hz, 8-bit, mono, one-shot, no loop. Peak -3 dBFS, limited to a crest of 15 dB.

**Measured against your description:**

| Band | Original (described) | Built |
| --- | --- | --- |
| Under 150 Hz | 20% | 17.7% |
| 150 to 600 Hz | 35% | 35.5% |
| 600 to 2000 Hz | 30% | 34% |
| 2000 to 5000 Hz | 13% | 12.8% |
| Over 5000 Hz | 2% | 0% |
| Length | 5.04 s | 5.01 s |

**Where it falls short:**
- **Length:** the trailing fade is trimmed by the tool's silence threshold, so the file is 0.03 s short. I did not find a clean way to hold the last few milliseconds.
- **Over 5 kHz:** the file is 0% where the original is 2%. The 11025 Hz rate already cuts near 5.5 kHz, and I removed the lowpass, but the result is still empty there. This is a small share and I left it.
- **8-bit hiss:** the build warns that 8-bit adds a hiss under quiet tails. I kept 8-bit because you specified it.
- **Not checked against the original:** the original isn't on this machine, so the comparison is against your description only. The tool had no reference to draw, and the "class" check has no matching class for a door, so it gave no class score. Please listen beside the original; the judder timing and the squeal's character are the parts most likely to differ.
