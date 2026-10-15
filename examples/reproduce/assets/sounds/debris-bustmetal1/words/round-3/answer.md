The sound is built and the build says OK: `work:sound/debris/bustmetal1.wav`. It goes in `<mod>/sound/debris/` to replace the game's file of that name.

I could not compare it with the original itself. No game folder was given, so the reference was not found and the check ran against the game's other metal-hit sounds. I also can't hear it, so the numbers below are the only check I have. Listen to it in the game before you trust it.

```
Measured (11025 Hz, 8-bit mono, 0.87 s)
Item                  Built            Your description
Length                0.87 s           0.87 s
Attack                0 ms (instant)   instant, full loudness
T20 (fall to -20 dB)  0.37 s           half by 0.3 s, quiet by 0.6 s
Band 150-600 Hz       10.8%            low weight at impact, fades fast
Band 600-2k Hz        71.4%            800 Hz to 4 kHz strongest
Band 2k-5k Hz         17.0%
Flatness              0.164            noise and tone mixed
Centroid              1267 Hz
```

What it's made of:
- **Crash:** shaped noise, loudest for 0.15 s, then falling by about -6 dB at 0.3 s and -20 dB at 0.6 s. The low end drops faster than the highs over the decay.
- **Click:** a short high-passed noise tick for the first few milliseconds.
- **Low ring:** two struck partials at 420 Hz and 685 Hz, decaying in about 0.6 s.
- **Main ring:** five inharmonic metallic partials on a 760 Hz base, which ring for about 0.9 s and keep the bell-like clang.
- **Tail flutter:** sparse 1.5 to 4 kHz rattles in the last 0.6 s.

The build's report flags only the length as "too long" against the other metal-hit sounds (their range tops out at 0.86 s). I kept 0.87 s because you specified it.

Things to know:
- Two earlier test files were written to `work:sound/debris/diag_low.wav` during tuning. I have no delete tool, so remove that file by hand. It is not part of the sound.
- The 2k to 5k band is at 17%, which is under the 2k to 5k range the game's own sounds show. I kept it there because your description says the highs are strongest. If the game version sounds too dull, raise the crash's 2k to 5k level first.
