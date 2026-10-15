The build says OK, and all 22 of 22 features are within the range of the game's own gunshots. The sound is written to `work:sound/weapons/sbarrel1.wav`, so it replaces the original when you put it in `<mod>/sound`.

| | Original (as described) | Mine |
|---|---|---|
| Format | 22050 Hz, 8-bit, mono, played once | 22050 Hz, 8-bit, mono |
| Length | 1.04 s | 1.054 s |
| Attack | instant, full scale in a few ms | 0 ms |
| T20 (time to fall 20 dB) | in the gunshot range, 0.46 to 1.01 s | 0.499 s |
| T40 (time to fall 40 dB) | not stated | 0.639 s |
| Centroid (spectral centre) | not stated | 567 Hz |
| Flatness (0 is a pure tone, 1 is white noise) | fully noisy, no pitch | 0.078 |
| Crest (peak over RMS) | not stated | 9.9 dB |

- **Spectrum:** power sits mostly low, with 47.8% under 150 Hz, 26.1% from 150 to 600 Hz and 19.7% from 600 Hz to 2 kHz. The highs are thin and die first, as in your description.
- **Envelope:** a clipped, crackling opening, a ragged fall from about 0.3 s to 0.6 s, then a low rumble that fades to silence.
- **Layers:** a hard-clipped low-passed noise burst, a moving-spectrum noise blast that darkens over time, a 110 to 50 Hz thump, a few faint echo pops, and a brown-noise rumble tail.

- **Length:** it runs 1.054 s against 1.04 s, about 1.3% long. The build reports it as within tolerance.
- **Not checked:** I had no original to compare against, so the comparison is to your description and the game's gunshot class. The build can't judge how it sounds or how the game plays it (volume, pitch, the map's room). That needs a listen in the game.
- **Source:** it is built from layers alone, not from a generated recording. A generated take might add more grain and room character, if the side-by-side shows it falls short.
