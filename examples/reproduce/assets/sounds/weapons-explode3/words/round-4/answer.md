The build says OK: `work:sound/weapons/explode3.wav` is 22050 Hz, 8-bit mono, 1.3 s, peak -0.6 dBFS. Against the game's explosion class, all 22 measured features are in range.

The original wasn't among the game folders the server had, so the comparison is against the class's measured ranges, not the original file itself. Listen to it in the game next to the original before you rely on it.

The spec is a single noise layer with a moving spectrum, plus a particles layer for the grit:

- **Envelope:** 0 dB at the start, -1 dB at 0.4 s, -10 dB at 0.8 s, -24 dB at 1.1 s, -40 dB at 1.3 s.
- **Spectrum:** low-weighted, falling from 0 dB under 100 Hz to -36 dB at 11 kHz. It darkens from 0.7 s on, falling about 8 dB further across the band.
- **Grit:** 400 per second of 2 ms particles in 400 to 1500 Hz, at -8 dB, decaying with the envelope.
- **Finish:** saturate 4, limiter at 7 dB crest, peak -0.5 dBFS.

Measured results:

- **Decay:** T20 1.08 s, T40 1.27 s.
- **Band power:** under 150 Hz 27%, 150 to 600 Hz 41%, 600 to 2 kHz 24%, 2 to 5 kHz 7%, above 5 kHz 1%.
- **Centroid and flatness:** 697 Hz centroid, flatness 0.086.

Two things I could not fully match:

- **Attack:** the tool reports 20 ms, though the waveform starts at full height. I did not confirm the first samples directly. The limiter or the particle grain may account for the reported figure.
- **Tonal content:** the description says no tone at all, and the class's flatness range asks for a little more pure-noise character than fully white. I followed the description and got flatness into range by tilting the spectrum, not by adding a tone.

The spec was passed inline, so no `.json` file was saved. I can write it into the work folder if you want it kept.
