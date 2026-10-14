I built `debris/bustmetal1.wav` and the build says OK: every engine check passed. I couldn't compare it with the real file, though. The server has no game folders set up, so the original wasn't there to draw beside it. I matched it to the written description and to the measurements of the game's own metal hit sounds.

**What it measures:**
```
format           11025 Hz, 8-bit, mono, 0.873 s, no loop
attack           0 ms (full loudness at once)
time to -20 dB   0.42 s
time to -40 dB   0.68 s
centroid         1682 Hz (where the energy is centred)
flatness         0.23 (between pure tone 0 and noise 1)
power by band    <150 Hz 1% | 150-600 5% | 600-2k 70% | 2k-5k 24%
```

**How it's built:**
- **Crunch:** filtered noise that stays at full level for 0.15 s. It's down about 8 dB (roughly half as loud) by 0.3 s, down 30 dB by 0.6 s, and silent at the end.
- **Weight:** a short low thump for the impact, which fades well before the highs, so the tail sounds thin and bright.
- **Ring:** eleven steady metallic overtones from 610 Hz to 4.46 kHz, spaced unevenly like a struck sheet. Each one rings a little longer than the one below it, so the highest last longest. A quiet bell-like layer sits on top, and none of them change pitch.
- **Rattle:** faint debris particles through the tail.
- **Finish:** heavy saturation, so the first 0.15 s holds flat and dense instead of being one spike.

It matched the game's metal hit sounds on 20 of 22 features. The two misses are on purpose:
- **Length:** 0.87 s is just over their 0.86 s maximum, but that's the original's length.
- **Brightness:** the centroid is 1682 Hz, a little above their 1654 Hz ceiling. The description puts the strongest energy at 800 Hz to 4 kHz, so I kept it.

The build said "onsets 1" on the last two versions, meaning it found one hit. That fits "no later separate hits".

The build tool can't judge how it sounds, how loud the game plays it, or the map's echo, so give it a listen in the game. The file is at `work:sound/debris/bustmetal1.wav`; copy it to `<mod>/sound/debris/` and the game plays it in the original's place.

While checking a problem, I also left `test/t300.wav`, `test/crunch.wav` and `test/ring.wav` in the work folder. These tools can't delete files, so they need removing by hand. The problem: when you list ring frequencies one by one, the `gain` values are plain volume numbers, not decibels. My first tries used decibels, so the highest overtones came out loudest and the whole sound was far too bright.
