The new crowbar hit is done and the build says OK. It's at `work:sound/weapons/cbar_hit1.wav`; put it in `<mod>/sound/weapons/` and the game plays it in place of the original, no code needed.

**Format:** it matches the original: 11025 Hz, 8-bit, mono, 0.69 s, played once. The engine checks found nothing wrong: no clipping, no silence at the start, no click at the end.

**Measured against the game's own metal-hit sounds:** all 22 features are in range.

```
feature            this build      game's range
RMS (loudness)     -10.6 dBFS      -12.9 to -5.7
crest (spikiness)  10.0 dB         5.3 to 12.5
centroid (bright)  1342 Hz         1074 to 1654
flatness (noise)   0.181           0.16 to 0.28
600-2000 Hz power  69.7%           63.7 to 83.8
2-5 kHz power      10.7%           3.7 to 24.6
time to -20 dB     0.364 s
time to -40 dB     0.673 s
```

**How it's shaped:** I matched it to the original's picture:
- **Start:** a sharp crack, with no attack time.
- **Body:** dense, rattly metallic noise centered near 1 kHz, held for about 0.3 s with a slight swell around 0.25 s. Some low end sits under it, like the original.
- **Tail:** it drops at about 0.32 s into a fading tail that runs to the end, with a faint ring at about 720 Hz throughout.

**Where it differs from the original:**
- **The ring is fainter.** In the original's spectrogram the ring line is plainly visible. Making it that loud pushed my noise flatness and mid-band power out of the game's range, so I kept it lower. Side by side, my line shows up less.
- **The ring pitch is a guess.** I read about 720 Hz off the picture's scale, and that reading could be off.

All of this is from measurements and pictures, so I haven't heard it. Someone should listen to it in the game, where the code's volume and pitch and the map's room sound also change it.
