The sound is built and the build says **OK**, at `work:sound/player/pl_metal1.wav`. It is 22050 Hz, 16-bit, mono, 0.65 s long. To use it, copy it to `<mod>/sound/player/pl_metal1.wav`. The game then plays it in place of its own footstep, with no code.

**What it is:** I generated six takes from the local `woosh-dflow` model with the prompt "a light footstep on a thin metal vent grate, one hollow tinny tap, close-miked, dry". I picked take 1 because it is a single clean hit with a bright, tinny character. It is then trimmed to start at the hit, high-passed at 200 Hz, low-passed at 1400 Hz, with a dip around 900 Hz to take the boxiness out, given a short room, and limited to -1 dBFS peak. The class was set to `step vent`, which is the game's class for vent steps.

**Licence:** the take comes from `woosh-dflow`, licence CC-BY-NC 4.0 (Creative Commons Attribution, non-commercial). That covers the weights, and the code is MIT. The non-commercial limit applies to the mod if it is ever released commercially. You accepted that for this test. The other local model, `stable-audio-3-sfx`, was also tried, and its takes were darker, around 350 to 440 Hz centroid, so I did not use them.

**What the build still warns about:**
- **Decay:** it falls 20 dB in 0.32 s. The game's vent steps take at least 0.44 s. This is the main gap, and it is the one most likely to be heard as dry.
- **Brightness:** its centre of energy is 860 Hz. The game's step-vent sounds sit at 136 to 336 Hz. The vent tap is meant to be brighter, so I did not push it fully into the game's range. Lowering it further would make it sound less tinny.
- **Bass:** it has no energy under 150 Hz, which is the thud the game's steps have.

I stopped after three builds, since further tries made the tail ring and lost the tap. The build checks cannot say how it sounds. Please listen in the game, and compare it to the original in a few places. If it is too dry, the next step is a longer tail. If it is too bright, a lower low-pass cut will fix it.
