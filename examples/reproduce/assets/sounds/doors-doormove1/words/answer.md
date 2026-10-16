The sound is built and the build says OK: `work:sound/doors/doormove1.wav`. It is mono, 11025 Hz, 8-bit, 5.04 s long. I could not hear it, and the original isn't in this environment, so the match is to your description and its figures, not a side-by-side listen.

| Measure | Original (your figures) | Made |
|---|---|---|
| Length | 5.04 s | 5.04 s |
| Loudest point | 4.435 s | about 4.4 s (the stop thump) |
| Fall after peak (T20) | 20 dB in 0.464 s | 0.394 s |
| Centroid | about 589 Hz | 485 Hz |
| Under 150 Hz | 30% | 36% |
| 150 to 600 Hz | 38% | 37% |
| 600 to 2000 Hz | 28% | 24% |
| 2000 to 5000 Hz | 4% | 3% |
| Over 5000 Hz | 0% | 0% |

All five bands are within the 7-point tolerance, and the build's band warning is gone. The centroid is still about 100 Hz dull of the target, and the fall is a little faster than the original's.

**How it's made**
- **Grinding body:** a take from the local generator woosh-dflow (seed 0), prompted as a steel door rolling on its rail with a stop thud, run through band filters to move its energy toward the original's mid and upper-mid balance. It fades in at once, with a fall after the stop thud at about 4.4 s.
- **Squeal arcs:** four short sine sweeps from 320 Hz up to 420 Hz at 0.3, 1.6, 2.9 and 4.0 s.
- **Hits:** three low bumps (around 0.9, 2.2 and 3.5 s) and a cluster of rattling knocks from 4.2 s.
- **Stop:** a run of low pulses and a falling 60 Hz thump at 4.4 s, then a short low tail that runs out at 5.04 s.

**Things you should know**
- **Licence:** woosh-dflow's weights are CC-BY-NC 4.0, which is non-commercial. You accepted that for this test. The sound inherits it, so it can't ship in a commercial mod.
- **8-bit hiss:** the build warns that 8-bit adds a faint hiss under the quiet tail. I kept 8-bit because your description of the original says 8-bit. If you'd rather lose the hiss, changing `bits` to 16 in the spec removes it.
- **Not checked:** how it sounds, its volume in the game, and how the game's room changes it. Only listening in the game can settle those.

The spec used for the build is in this conversation, not saved as a file. If you want it kept in the repo, I can write it out.
