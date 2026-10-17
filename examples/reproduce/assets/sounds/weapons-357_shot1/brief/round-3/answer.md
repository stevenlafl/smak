The sound is built and the build says OK with every check passed. The file is at `work:sound/weapons/357_shot1.wav`. Copy it to the mod's `sound/weapons/` folder and it replaces the game's `weapons/357_shot1.wav` with no code. I have not heard it, and the checks can't say whether it is as good as the game's shot. That judgment is theirs, in the game.

**What I made**

- **Source:** I generated four takes with the local `woosh-dflow` model from the caption "a large magnum revolver firing one loud gunshot, sharp crack, close-miked, dry". Take 0 had the cleanest hit at the very start, so I used it. The other three were quieter or started late.
- **Licence:** `woosh-dflow` is under CC-BY-NC 4.0 (Creative Commons Attribution, non-commercial). You said the test accepts this, so the sound is non-commercial only. The build report notes it, and it is the mod's call whether that is acceptable for a release.
- **Shaping:** the spec is a sample layer from the take's onset, with a 1.2 s length and a decay envelope. It goes through a 6 kHz low-pass and a 60 Hz high-pass. A short sine body sweeps from 130 Hz down to 45 Hz at −22 dB, which gives the low thump. The finish adds a small room, a saturation of 3, and a limiter with a 9 dB crest, with the peak at −0.5 dBFS.

**How it measures**

The output is 22050 Hz, 16-bit, mono, 1.2 s long. Its T20 (time to fall 20 dB) is 0.63 s and its centroid is 969 Hz. Against the game's gunshot sounds, all 22 features are in range. The build flagged no faults.

**What isn't checked**

The volume and pitch the game gives it, the map's room, and how it sits in the mix all depend on the game. Listen to it in place of the original before deciding.

If it sounds wrong, the easiest knobs are the body gain (−22 dB now, so a louder thump needs a smaller number) and the low-pass frequency.
