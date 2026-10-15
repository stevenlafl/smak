The sound is built and the build says OK: `work:sound/weapons/357_shot1.wav`, 22050 Hz, 8-bit mono, 1.08 s long (the 1.06 s target, 2% over), peak -0.6 dBFS.

I built it from layers, so it has no recorded source. The layers are:
- **Click:** a 2 kHz high-passed noise crack at t=0 that is added after the saturation, so it stays a sharp onset.
- **Blast:** broadband noise from 4 ms, with a spectrum that darkens over time. Its level holds from 0.004 s to 0.4 s, then falls to -50 dB by the end.
- **Boom:** a sine that sweeps from 110 Hz down to 45 Hz for the low punch.
- **Rumble:** brown noise, low-passed at 500 Hz, that swells around 0.35 s and fades out by the end.
- **Finish:** a 5x saturation for the clipped wall, a limiter at a 7 dB crest, and a short room tail (0.08 s).

The report puts all 22 of its measured features in the gunshot range. Its T20 (time to fall 20 dB) is 0.98 s, its centroid is 942 Hz, and its 600 Hz to 2 kHz band is 25%.

Things to know:
- **No game reference.** No game folder was given to the server, so the sound was not measured against the original `357_shot1.wav`. The check was only against the class ranges and your description. For a true side-by-side, give the server the game folder and I'll rebuild against the real file.
- **Not heard.** The report cannot say how it sounds or how loud it plays in the game. Listen to it in the game before judging it.
- **Choices I made:** the rumble's exact envelope, the blast's spectrum curve, and the room settings were my own picks from your description, so they are the first things to adjust if it sounds off.
