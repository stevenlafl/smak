The shotgun blast builds OK and every check passed. It's written to `work:sound/weapons/sbarrel1.wav`, so it replaces the game's file when you put it in `<mod>/sound/weapons/`.

```
                     made                 original (as described)
format               22050 Hz 8-bit mono  22050 Hz 8-bit mono, played once
length               1.04 s               1.04 s
peak / RMS / crest   -0.6 / -10.6 / 10 dB clipped, saturated attack
attack               10 ms                full scale in the first few ms
T20 / T40            0.53 s / 0.96 s      falls 0.3-0.6 s, quiet rumble after
centroid             827 Hz               mostly 50-500 Hz
power <150 Hz        19.7%
power 150-600 Hz     42.6%
power 600-2k Hz      28.1%
power 2k-5k Hz        7.5%
power >5k Hz          2.0%                noise up to 8-10 kHz in the attack only
gunshot class range  22 of 22 in range
```

(T20 and T40 are the seconds it takes to fall by 20 dB and 40 dB.)

**How it's made:**
- **Main blast:** saturated noise whose spectrum changes over time. The first 0.25 s is held hot and reaches up to about 10 kHz. It then drops away until about 0.6 s and ends as a low-passed rumble that's still fading at 1.04 s.
- **Low-end thump:** a sine that drops from 100 Hz to 45 Hz.
- **Echo pops:** a few faint bursts in the first 0.3 s.
- **Crack:** a 3 ms click at the very start.
- **Finish:** saturation, then a limiter set to a 10 dB crest so the attack sounds clipped. The 8-bit file adds the grit.

In the spectrogram, the highs die off by about 0.3 s and the lows hang on to the end. There's no tone, no pitch and no mechanical clicks.

**Where it differs from the description:**
- The attack measures 10 ms, a little slower than "the first few milliseconds".
- The tool counts 2 onsets (separate hits), which are the faint echo pops.
- Its energy centre is 827 Hz. That's brighter than "mostly 50-500 Hz" suggests, but I went this way because the darker version I built first was below the range of the game's gunshots.

I didn't have the original to compare against, so these numbers are only checked against the description. How it sounds and how loud it plays in game can only be judged by listening in the game.
