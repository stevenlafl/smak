The sound is built and the build says OK, with no warnings. It is at `work:sound/weapons/sbarrel1.wav`, ready to go in a mod's `sound/` folder under the name the game loads.

Against the original's picture, the measured numbers are:

```
                 original (picture)   made sound
length           1.04 s               0.997 s (4% short)
centroid         615 Hz               614 Hz
<150 Hz          36%                  38.6%
150-600 Hz       32%                  25.8%   (6.2 points low, the widest gap)
600-2k Hz        26%                  29.5%
2k-5k Hz         4%                   6.1%
>5k Hz           1%                   0%
T20 (decay)      0.46-1.01 s range    0.888 s
crest            about 11 dB          8.8 dB
```

How it's made:
- **Body:** the second generated take (seed 1) of a double-barrel shotgun shot from woosh-dflow, cut from its onset, high-passed at 150 Hz, low-passed at 4.5 kHz, with lifts at 300 Hz, 1.4 kHz and 3 kHz, and a falling envelope.
- **Thump:** a 110 Hz sine sweeping down to 50 Hz, kept quiet (-24 dB) so it adds body without swamping the low band.
- **Crack:** a short high-passed noise burst added after the limiter for the sharp onset.
- **Finish:** saturation of 2 and a limiter at 9 dB crest, peak at -0.5 dBFS.
- **Format:** 22050 Hz, 16-bit, mono.

Things to know before you listen:
- **Licence:** the take comes from woosh-dflow, whose weights are CC-BY-NC 4.0 (non-commercial). You said that's fine for this test. The build's facts record it.
- **Bit depth:** I made it 16-bit, not the original's 8-bit. The build warns that 8-bit adds dither hiss under the quiet tail, which would sound like static. If you want the 8-bit grain for character, that's a one-field change, but expect the hiss.
- **What I could not check:** the original WAV is not in the game folders the server was given, so the match is against its picture and the numbers read off it, not a sample-by-sample comparison. The build can't say how it sounds or how the game plays it (volume, pitch, the map's room). Listen to it in the game beside the original before calling it done.
- **Spec:** the spec was passed inline, not saved as a file. If you want it reproducible, I can write it into the reproduce folder next to the input.
