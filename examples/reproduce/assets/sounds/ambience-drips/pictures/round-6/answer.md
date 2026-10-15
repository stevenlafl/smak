The drips loop is built and the build says OK, with every picture check passing. It's written to `work:sound/ambience/drips.wav`, which is `sound/ambience/drips.wav` under the work folder, and it takes the game's place when put in the mod's `sound` folder.

I could not hear it, and I could not open the original WAV. The render and read tools refuse that path and can't read WAV files, so every comparison is against the picture the kit drew of the original (`pictures/sound.png`), not the sample itself.

| Feature | Original (from picture) | Made | Note |
|---|---|---|---|
| Length | 7.31 s | 7.36 s | 1% over |
| Centroid (brightness centre) | 795 Hz | 827 Hz | 4% off |
| 150 Hz to 600 Hz power | 22.4% | 25.4% | within 3 points |
| 600 Hz to 2 kHz power | 74% | 73.5% | within 1 point |
| 2 kHz to 5 kHz power | 1.8% | 0.7% | within the 7-point target |
| Crest (peak over loudness) | about 24.9 dB | 23.7 dB | within 3 dB |
| Flatness (0 pure tone, 1 white noise) | not in the picture | 0.041 | below the game's drip range of 0.05 to 0.15 |

The sound is a pink bed with a splash at each of the four events in the picture (0, 1.87, 3.68 and 5.84 s), looped with its cue at the start, mono 11025 Hz 8-bit. The bed's spectrum is shaped to the picture's energy distribution.

Things you should know:
- **Flatness is the one miss against the game's drips.** I tried a faint hiss to raise it: it did nothing for flatness, pushed the loudness out of the game's range, and I reverted it. The picture doesn't give a flatness target, so I matched the picture.
- **It is made from layers, not a recording.** The kit says a real drip begins better from a generated take. I did not try one; that would be the next thing to test if the side-by-side sounds synthetic.
- **The spec is not saved to a file.** The Write tool is disabled in this session, so the final spec exists only in the last build call. Re-running that call reproduces the sound.
