The build now says OK. `ambience/drips.wav` is written to the work folder under `sound/ambience/`, ready to go in a mod's `sound` folder in place of the game's file of that name.

**What it is:** a loop of four water drips at the times read off the original's picture (about 0.04 s, 1.87 s, 3.68 s and 3.98 s, plus one at 5.79 s), over a faint mid-band hiss. It is 11025 Hz, 8-bit mono, with a loop cue at its start, as the original is.

**How it was made:** the drip events are a sample from a generated take (`woosh-dflow` seed 1, prompted for one drip in a stone cave). The take was low-passed and given a mid peak to bring its spectrum toward the original's. The bed is a quiet pink-noise band.

**Measured against the original's picture:**

| Measure | Original (read off picture) | Made sound |
| --- | --- | --- |
| Centroid | 795 Hz | 893 Hz (12% off, within 15%) |
| Power <150 Hz | 1% | 0.3% |
| Power 150-600 Hz | 22% | 27.9% |
| Power 600-2k Hz | 74% | 68.9% |
| Power 2k-5k Hz | 2% | 2.9% |
| Power >5k Hz | 1% | 0% |
| Length | 7.31 s | 7.06 s (3% off) |
| Crest | about 24.9 dB | 24.8 dB |

The picture check raises no warnings, and the class check passes 20 of 20 features against the game's own drip loops. The checks don't cover how it sounds to a person or how the game plays it, so please listen in the game.

**Remaining warnings (advisory, not failures):**
- **Static:** the build flags the faint bed noise as possible static. I kept it because the original has a continuous low floor between drips. Removing it would make the gaps quieter than the original.
- **8-bit hiss:** the build notes 8-bit adds a hiss under the quiet parts. I kept 8-bit to match the original's file format. If you'd rather have a cleaner tail, 16-bit is a one-line change (`bits`).

**Licence:** the drip take comes from `woosh-dflow`, licensed CC-BY-NC 4.0 (non-commercial). You said that's acceptable for this test. It would need a different take before any commercial use.

**Not matched exactly:** the 150-600 Hz band runs about 6 points high, and the length is 0.25 s short. Both are within the build's tolerances.
