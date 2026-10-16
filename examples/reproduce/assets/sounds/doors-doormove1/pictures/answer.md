The sound is built and the build says OK, but it is not as close to the original as I wanted. The waveform's loudest point sits near 3 s, not at the original's 4.435 s, and I could not get it there.

The file is `work:sound/doors/doormove1.wav` on the server's work folder, 11025 Hz, 5.00 s, mono. Its name keeps the game's path, so it takes the place of the original in the game.

| Measure | Original | Made |
| --- | --- | --- |
| Length | 5.04 s | 5.00 s |
| Rate | 11025 Hz, 8-bit | 11025 Hz, 16-bit |
| Power under 150 Hz | 30% | 34% |
| Power 150-600 Hz | 38% | 36% |
| Power 600 Hz-2 kHz | 28% | 28% |
| Power 2-5 kHz | 4% | 2% |
| Power over 5 kHz | 0% | 0% |
| Centroid | 589 Hz | 491 Hz |
| Hits | 7 | 7 |
| Loudest point | 4.435 s | near 3 s |

Choices I made:

- **Texture:** a generated take (woosh-dflow seed 2) of "a heavy old metal sliding door rolling along its track…", with a high-pass at 60 Hz, a lowpass at 2.5 kHz and three peak filters to set the bands.
- **Envelope:** the take's level rises to 0 dB at 4.435 s and falls 20 dB by 4.9 s, which is the original's 0.46 s decay.
- **Hits:** seven short clacks at 1.5, 2.8, 3.6, 4.05, 4.2, 4.3 and 4.4 s. I placed these by eye from the picture, so their timing is approximate.
- **Bit depth:** 16-bit, not the original's 8-bit. The build warns that 8-bit adds hiss under quiet tails. Say if you want 8-bit to match the original format exactly.

What is still off:

- **Loudest point:** the envelope puts the peak at 4.435 s, but the built sound's own burst near 3 s stays louder. Lowering the envelope there emptied the body of the sound, so I kept the body and accepted the mismatch.
- **Decay:** the report's T20 (time to fall 20 dB) reads 1.15 s, against the original's 0.46 s. My envelope gives 0.46 s from the peak, so I think the report measures from the burst near 3 s, but I did not confirm that.
- **Picture check:** the build could not read the original's picture because it sits outside the work folder, so I used the numbers I read off it. The build's report does not compare against the picture.
- **Warnings:** the seven clacks are noise layers over the take. The build warns that steady noise over a take sounds like static. These are short transients, not steady noise, but the build still raises the warning.

Licence: the take was made by woosh-dflow, whose weights are CC-BY-NC 4.0 (non-commercial). You said that is accepted for this test. Any use beyond the test needs that licence checked.

The spec is not saved as a file. I have no file-writing tool in this session, so the spec exists only in this chat. Someone rebuilding it needs the JSON from the last build call and the take at `work:gen/doormove_s2.wav`.
