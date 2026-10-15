The build says OK: `work:sound/weapons/explode3.wav`, 22050 Hz, 8-bit mono, 1.3 s, peak -0.6 dBFS. It is written to the work folder's `sound/` path, so it takes the place of the game's own file when it is put in `<mod>/sound`.

**What I matched to the picture**
- **Length:** 1.3 s exactly, as the original.
- **Envelope:** a loud blast at the start, falling over about 0.9 s, with a faint tail to the end. T20 is 0.85 s; the picture's own range is 0.67 to 1.11 s.
- **Spectrum:** most energy below 2 kHz, little above 5 kHz, with a centroid of 654 Hz against the picture's 605 Hz (8% off).
- **Class:** all 22 of the report's features fall in the range of the game's own explosion sounds.

**How it is built**
- A low sine boom with a falling sweep (70 to 35 Hz), kept quiet so it does not dominate.
- A noise blast shaped by a spectrum curve, with the loud body fading over about 1 s.
- A short white-noise crack at the onset, high-passed at 1.8 kHz.
- A brown-noise rumble, low-passed at 400 Hz, starting at 0.1 s.
- A saturation of 2.5 and a limiter at crest 8 dB. I left out the room, because it extended the tail past 1.3 s.

**What I could not check**
- I never had the original `.wav`. The only inputs were `sound.png` (the waveform and spectrogram) and `facts.txt` (length, rate and bits), so the comparison is against the picture and the game's class ranges, not sample by sample.
- How it sounds to a person, its volume in the game, and the map's room are not measured. Those need a listen in the game.

The spec was passed inline and is not saved to a file. I can save it beside the sound if you want it kept for rebuilding.
