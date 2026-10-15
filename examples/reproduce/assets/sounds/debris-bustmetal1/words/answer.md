The sound is built and the build says OK: `work:sound/debris/bustmetal1.wav`, placed so the game plays it in the original's spot (`debris/bustmetal1.wav` under `sound/`). It is 11025 Hz, 8-bit, mono, 0.87 s, built from layers with no generated recording in it.

| Measure | Original (your description) | Built | Notes |
| --- | --- | --- | --- |
| Length | 0.87 s | 0.87 s | Matches |
| Start | instant, full level | attack 0 ms | Matches |
| Level at 0.3 s / 0.45 s | about -6 dB / -12 dB | set in the envelope, not measured directly | Check by ear |
| Tail | near silent by 0.75 s, silent at the end | T40 (seconds to -40 dB) 0.81 s | Close |
| Under 150 Hz | 8% | 6.6% | Close |
| 150 to 600 Hz | 22% | 25.6% | About 4 points over |
| 600 to 2000 Hz | 38% | 37.9% | Matches |
| 2000 to 5000 Hz | 30% | 29.1% | Matches |
| Over 5000 Hz | 2% | 0.7% | Cut by the 5.5 kHz limit of the rate |

**How it is built:** a noise impact whose spectrum falls and darkens over the decay (low end first, highs last), a fast envelope, a dense particle clatter for the first 0.15 s, a thin rattle train for the spikes in the decay, two narrow resonant noise bands (1190 and 2710 Hz) for the faint ringing, then saturation and a limiter (crest 12 dB).

**What I could not match or check:**
- **Flatness:** the sound measures 0.6 (1 is pure noise). The game's metal-hit range is 0.16 to 0.28. I kept it noisy because your description says "mainly noisy", so the class score will flag it. Tell me if the original is more tonal.
- **Faint bands:** these are narrow noise resonances, not true tonal modes. My attempts at a modes layer came out loud and tonal, so I dropped it.
- **Length warning:** the check flags 0.87 s as "too long" for a metal hit. That is the length you specified, so I kept it.
- **Not checkable here:** no game files were on this machine, so there was no reference sound to compare against. Only the description and the numbers were used. Listen in the game to judge it.

**Licence:** I generated four takes with woosh-dflow (non-commercial, CC-BY-NC 4.0 weights) and used none of them. The shipped file has no generated material in it.

**Leftovers:** the diagnostic files `work:sound/debris/diag_impact.wav`, `diag_mix.wav` and `diag_plate.wav` and the takes `work:gen/bustmetal_s0` to `s3` are still in the work folder. They are not in the game's path, so they do nothing in the game. I have no tool to delete them, so remove them by hand if you want the folder clean.
