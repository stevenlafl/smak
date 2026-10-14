# 38 The wrench's sounds (sounds; the crowbar's files)

## The prompt (79 words)

> The wrench from before needs sounds of its own: a heavy steel clang when it hits a wall, two of them so it
> doesn't repeat, a duller wet thud when it hits a body, three of those, and a whoosh when it swings and
> misses. Use the crowbar's file names so the game plays them with no code. Make them sit next to the game's
> own sounds, not louder or quieter than the rest.

Its pictures draw the game's own crowbar sounds beside the new ones (read from the person's install): its
results stay out of the repository (`.gitignore`), and `run.mjs` builds them again where the game is installed.

## The rubric (written before the spec)

| # | Item | Must | Score |
| --- | --- | --- | --- |
| 1 | Six files with the crowbar's names (`cbar_hit1`, `cbar_hit2`, `cbar_hitbod1` to `3`, `cbar_miss1`), mono PCM, every hard check passed | yes | 2 |
| 2 | The wall hits ring like steel: modes in the spectrogram, T20 0.3 to 0.7 s, centroid 900 to 1800 Hz | yes | 2 |
| 3 | The body hits are dull: over half their power under 150 Hz, under 0.4 s | yes | 2 |
| 4 | The miss is a whoosh: an attack over 100 ms, no hit in it, a peak at -6 to -12 dBFS | yes | 2 |
| 5 | Each file's features in its class's range on 80% or more | no | 2 |
| 6 | The variants differ from one another and are alike | no | 2 |

**Score: 12 of 12 (100%), judged from the report's measures and the picture. Passes.** Against the game's
own of their kinds: the wall hits 18 of 22, the body hits 18 of 22, the miss 20 of 22. That is "like the
game's" by the numbers, not "sounds right": the person listens in the game.

## How the prompt became the spec

- One spec, a set of three sounds (`sounds`), each with its class, its variants made from the same layers
  with another seed and pitch: `cbar_hit1` and `cbar_hit2`, `cbar_hitbod1` to `3`, `cbar_miss1`. The names are
  the crowbar's, which the game's code plays (research/sound-generation.md, 2.4): put in `valve/sound` (or a
  mod's), they play in its place with no code.
- The wall hit: a click of high-passed noise, a ring of a free bar's modes from 780 Hz, a rasp of band-passed
  noise held 40 ms, a low thud; saturated and given a short room. The body hit: a thud of low-passed noise
  held 80 ms, a falling tone from 120 to 60 Hz, a slap of band-passed noise. The miss: pink noise swept
  through a band from 180 to 420 Hz under a swell, peaking at -9 dBFS as the game's quiet swing does.

## Iterations

1. Built from the research's recipes: the hits too pure and spiky (flatness 0.01, crest 14 dB), the body hits
   too dark (centroid 113 Hz, 97% of their power under 150 Hz), the miss too bright. Each line of the report
   said which way to go.
2. Five passes by the report's numbers alone: noise held in the hits (`hold`), harder saturation, a louder
   brighter slap; then back where a step had gone too far (saturation adds bright harmonics; white noise
   made the miss bright). The second hit died in 0.21 s, under the rubric's 0.3: a longer ring, a smaller
   pitch for the variant.
3. The picture showed what no number had: a stripe down the hits' spectrograms near their end, a click. A
   layer's ring was cut off while it still rang (it decays over 0.9 s, its layer lasted the sound's default
   0.6). The kit now fades every layer's end and gives a layer the length its own envelope takes to die (a
   test in `test/47-audio.mjs`).

