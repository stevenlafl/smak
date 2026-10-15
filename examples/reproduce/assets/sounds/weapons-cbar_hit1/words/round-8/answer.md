The sound is built and the build says OK: `work:sound/weapons/cbar_hit1.wav`, 11025 Hz, 8-bit, mono, 0.69 s. It is made from layers only, with no generated recording in it, so the non-commercial licence of the generator does not reach the final file. I could not listen to it, and I had no copy of the original to draw beside it, so the comparison below is against your description, not the game's file.

Measured against your description:

```
Feature            Original (described)   Built (measured)
Length             0.69 s                 0.69 s
Format             11025 Hz, 8-bit mono   11025 Hz, 8-bit mono
Crest (peak/RMS)   about 8 dB             8.2 dB
Under 150 Hz       20%                    18%
150 to 600 Hz      35%                    33%
600 to 2000 Hz     30%                    35%
2000 to 5000 Hz    13%                    14%
Over 5000 Hz       2%                     0%
Dense to 0.43 s    yes                    yes, then drops to about a third and fades
1.1 kHz ring       on top of the tail     visible in the tail on the spectrogram
```

Known gaps:
- **Attack:** the report gives 20 ms, not instant. The body fades in over the first few milliseconds, and I could not remove that without a spike. Your description asks for instant, so this is a miss.
- **Game-class check:** the report still says the centroid (890 Hz) is darker than the game's metal hits (1074 to 1654 Hz), and that 150 Hz to 600 Hz and under 150 Hz are above the game's range. I kept the band shares you gave, since they are the target.
- **Tail length:** the report puts the level at -20 dB at 0.66 s, which is later than I aimed for. The picture shows a smooth fade to near silence by 0.69 s.
- **Listening:** the sound has not been heard. How it plays in the game (volume, room, mix) needs a listen.

The spec, as built, is below. It is not saved as a file in the work folder, because my tools here cannot write one.

```json
{
  "spec": "smak.sound/1",
  "name": "weapons/cbar_hit1.wav",
  "class": "metal hit",
  "rate": 11025,
  "bits": 8,
  "length": 0.69,
  "layers": [
    {"id": "body", "kind": "noise", "color": "white",
     "filter": [{"type": "highpass", "f": 60}, {"type": "lowpass", "f": 2400, "q": 0.7},
                {"type": "peak", "f": 110, "q": 0.8, "gain": 6},
                {"type": "peak", "f": 800, "q": 0.8, "gain": -3},
                {"type": "peak", "f": 1600, "q": 1, "gain": -12}],
     "env": {"points": [[0, -60], [0.003, 0], [0.3, -1], [0.36, -0.5], [0.43, -8], [0.46, -60]]}, "gain": 0},
    {"id": "thump", "kind": "tone", "f": 105, "wave": "sine", "env": {"attack": 0.01, "decay": 0.3}, "gain": -1},
    {"id": "tail", "kind": "noise", "color": "white", "post": true,
     "filter": [{"type": "bandpass", "f": 500, "q": 0.7}],
     "env": {"points": [[0, -50], [0.3, -30], [0.43, -10], [0.5, -18], [0.6, -36], [0.69, -60]]}, "gain": -6},
    {"id": "ring", "kind": "modes", "modes": [{"f": 1100, "gain": -8, "decay": 1.2}],
     "env": {"attack": 0.02, "decay": 1.2}, "gain": -36}
  ],
  "finish": {"limit": {"crest": 8, "release": 0.002}, "peak": -0.5}
}
```

What I learned about the tool, which may matter for the next sound:
- A post-limiter layer's gain changed nothing in my tests, so the tail and the ring were kept at levels set by trial.
- The limiter lifts quiet tails. That is why the tail is a separate post layer.
- The 1.1 kHz ring only shows up when its attack is softened; without that, its first sample makes a spike.
- The band shares are measured on linear frequency bins, so white noise puts most of its power above 600 Hz. The filters have to pull it down.
