The sound is built and the build says **OK**. The file is `work:sound/items/smallmedkit1.wav`, ready to go in `<mod>/sound/items/`, so the game plays it in place of the original.

**Measured against the original's picture (the build's own readings):**

| Feature | Original | Mine | Status |
| --- | --- | --- | --- |
| Length | 0.76 s | 0.76 s | Match |
| Fall of 20 dB after the loudest point (T20) | 0.546 s | 0.544 s | Match |
| Crest | about 11.5 dB | 12 dB | Match |
| Power under 150 Hz | 0% | 0% | Match |
| Power 150–600 Hz | 14% | 11.1% | 2.9 points off |
| Power 600–2k Hz | 64% | 68.7% | 4.7 points off |
| Power 2k–5k Hz | 5% | 5.2% | Match |
| Power over 5k Hz | 17% | 15% | 2 points off |
| Centroid | 1936 Hz | 1737 Hz | 10% off |

Every band is within the 7-point tolerance and the centroid is within 15%. The build reports no faults. The one remaining gap is that my centroid is still about 200 Hz low; I stopped there because the last few adjustments were trading one band against another.

**What I built:** a pre-hit whisper of band-passed noise from 0 s (so the sound doesn't start late), then a struck ring at 400, 900, 1500, 2900 and 5500 Hz with decays of 0.35 to 1.9 s, and a short high-passed crack at 0.205 s where the loudest point falls. The finish limits the peak to -0.5 dBFS.

**Choices you may want to change:**
- **Layers only, no recording.** I generated four takes with the local woosh-dflow model (non-commercial licence). They were rustle- and click-heavy and their spectra didn't fit the original's ringing, so none went in. Nothing from that model is in the final file, so its licence doesn't apply to this output.
- **No `class` set.** The click class expects a T20 of at most 0.1 s, which the original doesn't meet. Keeping it would have flagged a correct sound as wrong.
- **16-bit, not 8-bit.** The original is 8-bit. The build warns that 8-bit adds hiss under the quiet tail, which would read as static against the original. The tool's own guidance is that a copy isn't held to the original's bit depth. If you want the exact 8-bit format, that's a one-line change.

I have not listened to it. The numbers say it matches the original's measures, but whether it sounds like the original is a call for you to make in the game.
