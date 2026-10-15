The sound is built and checked: `work:sound/player/pl_step1.wav`, 11025 Hz, 8-bit mono, 0.27 s. The final build says OK, and all 22 of its features fall inside the range of the game's own `step concrete` sounds.

Measured against your description of the original:

| Feature | Original (your description) | Made sound |
| --- | --- | --- |
| Length | 0.27 s | 0.27 s |
| Attack | Instant, no fade-in | 0 ms |
| First hit | Loudest in the first 10 to 20 ms, a few jagged spikes | Heel burst at 0 ms with a crack layer and a scuff of 20 particles in 30 ms |
| Decay of first hit | About a fifth of peak (-14 dB) by 0.04 s | Envelope set to -14 dB at 0.04 s |
| Second tap | About 0.08 s, a quarter of the first (-12 dB), dies within 20 ms | Toe layer at 0.08 s, starts at -12 dB, gone by 0.035 s |
| Tail | Faint grit from 0.1 s, silent by 0.27 s | Low-level pink grit from 0.1 s, about -46 to -66 dB |
| Spectrum | Thump 150 to 400 Hz, moderate presence to 4 to 5 kHz | Thump tone 220 Hz sweeping to 110 Hz, heel shaped with the most energy at 60 to 400 Hz, presence falling by 5 kHz |
| Noise vs tone | Noise, no pitch | Mostly noise; tone only in the thump layers |
| Centroid (brightness) | Not given | 745 Hz |
| Flatness (0 tone, 1 noise) | Not given | 0.249 |

Choices I made where the description was open:
- **Class**: `step concrete`, since the description says concrete or tile.
- **Limiter**: crest 17 dB, in the 15 to 21 range the kit gives for steps.
- **No room**: the sound is dry, as described. The map's own `env_sound` will add any room.

Limits:
- I worked from the description only, not the original file, so this is measured against the words, not a side-by-side with the real `pl_step1.wav`. A side-by-side needs the original file in the work folder.
- I can't listen, so how it sounds, its volume and the mix are untested. Please check it in the game.
- The spec lives only in this conversation. It isn't saved to a file, so it isn't reproducible from the folder yet. I can save it as a script in the project if you want it kept.
