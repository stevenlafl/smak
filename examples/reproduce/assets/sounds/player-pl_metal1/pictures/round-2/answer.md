The build says OK. It's at `work:sound/player/pl_metal1.wav` (11025 Hz, 8-bit, mono, one-shot). All engine checks passed, and all 22 measured features fall in the range of the game's own metal footsteps.

Compared with what the build measured off the original's picture:

```
                     original (picture)    mine
length               0.58 s                0.58 s
centroid             ~361 Hz               409 Hz (13% brighter)
T20 (time to -20 dB) 0.315-0.525 s         0.409 s
crest                ~16.3 dB              16.0 dB
widest band gap      -                     6.4 points (600 Hz-2 kHz)
```

**How it's built:** most of the sound is a noise body that starts broadband and gets darker as it decays, like the original's spectrogram. On top of that are a soft heel hit at 0, light scuff grains over the first 0.22 s, a sharper toe hit at 0.175 s for the spike in the original's waveform, and a very quiet low ring of metal modes for a little tone.

**Trade-off:** one build hit the centroid exactly (360 Hz), but its 600 Hz–2 kHz band was 10 points low and outside the game's range. I kept the final version because every band is within 6.4 points, at the cost of being 13% brighter.

These numbers only describe the drawing and the measurements. How it actually sounds, and how loud it is in the game against a map's room, needs someone to listen in-game.
