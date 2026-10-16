The sound is built and the build says OK with no warnings. It is at `work:sound/items/smallmedkit1.wav`, so it takes the place of the game's `items/smallmedkit1.wav` when it is put in a mod's `sound` folder.

I built it from layers only, with no generated take. The original reads as a synthetic buzz and blip, not a recording of a real thing, so layers seemed the right tool. I did not try a generated take to compare.

I could not listen to the original or hear the result. The only thing I could read of the original was its picture, so the match is by the numbers the build reads off that picture, not by ear. Final numbers, from the build's report:

| Measure | Original (from picture) | Made sound |
| --- | --- | --- |
| Length | 0.76 s | 0.76 s |
| Centroid | 1936 Hz | 1704 Hz (12% off) |
| 150-600 Hz share | about 14% | 17.7% |
| 600-2k Hz share | 64.4% | 66.5% |
| 2k-5k Hz share | 4.5% | 2.8% |
| Over 5k Hz share | 16.8% | 12.7% |
| T20 (time to -20 dB) | 0.41 to 0.683 s | 0.649 s |
| Crest | about 11.5 dB | 12 dB |
| Onsets | 1 | 1 |

The layers follow the picture's sections: a 630 Hz buzz in three pulses (about 0 to 0.27 s), two short clicks at the start of the second and third pulses, a small blip at 0.40 s, a low 180 Hz tail with a little hiss (0.27 to 0.52 s), and a broadband swell that rises to the end (0.52 to 0.76 s).

Choices you may want to change:
- **16-bit, not 8-bit.** The original is 8-bit. The guide warns that 8-bit adds a hiss under the quiet tail, so I kept 16-bit. The rate is the original's 22050 Hz. If you want the 8-bit grit, that is a one-field change, `bits: 8`, and the hiss warning will come back.
- **No class.** None of the built-in classes fits a medkit, so the sound is not held against the game's own sounds of a kind. It is measured against the picture only.
- **Licences.** No generator was used, so there is no non-commercial licence to flag.
