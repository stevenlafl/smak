The sound is built and saved as `work:sound/weapons/cbar_hit1.wav`. The build says OK. It is a 0.69 s, 11025 Hz, 8-bit mono file under the game's own name, so it replaces the crowbar hit when put in the mod's `sound` folder. I could not listen to it or put it beside the original, because no game files were on this machine. Your side-by-side judgement is still the real test.

I used no generated takes, so no licence applies. The whole sound is made from layers: a click at contact, a noise body with a steep tilt that holds the attack, a faint 1.1 kHz sine ring with two partials near 320 and 430 Hz, a grainy rattle and hiss, and a limiter at 8 dB crest.

| Measure | Target from the description | Built |
| --- | --- | --- |
| Length | 0.69 s | 0.69 s |
| Attack | instant | 0 ms |
| Time to -20 dB | about 0.5 to 0.6 s | 0.59 s |
| Under 150 Hz | 20% | 18.6% |
| 150 to 600 Hz | 35% | 34.2% |
| 600 to 2k Hz | 30% | 32.4% |
| 2k to 5k Hz | 13% | 14.5% |
| Over 5k Hz | 2% | 0.3% |

Choices I made:
- **8-bit kept:** the build warns that 8 bits adds hiss under the tail. I kept it because the original is 8-bit and its hiss is part of the character.
- **Centroid left dark:** the build measures the centroid at about 982 Hz and says it is below its metal-hit range of 1074 to 1654 Hz. I followed your band shares rather than that range. If the original is brighter than your shares suggest, the band numbers are what to revisit.
- **Ring audible but not dominant:** the 1.1 kHz line is steady across the spectrogram and sits above the body's tail, but it carries little power.

The spec was passed inline and I have no file-writing tool here, so it is not saved to disk. If you want it kept for re-building, I can write it into the work folder.
