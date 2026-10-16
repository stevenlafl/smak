The sound builds OK and is written to `work:sound/weapons/cbar_hit1.wav`, so it takes the place of the game's file. It has no generated take, so the only licence involved is the one for the tools I used, which the person accepted.

Measured against the original's picture:

```
measure         original (from picture)   made sound
length          0.69 s                    0.69 s
centroid        1467 Hz                   1599 Hz (9% off)
<150 Hz         3%                        0%
150-600 Hz      8%                        8.1%
600-2k Hz       69%                       72.6%
2k-5k Hz        19%                       19.3%
>5k Hz          1%                        0%
crest           about 9.8 dB              9.5 dB
RMS             -                         -10 dBFS (class range -12.9 to -5.7)
T20             -                         0.48 s (class range 0.24 to 0.7)
format          11025 Hz, 8-bit           11025 Hz, 16-bit mono
```

The build's class check has 20 of 22 features in the range of the game's metal hits. The miss is flatness: 0 against a class range of 0.16 to 0.28, so the sound is more tonal than a real hit. I tried a short noise crack to add it, and it did not move flatness at any level I tried, while it added a slow attack. I left it out.

Choices I made:
- **16-bit, not 8-bit.** The build warns that 8-bit adds hiss under the tail, which is heard as static. Setting `"bits": 8` is a one-line change if you want the original's depth exactly.
- **No room.** A room made the sound die too soon, so I dropped it. The map's `env_sound` adds the room anyway.

Things to know:
- **I have not listened to it.** The numbers match the picture, but how it sounds is for you to judge in the game.
- **`modes` gains look like linear amplitudes, not dB.** A gain of 0 silenced a mode and the results only fit that reading. The guide describes dB for layers and says nothing about this, so please check it.
- **Lowpass on a sample layer behaved oddly.** A 2800 Hz lowpass on a generated take left only a 200 Hz body, and 8700 and 12000 Hz gave different odd results. I did not diagnose it and did not use it.
- **I could not read smak's source.** Reading `src/audio/modes.mjs` was refused, so the gain finding is inferred from builds only.
- **The spec is not saved to disk.** The file tool is disabled in this session, so here it is:

```json
{
  "spec": "smak.sound/1",
  "name": "weapons/cbar_hit1.wav",
  "class": "metal hit",
  "seed": 3,
  "rate": 11025,
  "length": 0.69,
  "layers": [
    { "id": "thump", "kind": "tone", "f": 240, "wave": "sine", "sweep": { "to": 180, "time": 0.2 }, "env": { "decay": 0.8 }, "gain": 10 },
    { "id": "ring", "kind": "modes", "modes": [
      { "f": 1350, "gain": 8, "decay": 0.9 },
      { "f": 3100, "gain": 4.2, "decay": 0.9 }
    ] }
  ],
  "finish": { "saturate": 1.5, "limit": { "crest": 9.5, "release": 0.002 }, "peak": -0.5 },
  "bands": { "<150": 3, "150-600": 8, "600-2k": 69, "2k-5k": 19, ">5k": 1 },
  "picture": "pictures/sound.png"
}
```
