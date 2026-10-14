The new `weapons/sbarrel1.wav` (the double-barrel shotgun shot) is built and the build says OK. It's 1.04 s long, 22050 Hz, 8-bit mono and plays once, the same as the original. All 22 of its measured features fall inside the range of the game's own gunshot sounds, and the build found no engine faults.

How it compares with the original's pictures:
- **Envelope:** both start at full level with no gap. The blast stays clipped hard for about the first 0.3 s, then dies away to near silence by about 0.8 s. It drops 20 dB in 0.61 s and 40 dB in 0.89 s.
- **Spectrum:** broadband like the original, with a heavy low end. The midrange and highs are full through the blast and darken in the tail. Its brightness centre is 781 Hz.

| Band | Share of power |
| --- | --- |
| under 150 Hz | 42.8% |
| 150 to 600 Hz | 24.2% |
| 600 Hz to 2 kHz | 21% |
| 2 to 5 kHz | 9.5% |
| over 5 kHz | 2.5% |

- **Character:** the sound is layered. There's a sharp crack, a mid-band noise blast and a falling low boom with rumble under it. A short ring adds a bit of tone, and a burst of crackle gives the dense streaks seen in the original. Heavy saturation and a short room tail finish it.

It took five builds. The first was too dark and the second too bright and noisy. On the third and fourth, the ring and the room tail stretched the file to 1.07 s. The fifth trimmed it back to 1.04 s and brought the low end into range.

The checks can't tell how it sounds, only how it measures. They also can't tell how the game plays it: its volume, its pitch, or the room effect the map adds. Listen to it in the game. The file is at `work:sound/weapons/sbarrel1.wav`; put it in `<mod>/sound/weapons/` and it replaces the original.
