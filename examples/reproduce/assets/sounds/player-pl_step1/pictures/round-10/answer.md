The sound is built and the build says **OK**, with no picture warnings. It's at `work:sound/player/pl_step1.wav`, and it will replace the game's own file when put in `<mod>/sound`.

I could not listen to it, so the match is by measurement only. The build's measures against the original's picture:

```
measure               original (picture)   made
length                0.27 s               0.27 s
crest (peak/RMS)      ~21.8 dB             21.7 dB
T20 (time to -20 dB)  0.04 to 0.18 s       0.06 s
centroid              ~902 Hz              801 Hz (11% off)
<150 Hz               13.1%                12.3%
150-600 Hz            ~60%                 63.2%
600-2k Hz             9.1%                 12.1%
2k-5k Hz              16.2%                12.1%
```

The step class check passes 20 of 22 features. The two it flags are the bands below 150 Hz and 150-600 Hz, each a few points off the step range.

The spec is four layers with no generator, so there is no licence to report:
- **thump:** a short sine that falls from 120 to 60 Hz, for the low knock.
- **click:** white noise band-passed at 4 kHz, for the hard onset.
- **body:** white noise band-passed at 300 Hz, with a decay of 0.27 s, for the mid body.
- **tail:** pink noise, 150 to 500 Hz, at a low level, for the tail to 0.27 s.

The file is 11025 Hz, 8-bit mono, like the original. The build warns that 8-bit adds hiss under the quiet tail. I kept 8-bit because the original is 8-bit; with 16-bit, the build would have no warning. Say if you want that.

Open point: I could not find the game's own step files on this server, so the class check runs against the ranges built into the kit, not the game's actual files.
