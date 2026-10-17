The sound is built and the check passes: `work:sound/weapons/sbarrel1.wav`, ready to go in the mod's `sound/weapons/` folder so it replaces the game's `sbarrel1.wav`.

**What it is:** a single shotgun blast, 1.0 s long, 22050 Hz 16-bit mono (the format GoldSrc expects). It has no pump racking clack. In the game that clack is a separate sound, so this file covers the shot only.

**How I made it:**
- I generated four takes from the local `stable-audio-3-sfx` model with the caption "a pump action shotgun firing, one loud blast with a short metallic echo, close-miked, dry". I picked seed 0 because its hit lands right at the start, so the shot doesn't play late.
- The spec uses that take as a `sample` layer, trimmed to 1 s and given a short decay. It also has a low sine "body" that falls from 100 Hz to 50 Hz, for weight. A notch at 330 Hz tames the muddy middle.
- The finish adds a short room (0.25 s, 12% wet), saturation of 3, and a limiter at a 9 dB crest, which keeps the shot punchy without clipping.
- The first builds failed in two ways: a DC offset, and a sound that was too short or too bass-heavy. Each was fixed by changing the layers, not by ignoring the report. The final build is OK, and all 22 of its measured features are in the range of the game's own gunshot sounds.

**Licences:** the chosen take is from Stability AI's model. Its licence is free for organisations under US$1M annual revenue and needs an enterprise licence above that. The other model (`woosh-dflow`) is CC-BY-NC, which is non-commercial. I didn't use it, so the non-commercial question doesn't apply to this file.

**What the check can't tell:** how it sounds, and how the game plays it (its volume, pitch, and the map's room). Those need an ear in the game. The build measures the file, not the likeness to the original. If the modder wants a bigger or drier shot, the levers are the `body` gain, the `room` wet amount, and the limiter's crest.

The spec was passed inline to the build and isn't saved as a file in the work folder. If the modder wants to regenerate the sound later, I can save it.
