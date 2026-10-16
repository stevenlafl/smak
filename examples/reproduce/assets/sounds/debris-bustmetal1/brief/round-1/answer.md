The build says OK. The file is `work:sound/debris/bustmetal1.wav`, and it goes in the mod at `<mod>/sound/debris/bustmetal1.wav`, where the game loads it in place of its own sound with no code change.

**What I made**

- **Source:** a generated take from the local model woosh-dflow, seed 0 of 4. I sent it this caption, since the person gave no words of their own: "a heavy sheet metal panel bending and breaking apart, sharp metallic crack then rattling clang and debris falling". Its licence is CC-BY-NC 4.0 (Creative Commons, non-commercial). You accepted that for this test, but it means the sound can't ship in a commercial mod without a different source.
- **Cut and shaped:** starts 0.62 s into the take (past its quiet lead-in) and runs 0.8 s. I added a fade-out envelope, a 300 Hz high-pass to remove rumble, a dip at 400 Hz, a lift at 1.4 kHz, a short room, and a limiter with a peak of -0.5 dBFS (decibels relative to full scale, so it doesn't clip).
- **Format:** 22050 Hz, 16-bit, mono, which is GoldSrc's standard.

**Measured against the game's metal hits**

- 19 of 22 measures are in the game's range.
- Two are still off: the 150–600 Hz band holds 31% (the game's metal hits hold about 0–17%), and the 600–2000 Hz band holds 46% (the game's hold about 64–84%). Flatness (how much of it is noise) is slightly too pure.
- The build gives these as warnings, not failures. The numbers only find faults, so the judgement is yours by ear in the game. Please listen to it there.

**Iterations**

Four builds before this one. The first version swelled for 0.75 s before its hit, so I started it at the hit. The second was too long and too dry, so I shortened it and added the room. The last ones were tuning the spectrum.
