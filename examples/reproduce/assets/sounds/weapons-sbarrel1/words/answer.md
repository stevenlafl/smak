The new `weapons/sbarrel1.wav` builds OK and every check passed. All 22 measured features fall inside the range of the game's own gunshot sounds. It's written to `work:sound/weapons/sbarrel1.wav`, and if you drop it into `<mod>/sound/weapons/` it plays in the original's place with no code change.

One thing to know before judging it: I couldn't compare it against the original. The server has no game folders set up, so the build couldn't read the original sbarrel1.wav or draw it alongside. Everything below is checked against your description and the game's general gunshot range, not the original file.

```
                     Description                Built
Format               22050 Hz 8-bit mono        22050 Hz 8-bit mono, no loop
Length               1.04 s                     1.043 s
Attack               full scale in a few ms     5 ms
Down 20 dB / 40 dB   falling 0.3-0.6 s,         0.55 s / 0.79 s
                     silent by end
Peak / RMS / crest   clipped, saturated         -0.6 dBFS / -10.5 dB / 9.9 dB
Centroid             low-mid, dark              556 Hz
Flatness             all noise, no pitch        0.071 (game's range 0-0.2)
Power <150 Hz                                   33.9%
Power 150-600 Hz     most energy 50-500 Hz      40.9%
Power 600 Hz-2 kHz                              20.5%
Power 2-5 kHz                                   3.2%
Power >5 kHz         attack only, to ~9 kHz     1.5%
```

**How it's built:**
- **Blast:** a sharp burst of full-band noise up to 9.5 kHz, plus a high-passed noise crack that's gone by about 0.4 s. The highs die first.
- **Body:** pink noise boosted around 250 Hz and 1 kHz. Its low-pass slides from 2.2 kHz down to 350 Hz over 0.6 s, which darkens the tail. Its level dips and recovers twice between 0.3 and 0.6 s for the ragged echo bursts.
- **Low end:** a sine thump falling from 120 Hz to 55 Hz, and a brown-noise rumble under 400 Hz that fades smoothly to the end.
- **Secondary pops:** six faint particle pops in the first 0.3 s.
- **Finish:** heavy saturation (drive 6), which keeps the first quarter-second clipped and crackling, and a short dull room. Writing it at 8-bit gives the grit.

The spectrogram shows the shape you described: a dense, saturated start whose highs drop out by about 0.3 s, a darkening fall, and a low tail fading into silence. The tool can't tell how it sounds or how the game plays it (volume, pitch, the map's room), so it still needs a listen in the game. If you set up the game folders, I can rebuild it with the original drawn beside it for a real side-by-side.
