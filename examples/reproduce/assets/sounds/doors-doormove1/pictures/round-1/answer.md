The sound is built and the build says OK with every check passed. It's at `work:sound/doors/doormove1.wav`, and because it keeps the game's name it plays in place of the original once it's put in `<mod>/sound/doors/`.

```
                 original        mine
length           5.04 s          5.045 s
format           11025 Hz 8-bit  11025 Hz 8-bit mono
peak / RMS       (not given)     -1.1 dBFS / -14.5 dBFS
centroid         (not given)     453 Hz
power by band    (not given)     <150 Hz 34%, 150-600 Hz 40%, 600-2k Hz 24%, 2-5k Hz 2%
```

I only had a picture of the original, not its numbers, so the left column is mostly blank. The match is by eye against the drawing:

- **The event:** a sliding door rumbling for about 4.1 s, then a heavier low knock as it stops at about 4.15 s, fading out by about 4.9 s.
- **The body:** midrange-weighted noise with small rises and falls in level, plus a fine grit and a steady low rumble underneath.
- **The squeaks:** four faint rising tones near 300→420 Hz, at about 0.15 s, 1.45 s, 2.75 s and 4.0 s. They sit where the curved streaks are in the original's spectrogram.
- **The stop:** two low tones at 78 and 97 Hz. Played together they waver about 20 times a second, the same ripple the original's waveform shows there. A short rattle and a quiet metal ring go with them.

Side by side, mine is a bit more even and dense through the body than the original, whose waveform is more ragged. The squeak streaks are thinner than the original's softer, wider curves.

Neither the build nor I can hear the result, so someone needs to listen to it in the game. The game's volume and pitch for door sounds and the map's room (its `env_sound`) will also change how it plays there.
