The build says OK and every engine check passed. The file is `work:sound/weapons/cbar_hit1.wav`. Copy it to `<mod>/sound/weapons/` and the game plays it in place of the original crowbar hit.

**What it measures:**

```
format      11025 Hz, 8-bit, mono, 0.69 s, no loop
peak / RMS  -0.6 dBFS / -10.8 dBFS (crest 10.2 dB)
attack      0 ms (starts at full scale)
decay       T20 0.40 s, T40 0.65 s (seconds to -20 and -40 dB)
bands       <150 6.7% | 150-600 49.6% | 600-2k 31.1% | 2k-5k 12% | >5k 0.6%
```

**How it lines up with the description:**
- **Start:** a white-noise crack with no fade-in.
- **First 0.3 s:** low-mid noise peaking around 300 Hz, plus a separate layer of short rattle grains. The level swells slightly from 0.2 to 0.3 s.
- **At about 0.31 s:** the level drops abruptly by about 10 dB, which is roughly a third. In the drawing that's the visible step in the waveform.
- **Tail:** it fades exponentially to near silence. The lows and highs die faster than the middle.
- **Ring:** a steady 1010 Hz tone runs through the whole sound and is the main thing left in the tail. There's a fainter partial at 3020 Hz, and the pitch doesn't move.

**Two caveats:**
- **The original wasn't drawn beside it.** The server has no game folders set up, so I built from the description alone and can't confirm the match by sight.
- **6 of 22 measures fall outside the range of the game's typical metal hits.** It's darker (centroid 919 Hz against 1074 to 1654) and heavier at 150-600 Hz. That's on purpose: the description says the original is heaviest at 100-600 Hz, so I followed the description over the general class average. If the side-by-side shows the original is brighter, I'd move energy from the body layer to the 1 kHz band.

I can't hear the result, so it still needs a listen in the game. I also left a scratch file, `work:sound/test/a.wav`, from tracking down a bug: the per-mode gains in a `modes` layer are linear amplitudes, not dB, so `"gain": -10` had made the 3 kHz partial swamp everything. It's safe to delete.
