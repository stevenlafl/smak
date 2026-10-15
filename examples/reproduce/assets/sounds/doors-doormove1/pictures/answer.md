The sound is built and the build says OK with no warnings: `work:sound/doors/doormove1.wav`. It takes the game's name, so it replaces the original when put in the mod's `sound` folder. I can't listen to it, so the judgement of how it sounds is yours.

The sound is made from layers, not from a generated take. I generated four door takes, but none came near the original (too short, or the wrong spectrum), so none went into the spec. Those four takes are still in `work:gen/` and are under a non-commercial licence, so don't use them.

The comparison is against the numbers the tool reads off the original's picture (`pictures/sound.png`). I couldn't read the original `.wav` itself, since the file tool doesn't open binary audio.

```
Measure               Original (picture)   Built
Length                5.04 s               5.09 s
Centroid              589 Hz               591 Hz
Power under 150 Hz    30.1%                24.3%
Power 600 Hz to 2 kHz 27.6%                28.0%
T20 (time to -20 dB)  0.348 to 0.58 s      0.419 s
Crest                 about 12.7 dB        12.9 dB
Attack (burst onset)  about 4.1 s          4.09 s
Onsets                about 7              5
```

The build's sound layers are:
- A broadband noise body over the whole length, shaped to the original's spectrum, that holds up after the burst.
- A low sine rumble under it.
- Three short knocks at 0.6, 1.9 and 2.8 s.
- A ratchet train at 3.85 to 4.65 s, a ring at 4.2 s and a falling clunk at 4.55 s.
- Light room, saturation and a limiter set to a 13 dB crest, at 11025 Hz, 8-bit mono.

The main gap is the onset count: 5 built against about 7 read off the picture. The report doesn't flag it, but it is the next thing I'd tune if the ratchet sounds too sparse in the game. The under-150 Hz power is also 6 points heavy, which is within the tolerance of 7.
