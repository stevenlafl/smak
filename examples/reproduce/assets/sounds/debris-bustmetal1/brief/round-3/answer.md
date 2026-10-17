The sound is built and the build says OK. It's at `work:sound/debris/bustmetal1.wav`, and it takes the place of the game's `debris/bustmetal1.wav` when placed in the mod's `sound/` folder. Nothing has been checked by ear in the game yet.

**What I made**

- **Source:** I generated four takes with the local `woosh-dflow` model from the caption "a metal crate breaking apart, sheet metal cracking and clattering, close-miked, dry". I picked take 0 because it has a clean crack at its start.
- **Shaping:** The sound is 0.53 s long at 22050 Hz, mono, 16-bit, peaking at -0.5 dBFS.
  - The take is cut from its first hit, with a short envelope so the loudest part is at the start.
  - It is high-passed at 300 Hz and low-passed at 2200 Hz, with a small boost around 1.2 kHz for the metal body.
  - A short burst of particles adds rattle, and a short high-passed noise crack is added after the limiter for the initial snap.
  - The finish saturates the sound, then limits its crest to 11 dB.
- **Checks:** Against the game's metal-hit sounds, it passes 21 of 22 measures. The one still off is flatness (how much of it is noise rather than tone): 0.07, where the game's range is 0.16 to 0.28. I tried to close that gap by adding more noise, but it pushed the brightness and loudness measures out of range, so I stopped there.

**Licence:** `woosh-dflow` is CC-BY-NC 4.0 (weights), which is non-commercial. You said that's acceptable for this test, so I've used it. If the mod is ever released commercially, this take would need replacing.

**What the build could not check**

- The game's own `debris/bustmetal1.wav` was not in the folders the server was given, so I had no side-by-side comparison.
- Volume, pitch as the game plays it, and the map's room are not measured. Those decide how it compares in play.

To test it, copy the file to `<mod>/sound/debris/bustmetal1.wav` and break a metal object in the game, next to the original if you can switch between them.
