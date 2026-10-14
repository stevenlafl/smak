The build says OK. It's at `work:sound/weapons/357_shot1.wav`, and putting it in `<mod>/sound/weapons/` makes it play instead of the original.

**What it is:** 22,050 Hz, 8-bit mono, 1.06 s long, plays once (no loop).
- **Opening:** a 2 ms high click, about 5 ms of near silence, then the blast at full scale.
- **0 to 0.44 s:** loud white, pink and brown noise driven hard by the saturation stage, so it's a dense, clipped wall of sound. The highs start about 7 kHz.
- **From 0.44 s:** a steady, roughly exponential decay. A lowpass filter sweeps down to 400–600 Hz, so the mids and highs die first and the tail is dark low rumble. It's about −60 dB by 1.0 s, followed by a near-silent tail.

**Measured:**
```
peak            -0.3 dBFS
RMS             -10.2 dB
T20 / T40       0.58 s / 0.74 s   (time to fall 20 / 40 dB)
centroid        791 Hz            (overall brightness)
flatness        0.125             (0 = pure tone, 1 = white noise)
onsets          1
bands <150 Hz   39.6%
      150-600   27.8%
      600-2k    20.8%
      2k-5k     9.3%
      >5k       2.5%
vs game gunshots: 22 of 22 features in range
```

**What I couldn't check:**
- **No side-by-side with the original.** The build drew no reference beside mine, so I matched your description and the game's general gunshot ranges, not the real `357_shot1.wav`.
- **The attack time reads 95 ms.** That's probably the time to the loudest point inside the clipped section, since the sound starts at once. But the drawing will show it, so it's worth a look.
- **The click might not stand out.** The report counts one onset, which probably means the click and the blast were heard as a single hit. On a waveform plot the click may only show as a sliver before the blast.
- **How it sounds.** I can't hear it, and its volume and the room around it in the game aren't checked either. Listen to it in the game.
