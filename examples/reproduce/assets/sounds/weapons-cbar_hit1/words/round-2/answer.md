The build says OK: `weapons/cbar_hit1.wav` is in the work folder at `sound/weapons/cbar_hit1.wav`. It's 0.69 s, 11025 Hz, 8-bit mono, plays once, and every engine check passed.

**How it matches the description:**
- **Onset:** it starts at full scale with no fade-in (attack 0 ms). A 3 ms high-passed noise crack, added after the saturation, gives the sharp first strike.
- **0 to 0.3 s:** dense noise with a rough chatter of short random pulses about 18 ms apart. It swells slightly from 0.2 to 0.3 s.
- **At 0.31 s:** the level drops sharply to about a third, then dies off exponentially to near silence (T40, the time to fall 40 dB, is 0.67 s). It doesn't cut off.
- **Spectrum:** most of the noise is in the low mids (150 to 600 Hz is 27% of the power), with hiss up to about 5.5 kHz. The lows and highs fade faster than the middle.
- **Ring:** a steady 1010 Hz line runs the whole length and is what's left in the tail. A fainter partial sits near 2990 Hz. The pitch doesn't move.

**Where it sits outside the game's other metal hits:** it matches 18 of the 22 features the kit measures against them. The other 4 are close misses, and I left them on purpose to follow your description:

```
feature          this sound   game's metal hits
150-600 Hz band  27.1%        0 to 16.8%
600-2k band      58.1%        63.7 to 83.8%
flatness         0.371        0.16 to 0.28
RMS              -13 dBFS     -12.9 to -5.7
```

Flatness runs from 0 (a pure tone) to 1 (white noise). The first three are off because you described the loud part as noisy and heaviest in the low mids. The RMS (average loudness) is a tenth of a dB below the range. If you'd rather match the class, I can turn up the 1 kHz ring and the 600 Hz to 2 kHz band.

The report can't say how it sounds or how the game plays it (its volume and the map's room), so it needs a listen in the game. While debugging I also wrote a scratch file, `sound/test/ring.wav`, to the work folder, and these tools can't delete it. Remove it so it doesn't get copied into the mod.
