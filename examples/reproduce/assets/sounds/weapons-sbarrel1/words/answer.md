The sound is built and passes: `weapons/sbarrel1.wav` is at `work:sound/weapons/sbarrel1.wav`, and the build says OK. It drops in as the game's own file of that name when placed in `<mod>/sound`.

The final build's measures against the original's description:

| Feature | Original (described) | Built |
| --- | --- | --- |
| Length | 1.04 s | 1.04 s |
| Format | 22050 Hz, 8-bit, mono | 22050 Hz, 8-bit, mono |
| Under 150 Hz | 35% | 36.8% |
| 150 to 600 Hz | 30% | 31.2% |
| 600 to 2000 Hz | 20% | 18.2% |
| 2000 to 5000 Hz | 10% | 9.9% |
| Over 5000 Hz | 5% | 3.9% |
| Fall from full level (T20) | steep by 0.6 s | 0.66 s |
| Class check | n/a | 22 of 22 features in the gunshot range |

How it is made, all from layers, with no recording:
- **Opening:** a 3 ms high-passed noise crack at 0 s, and a second, slightly quieter crack at 0.03 s for the second barrel.
- **Blast:** broadband noise, driven hard, held at full level to 0.4 s, then falling to -26 dB at 0.6 s and to silence by 1.04 s. Its spectrum sits lowest at the bottom and loses its highs first.
- **Thump:** a sine that falls from 140 Hz to 45 Hz, adding the tone the flatness check needed.
- **Tail:** 400 particles in the 100 to 900 Hz band, starting at 0.3 s and fading out with the blast.
- **Finish:** saturation of 3, a limiter at an 8 dB crest, and a peak of -0.5 dBFS.

Things to know:
- **8-bit hiss:** the build warns that 8-bit adds a hiss under the quiet tail. I kept 8-bit because the facts you gave say so. If the hiss sounds wrong side by side, 16-bit is the fix and the game plays either.
- **Not checked by ear:** the build measures the file, not how it sounds or plays. Its volume in the game, and the room the map adds, are for you to listen to.
- **Licences:** no generated recording is used, so nothing non-commercial is in this file.
- **Spec:** the spec was passed inline and not saved as a file in the work folder. If you want it kept for re-running, I can write it out as a `.json` next to the sound.
