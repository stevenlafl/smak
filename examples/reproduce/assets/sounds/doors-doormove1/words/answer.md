The sound is built and the build says OK: `work:sound/doors/doormove1.wav`, 11025 Hz, 8-bit mono, 5.04 s, played once. It goes into `<mod>/sound/doors/` to replace the game's file of that name.

I could not compare it with the original. No game folder was given, so the report drew no reference beside it, and I have not listened to it. The figures below are what the build measured.

| Feature (from your description) | What the build made |
| --- | --- |
| Length 5.04 s, 11025 Hz, 8-bit | 5.04 s, 11025 Hz, 8-bit mono |
| Fast fade-in to a steady level | Body fades in over 0.1 s; no initial hit (onsets: 1) |
| Steady body 0.1 to 4.0 s, grainy | Broadband noise, held level |
| Swell at 4.1 s, rattling about 0.5 s | Loudest section, with a 25 Hz particle flutter from 4.1 to 4.6 s |
| Taper to silence by 4.9 s | Fades out 4.9 to 5.04 s |
| Firm rumble under 150 Hz | Brown noise low-passed at 150 Hz, at a lower level than the body |
| Energy densest 200 Hz to 1.5 kHz, dull top | Shaped noise, 600 to 2k Hz at 40% of power, above 5 kHz at 0% |
| Squeals rising 300 to 600 Hz, about 1 s each, at 0.3, 1.5, 2.8, 3.9 s | Four rising sweeps at those times, band-passed around 450 Hz |

The spectrogram shows the four squeal arcs at the right times. The fade-in and the swell are in the envelope. The build reports a crest of 11 dB and an RMS of -11.6 dBFS.

Two of the build's complaints are about the class I chose, not the sound. I used `loop machine` because the kit has no door class. Its length and centroid ranges come from looping machines, so "too long" and "too bright" do not apply to a one-shot door. The flatness complaint asks for more tone. I kept the noise-dominant texture you described, with the tonal squeals as the only tone.

The spec is inline in my build calls and nothing was saved beside the work file. If you want to tune it, the next steps are to listen in the game and, if the game folder is available, rebuild with `reference: "doors/doormove1.wav"` so the report draws the original beside it.
