The sound is built and the build says OK: `weapons/sbarrel1.wav` is at `work:sound/weapons/sbarrel1.wav`. It is 22050 Hz, 8-bit, mono, 1.04 s long, and the report marks it 22 of 22 against the game's gunshot sounds, with every feature in range. It goes in `<mod>/sound/weapons/` to replace the game's file.

Limits of what I checked:
- No reference file was supplied, so the comparison is against the range of the game's gunshot sounds, not against the original waveform. I could not hear it or hear it in the game. Please listen beside the original.
- The "crackle" on the first quarter-second comes from a drive of 5 on the boom layer. Drive is sensitive: at 4 the decay was too short, and at 6 it was too long. The 5 setting sits in the middle, so it's the one to keep.

What the final build does, against your description:
- **Attack:** instant (0 ms onset), with a boom from noise shaped to 50 to 500 Hz and highs reaching about 10 kHz early on. The highs fall away by about 0.3 s.
- **Body:** the envelope holds near full level to about 0.3 s, then falls steadily to -12 dB at 0.6 s and -22 dB at 1.0 s.
- **Thump:** a sine falling from 110 Hz to 45 Hz, at -14 dB.
- **Pops:** five faint pops in the first 0.3 s, plus a ragged burst of echo from 0.3 s.
- **Tail:** brown noise low-passed at 300 Hz from 0.5 s to the end.
- **Crack:** a short high-passed noise burst (2 kHz and up), added after the limiter.
- **Finish:** a limiter at 8 dB crest (peak over RMS), with the peak set to -0.5 dBFS.

Spectral and decay numbers from the final report: centroid 708 Hz, flatness 0.099 (not a tone), T20 0.963 s (range 0.46 to 1.01 s), and power split 29% under 150 Hz, 41% 150 to 600 Hz, 21% 600 Hz to 2 kHz, 7% 2 to 5 kHz, 2% above 5 kHz.

The spec exists only in this conversation; it is not saved as a file in the work folder. Say if you want it saved next to the sound.
