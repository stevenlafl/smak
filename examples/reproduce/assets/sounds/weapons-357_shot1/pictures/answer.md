The sound is built and the build says OK, with no warnings. It is written to `work:sound/weapons/357_shot1.wav`, so it takes the game's place when it is put in `<mod>/sound`. I have not listened to it. Everything below is from the build's measurements.

```
measure            original (picture)   made
length             1.06 s               1.06 s
format             8-bit 22050 Hz       16-bit 22050 Hz mono
loudest            0.012 s              0.005 s attack
T20 (-20 dB fall)  0.813 s              0.948 s
centroid           921 Hz               887 Hz
<150 Hz            21%                  21.3%
150-600 Hz         26%                  23.9%
600-2k Hz          46%                  45.8%
2k-5k Hz           6%                   8.4%
>5k Hz             2%                   0.6%
onsets             3                    2
```

I built it from layers, not from a generated take. The four takes from the local sound model were unusable: two were long hiss washes, one was a crack that died in 0.04 s, and one was too dark. So the final file has no generated audio, and the model's non-commercial licence does not apply to it.

The spec, which you can rebuild from:

- **Crack:** white noise, highpass 1.8 kHz, 12 ms decay, at -2 dB.
- **Two echo hits:** the same noise at 0.2 s (-10 dB) and 0.45 s (-12 dB). These are my reading of the picture's amplitude dips, so the three-hit count is only partly matched.
- **Body:** white noise shaped to a spectrum that peaks around 400 Hz, lowpassed at 3 kHz, with a fall of -20 dB at about 0.8 s.
- **Boom:** a sine from 120 Hz falling to 40 Hz, at -1 dB.
- **Finish:** saturate 2.5, limit at 10 dB crest, peak -0.5 dBFS.

Three choices to check:

- **16-bit, not 8-bit.** The original is 8-bit. The guide warns that 8-bit adds a hiss under the quiet tail. If you want the original's depth, I can rebuild at 8 bits and check for that hiss.
- **T20 is 0.95 s, not 0.81 s.** The build's class range for gunshots is 0.46 to 1.01 s, so it passes, but I could not get the tail any shorter without losing the band balance. Two steeper body fall-offs made the spectrum worse, so I kept the earlier version.
- **Echo hits.** If the original's dips are not echoes, the two extra hits are the part to cut.
