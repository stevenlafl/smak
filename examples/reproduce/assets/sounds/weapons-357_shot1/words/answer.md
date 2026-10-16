The sound is built at `work:sound/weapons/357_shot1.wav`, named so the game loads it in place of the original. The build says OK. It is made from layers only, with no recording, so the file carries no non-commercial licence.

| Measure | Original | Made | Note |
|---|---|---|---|
| Length | 1.06 s | 1.06 s | Matches |
| Rate and depth | 22050 Hz, 8-bit | 22050 Hz, 8-bit | Matches |
| Attack | full level within about 12 ms | 5 ms | Matches |
| Decay, 20 dB under loudest (T20) | 0.813 s | 0.783 s | Within 4% |
| Power under 150 Hz | 21% | 25% | Within 4 points |
| Power 150 to 600 Hz | 26% | 23.6% | Within 2.4 points |
| Power 600 to 2000 Hz | 46% | 46.5% | Matches |
| Power 2000 to 5000 Hz | 6% | 4.9% | Within 1.1 points |
| Power over 5000 Hz | 2% | 0.1% | Under the target, within the 7-point tolerance |
| Centroid (centre of energy) | about 921 Hz | 733 Hz | Darker than the original, not flagged by the build |
| Onsets (hits counted) | 3 | 0 | Open, see below |

How it is built: a low sine thump at 0.01 s that falls from 110 Hz to 38 Hz, a short bandpassed crack at 0.03 s, and a blast of noise at 0.045 s. Its spectrum moves darker over time. A rough tail follows from 0.3 s, and a faint high hiss sits at the very end. The mix is saturated and limited to a crest of 11 dB.

Three things to check:

- **Onset count is 0, not 3.** The build's judge merges hits under 50 ms apart, so three hits inside the first 40 ms can't be counted as three. I kept the 40 ms layout from the description. Spacing them 50 ms or more apart would make the count, but it would stretch the opening beyond what the original describes. Say if you want that trade.
- **Centroid is about 190 Hz low.** Brightening it would push the 600 to 2000 Hz share over its target, so I kept the band shares.
- **Not heard or tested in the game.** The build can't judge how it sounds to a person or how the game plays it, so listen to it in the game before you ship it.

I also generated four takes with the local generator (woosh-dflow, non-commercial licence) while trying a recording as a base. None of them went into the final file, so there is no licence issue in the output. The takes are in `work:gen/`.
