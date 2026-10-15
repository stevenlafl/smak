The sound is built and the build says OK: `work:sound/doors/doormove1.wav`, 11025 Hz, 8-bit mono, 5.04 s. Copy it to `<mod>/sound/doors/` so the game plays it in place of the original.

I could not check it against the original. No game folders were given to the build, so its reference comparison was empty, and I have not heard either file. The numbers below are from the build's own report.

**What it's made of**

| Layer | What it does |
| --- | --- |
| Generated grind (`doormove_s0.wav`, seed 0) | The main body: gritty friction and rumble, band-limited to 180 Hz to 3.5 kHz, with a mid lift around 400 Hz |
| Pink noise | Keeps the 200 Hz to 1.5 kHz band dense and rolls off the top |
| Rattle (particles, 200 Hz to 1.5 kHz) | The shudder at about 4.1 s, over 0.6 s |
| 70 Hz sine | The low rumble under 150 Hz, rising at the end |
| Four squeals (300 to 600 Hz sweeps) | At 0.3, 1.5, 2.8 and 3.9 s, each 1 s long, bell-shaped |

The envelope fades in over about 0.1 s, holds a medium level, swells at 4.1 s, and tapers to silence by 4.9 s. The spectrogram shows the four squeal arcs at the right times.

**Measured by the build**

- Energy split: 17% under 150 Hz, 57% from 150 to 600 Hz, 21% from 600 Hz to 2 kHz, 5% from 2 to 5 kHz.
- Centroid 590 Hz. The build's checker says it is too bright for its game-sound ranges, but those ranges are for other sounds, so I left it.
- Peak -0.6 dBFS, crest 11.9 dB. No clipping, offset or end click.

**Things to know**

- **Licence:** the grind layer comes from a generated take by woosh-dflow. Its weights are CC-BY-NC 4.0 (Creative Commons, non-commercial), so the sound may not be sold as is. Tell me if that matters for this project and I'll rebuild without it.
- **Not yet matched against the original:** I could not confirm the original's exact spectrum, length or envelope. If you give me the game's folder, or a copy of the original, I can run the build's side-by-side comparison and tune against it.
- **Dependency:** the spec reads `work:gen/doormove_s0.wav`. Rebuilding on a fresh machine needs that take regenerated first (same prompt, seed 0).
