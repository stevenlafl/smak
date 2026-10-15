The sound is built and the build says OK: `work:sound/weapons/cbar_hit1.wav`, 11025 Hz, 8-bit mono, 0.69 s, peak -0.6 dBFS. The kit's check found all 22 of its features in the range of the game's own metal-hit sounds. Nothing is clipped, offset, or clicking at the end.

The spec is built from five layers and a finish:

- **Crack:** white noise high-passed at 1.5 kHz and low-passed at 4 kHz, decaying in about 6 ms, for the sharp broadband onset.
- **Body:** noise shaped by its spectrum, which moves across three points. It is full level until 0.30 s, drops to about a third (-10 dB) at 0.31 s, then falls to -60 dB at the end.
- **Chatter:** short random particles between 200 and 2000 Hz, every 11 ms with jitter, sounding only inside the first 0.3 s for the rough, chattering stretch.
- **Hiss:** white noise above 3 kHz, fading with the body.
- **Ring:** constant-pitch modes at 1 kHz (main) and 3 kHz (fainter), which become the main thing left in the tail.
- **Finish:** a mild saturation of 1.5, and a limiter at 8 dB crest (the class's 6 to 10 range for weapons).

Where I had to choose:

- **Low mids are lighter than your description.** You asked for the energy to be heaviest at 100 to 600 Hz. The game's metal hits carry only about 0 to 17% of their power there, and my first builds at the heavier setting were flagged as over range. I kept the low mids at about 5% so it matches the game's class. If you want it heavier, that is a deliberate trade against the class check.
- **The check compares against the class's ranges, not the original file.** I only have your description, not the waveform, so the side-by-side comparison will be where it actually counts. I have not listened to it, and the kit cannot judge how it plays in the game's volume or room. Please listen in the game.

Iteration took five builds. The first was too bright and too noisy, the next too strong in the 150 to 600 Hz band, and the last one only missed flatness by a hair before the hiss level was nudged. The spec lives in this conversation only, since I have no way to write it into the work folder; say if you want it saved as a file.
