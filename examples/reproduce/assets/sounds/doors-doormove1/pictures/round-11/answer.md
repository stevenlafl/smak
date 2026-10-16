The sound is built and the build says **OK**, with no warnings left. It's written as `doors/doormove1.wav` in the server's work folder (`sound/doors/doormove1.wav`), so it takes the place of the game's file of that name.

**How it's made**

- **Source:** one take from the local generator `woosh-dflow` (seed 0), prompted as an electric sliding door motor with a rumble, then ratchet clicks as it reaches the stop. Its licence is CC-BY-NC 4.0 (non-commercial). You accepted that for this test; it would need a different take for a commercial release.
- **Motor body:** the take, low-passed at 2.3 kHz, held to 3.9 s and decayed over 0.6 s.
- **Sub-bass:** a second copy of the take, low-passed at 200 Hz, +1 dB, so the energy below 150 Hz matches the original's share.
- **Ratchet:** a train of clicks every 0.1 s (jitter 25%), band 900 to 3000 Hz, starting at 4.0 s and running to the end of the file.
- **Finish:** saturation at 1.5, a limiter at 12 dB crest, peak at -0.5 dBFS.

**Measured against the original's picture**

| Feature | Original (from picture) | Ours |
| --- | --- | --- |
| Length | 5.04 s | 5.02 s |
| Centroid (brightness) | 589 Hz | 534 Hz (9% off, within the 15% aim) |
| Power under 150 Hz | about 30% | 26% |
| Band error (worst) | | 3.9 points (aim within 7) |
| Crest | about 12.7 dB | 12 dB |
| Onsets | 4 to 7 | 4 |

**Where it differs from the original**

- **Bit depth:** I made it 16-bit at the original's 11025 Hz, not 8-bit. The build warns that 8-bit adds hiss under the quiet tail, and the spec says a copy is not held to the original's depth. If you want the exact 8-bit character, it's a one-line change (`bits: 8`) and the build will warn again.
- **Comparison method:** the original wasn't in the game folders the server can read, so I compared against numbers read off the picture, not the original file. Those numbers are approximate.
- **Not checked by ear:** the build can't judge how it sounds to a person or how the game mixes it. Listen to it in the game before you call it done.
- **Class:** the spec has no door class, so I scored it against `loop machine`, the closest one.

The spec was passed inline and isn't saved to a file in the project. If you want it kept for re-running, I can write it out.
