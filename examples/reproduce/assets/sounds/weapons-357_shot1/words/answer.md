`weapons/357_shot1.wav` is built and the build says OK. It's 1.06 s, 22,050 Hz, 8-bit mono, plays once, and passed every engine check. It also landed inside the range of the game's own gunshots on all 22 measured features.

What it does:
- **Start:** a click of high-passed noise about 2 ms long, a near-silent gap, then the blast at 8 ms.
- **Loudness:** heavily overdriven (saturation at 8, the top of the scale) and pinned near full scale until about 0.45 s. Then it decays roughly exponentially: down 20 dB at 0.57 s, down 40 dB at 0.83 s, near silence at 1.0 s, with a quiet tail to the end.
- **Spectrum:** broadband noise heaviest in the low end, plus a faint falling 100→50 Hz layer for the boom. The highs roll off first, so the last few tenths of a second are low rumble. There's no audible pitch.

Measured:

```
peak        -0.6 dBFS
RMS         -8.6 dB
crest        8.0 dB   (Valve's weapons: 6 to 10)
centroid    1018 Hz   (gunshot range 421 to 1258)
flatness    0.194     (range 0 to 0.2)
power       <150 Hz 23%, 150-600 37%, 600-2k 26%, 2k-5k 10%, >5k 4%
```

There are two gaps against the description:
- **The click doesn't show up as a separate hit.** The report counts 0 onsets and gives the attack as 10 ms. The click is in the file, but the measurement doesn't separate it from the blast, and it may not stand out in the drawing either.
- **The bass boom is a faint tone layer** (12 dB down). The class check wanted the sound less noisy than pure noise. You may be able to see it as a line at the bottom of the spectrogram.

None of this says how it sounds in the game. That depends on the revolver's volume, the map's room (`env_sound`) and the mix, so it needs a listen in-game. The file is at `work:sound/weapons/357_shot1.wav`; copy it to `<mod>/sound/weapons/` to replace the original.
