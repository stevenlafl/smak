The drip loop is built and the build says OK with no warnings. It is at `work:sound/ambience/drips.wav`, and it goes in the mod's `sound/ambience/drips.wav` to replace the game's file. I have not heard it, so the mod's author needs to listen in the game to judge it against the original.

**What I made**

1. I generated four takes with the local sound model (woosh-dflow) from this caption: "water dripping slowly in a stone tunnel, single drops plinking into a puddle, echoing, sparse". The caption is mine, written from "a looping ambience of water dripping in a tunnel". Take 0 had the most separate drips, so I used it.
2. The take has a broadband hiss under the drips. I band-limited it with a high-pass at 620 Hz and a low-pass at 1300 Hz, which keeps the drip clicks and cuts the hiss.
3. The spec sets the class to `loop drips` and `loop: true`, so the engine loops it with a cue at the start.

**What the build reports**

- Format: 22050 Hz, 16-bit, mono. Length 4.75 s, peak -0.5 dBFS, RMS -25.4 dBFS (the game's drip loops sit at -30 to -24).
- Spectrum: centroid 950 Hz (the game's drips are 671 to 1007 Hz), 66% of the power in 600 Hz to 2 kHz, with no band off.
- Still off: the loop is 4.75 s, shorter than the game's drip loops (5.5 to 9.1 s), and it is smoother than the game's (flatness 0.003 against 0.05 to 0.15). I did not chase these further. The first was a 10 s attempt with two takes, but the two takes were too unequal in level, so I went back to one take.

**Licence:** the sound model's weights are CC-BY-NC 4.0 (Creative Commons, non-commercial). The file is fine for this test as you said, but it is not cleared for commercial use.
