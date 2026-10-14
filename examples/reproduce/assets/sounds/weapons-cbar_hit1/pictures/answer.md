The build says OK: `weapons/cbar_hit1.wav` is in the work folder at `sound/weapons/cbar_hit1.wav`. It's 11025 Hz, 8-bit mono, 0.69 s, and every engine check passed. Drop it into `<mod>/sound/weapons/` and the game plays it in place of the crowbar's own hit, with no code change.

Measured against the original's picture:

```
               original (read off picture)   mine
length         0.69 s                        0.69 s
centroid       1467 Hz                       1435 Hz   (2% off)
crest          ~9.8 dB (+/-3)                10.0 dB
T20            0.24-0.7 s (class range)      0.474 s
bands          -                             6.3 points off at most (600-2k Hz)
onsets         0                             0
```

What it's made of: a shaped noise body that stays loud for about 0.3 s, drops sharply around 0.33 s and then fades out. Its top end darkens over time, as in the original. On top of that are a band-limited rattle, a 20 ms strike and a 1060 Hz sine ring, which draws as the same tone line the original shows. The whole thing runs through light saturation.

Two things to know:
- **Noisiness:** it scores 21 of 22 against the game's metal hits. The one miss is that it's a bit noisier than the class: spectral flatness (0 is a pure tone, 1 is white noise) is 0.35 against a range of 0.16 to 0.28. The picture doesn't give the original's own flatness, so I can't tell whether the original sits in that range too. Turning the ring up fixes the score, but then the tone line drowns the noise and the bands go off.
- **The `modes` layer misbehaved:**
  - Changing the layer gain from -6 to -5 dB gave identical output.
  - Quieter overtones (per-mode gains of -12 and -18 dB) came out louder than the main tone.
  
  I switched the ring to a plain `tone` layer, which behaved as expected. It may be a smak bug worth a look.

The build can't check how it sounds or how it sits in-game (volume, pitch as the code plays it, the map's room), so it needs a listen in the game.
