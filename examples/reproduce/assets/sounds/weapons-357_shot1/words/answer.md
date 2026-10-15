The sound is built and the build says OK: `work:sound/weapons/357_shot1.wav`, 22050 Hz, 8-bit mono, 1.06 s. It is 22 of 22 on the game's gunshot features, with no faults.

The layers, as the build reads them:

- **Click:** 4 ms of high-passed noise at 2 kHz at the very start. The blast starts at 8 ms, so there is a short near-silent gap between them.
- **Blast:** one noise layer, 1.05 s long. Its spectrum is weighted to the low end, 50 to 300 Hz, and it rolls off from there. Its envelope holds at full level to 0.42 s, then falls to -18 dB at 0.75 s and -40 dB at 1.0 s. It is driven hard and then saturated and limited to a 6 dB crest, which gives the clipped wall.
- **Tail:** the spectrum falls further from 0.45 s and again from 1.0 s, so the end is dark and low.

Measured: attack 10 ms, T20 0.74 s, T40 0.88 s, centroid 801 Hz, flatness 0.14, band power 31% under 150 Hz, 37% at 150 to 600 Hz, 21% at 600 Hz to 2 kHz, 8% at 2 to 5 kHz, 3% above 5 kHz.

Choices I made:
- I first added a sine boom that swept from 110 to 45 Hz for the low punch. It pulled the sound too far toward tone and pitch movement, which you said it should not have, so the final version is noise only.
- The seed is 7. The spec is only in this conversation, not saved in the project. If you want to regenerate it, I can save it as a `.json` file next to the sound.

I have not listened to it, and I have no copy of the original to compare it against directly. The 22 of 22 is against the game's own gunshot sounds, not against your description. The build cannot judge volume, how the game plays it, or the room. Please listen to it in the game, next to the original, before it goes into a mod.
