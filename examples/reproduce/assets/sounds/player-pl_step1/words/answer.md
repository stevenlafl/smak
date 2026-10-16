The sound is built and the build says **OK**. It is written to `work:sound/player/pl_step1.wav`, so it takes the place of the game's own file when put in `<mod>/sound`.

I built it from layers only, with no generated take, so no generator licence applies. The spec is inline in this conversation; I didn't save it as a file.

Measured against your facts:

```
Measure            Original (your figures)   Built
Length             0.27 s                    0.27 s
Format             11025 Hz, 8-bit, mono     11025 Hz, 8-bit, mono
Centroid           about 900 Hz              993 Hz
Band <150 Hz       13%                       9.6%
Band 150-600 Hz    60%                       62.4%
Band 600-2k Hz     9%                        8.5%
Band 2-5k Hz       16%                       18.8%
Band >5k Hz        1%                        0.7%
T20 (to -20 dB)    about 0.12 s after peak   0.135 s from onset
Flatness           noisy                     0.24 (class range 0.2 to 0.35)
```

- **Event and envelope:** a heel click cluster peaks at 0.023 s, then falls away. A quieter toe tap sits at 0.10 s, 12 dB under the first hit. After that, a faint hiss fades out by the end.
- **Character:** all noise, no tone, no reverb, and a crest of 17.8 dB, in the range of Valve's steps.

Things to know:

- **Reference not drawn:** no game folders were given, so the build did not check against the original `pl_step1.wav` itself. It checked against the game's concrete step class, and the sound passes on 20 of 22 features. I did not compare the waveform or spectrogram against your original file, so listen to it in the game.
- **8-bit warning:** the build warns that 8-bit adds a hiss under the quiet tail. I kept 8-bit because you asked for the original's format. If it sounds static-y in the game, 16-bit would fix that.
- **Centroid:** 993 Hz is above your 900 Hz figure, but inside the class range. Getting closer would have pushed the 2-5 kHz share past its target.
- **Variants:** I made only `pl_step1.wav`, as asked, with no `pl_step2` to `4`.
