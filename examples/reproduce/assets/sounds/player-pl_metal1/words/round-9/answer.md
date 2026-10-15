The sound is built and the build says OK. It is written to `work:sound/player/pl_metal1.wav`, so it can go in a mod's `sound/player/` folder and take the game's place.

**Build result**

| Measure | Original (your description) | Built | Off by |
| --- | --- | --- | --- |
| Length | 0.58 s | 0.58 s | none |
| Format | 11025 Hz, 8-bit, mono | 11025 Hz, 8-bit, mono | none |
| Under 150 Hz | about 20% | 21.2% | 1.2 points |
| 150 to 600 Hz | about 35% | 34.0% | 1.0 point |
| 600 to 2000 Hz | about 30% | 29.7% | 0.3 points |
| 2000 to 5000 Hz | about 13% | 13.5% | 0.5 points |
| Over 5000 Hz | about 2% | 1.6% | 0.4 points |
| Decay (T20, time to -20 dB) | in the game's range, 0.32 to 0.53 s | 0.34 s | in range |

The band shares are measured on the file, not my own estimate.

**How it's built.** It is all layers, with no generated take in it: a dense crackle burst at the start (0 to 0.13 s), a broadband grain-shaped body whose spectrum moves over time and fades from about 0.25 s, a 3 ms crack at 0.17 s as the loudest peak, and a two-mode plate ring at about 180 and 320 Hz for the tail. The four woosh-dflow takes I generated are in `work:gen/` but unused, so the non-commercial licence does not apply to this file.

**Where it still differs from the game's own steps**

- **Flatness is 0.41.** The game's metal steps measure 0.01 to 0.11, which means they are much more tonal than this. I kept the grainy attack you described, which is the main reason. Making the whole file more tonal would mean removing that grain.
- **Crest is 12.9 dB.** The game's steps measure 15 to 21 dB. I could not push the crest up without making the 0.17 s crack too prominent, and changing its gain made no difference to the crest.
- **Centroid is about 970 Hz.** The game's metal steps sit at 260 to 460 Hz. Your band shares imply a centroid near 1000 Hz, so the two conflict. I followed the band shares.

I could only measure the file and look at its picture. I have not listened to it, and I had no copy of the original to compare against, so the match rests on your description. The judgement of how it sounds is yours.
