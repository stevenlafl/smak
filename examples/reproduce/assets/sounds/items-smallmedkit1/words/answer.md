The sound is built and the build says **OK**. It's written to `work:sound/items/smallmedkit1.wav`, so it takes the place of the game's own file when it sits in `<mod>/sound`.

I made it from layers only, with no generated take, so no non-commercial licence applies.

**Measured against your description**

| Check | Original (your figures) | Built file | Off by |
|---|---|---|---|
| Length | 0.76 s | 0.76 s | none |
| Sample rate and depth | 22050 Hz, 8-bit | 22050 Hz, 8-bit | none |
| Power under 150 Hz | 0% | 1.7% | +1.7 points |
| Power 150 to 600 Hz | 14% | 13.1% | -0.9 points |
| Power 600 to 2k Hz | 64% | 64.3% | +0.3 points |
| Power 2k to 5k Hz | 5% | 6.5% | +1.5 points |
| Power over 5k Hz | 17% | 14.4% | -2.6 points |
| Spectral centroid | about 1936 Hz | 1821 Hz | about 6% low |

**How it's built**

- **Beeps (0 to 0.35 s):** three sine tones at 700 Hz, lengths 0.03, 0.12 and 0.15 s, with 0.02 and 0.03 s gaps. Each has a 2 ms edge and a short high-passed click at its start.
- **Rustle (0.35 to 0.68 s):** pink noise band-limited to 150 to 2000 Hz, with four small ticks and one clearer click at 0.52 s.
- **Hiss (0.68 to 0.76 s):** white noise band-limited to 4 to 9 kHz, held steady and cut off at the end, with a weak low rumble under it.
- **Finish:** a short high-passed crack at 0 s so the sound starts at full level, then a limiter and a -0.5 dBFS peak.

**Where I departed from your description**

- **Rustle and hiss are louder than you described.** Your 15 to 20% amplitude for the rustle can't produce the 14% low-mid power share. The shares are measured, so I matched them. The rustle now sits near the beeps' peak level, not well below it. If the level matters more than the shares, tell me and I'll rebalance.
- **The hiss is close to the beeps' peak level,** as you described.
- **Attack reads 708 ms.** The sound starts at full level, but the report's attack figure is measured on the overall envelope, which is dominated by the later hiss. I did not change this, since the build raised no warning on it.

**Left as is**

- **8-bit:** kept because your description says the original is 8-bit. The build warns that 8-bit adds a faint hiss under quiet tails, which is the grainy noise floor you described. If you'd rather avoid that, it's one line (`bits`) to change to 16.
- **No game file to compare against:** the game's original wasn't in the folders I had, so the build measured against your numbers, not the real file. Listening in the game is the real test.
