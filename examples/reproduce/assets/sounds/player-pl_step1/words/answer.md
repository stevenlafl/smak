The sound is built at `work:sound/player/pl_step1.wav`, and the build says OK with every check passed. It is a single footstep: a heel strike with clicks, a softer toe tap at 90 ms, and a gritty tail that fades out with no ringing.

I used the `step concrete` class. The take came from a local generator (woosh-dflow, CC-BY-NC 4.0 weights). You said that licence is fine for this test, but it is non-commercial, so it would need replacing before any commercial use.

| Measure | Original (your description) | Built file |
| --- | --- | --- |
| Length | 0.27 s | 0.27 s |
| Format | 11025 Hz, 8-bit mono | 11025 Hz, 8-bit mono |
| Under 150 Hz | 20% | 18% |
| 150 to 600 Hz | 45% | 44% |
| 600 to 2000 Hz | 25% | 25% |
| 2000 to 5000 Hz | 10% | 12% |
| Over 5000 Hz | about 0 | 0.1% |
| Second tap level | about 20% of peak | about 22% (-13 dB) |
| Flatness (0 tone, 1 noise) | noisy, not tonal | 0.21, inside the class range |
| Centroid (brightness) | not given | 879 Hz, inside the class range |

Things to know:
- **Build warnings:** the 8-bit hiss warning is expected, since you asked for 8-bit. The second warning says noise layers sit over a recorded take. Those layers are short clicks (8 to 12 ms decays), not steady noise, so they should not be heard as static, but it is worth a listen in the game.
- **Not checked here:** how it sounds to a person and how the game mixes it. The numbers match your description, but you should listen to it in the game before judging it.
- **Placement:** it goes in `<mod>/sound/player/pl_step1.wav`, where it replaces the game's file of that name.

The spec is not saved to a file. I wrote it inline in each build call, and the last one is the final version. If you want it kept, I can save it to the work folder.
