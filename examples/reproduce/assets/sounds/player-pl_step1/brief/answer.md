The footstep is built as `work:sound/player/pl_step1.wav`. The build says OK, and the spectrum check is 20 of 22 against the game's own concrete steps. It is not a finished sound yet, so the modder needs to listen before trusting it.

**What I made**

- **Source take:** a generated sound from the local `stable-audio-3-sfx` model, seed 3 of 4 tries. I sent this caption: "a single leather boot footstep on a concrete floor, one short thud, close-miked, dry", with a 1 second length. I picked seed 3 because its body was less boomy than seed 0.
- **Shaping:** the take is cut to its first hit and held to 0.3 seconds. It has a 180 Hz high-pass, two cuts at 300 Hz and 480 Hz to thin the boom, and a high shelf at 1.5 kHz (+3 dB) to brighten it. A short band of grit at 900 to 4000 Hz adds the scrape of a step, and a 1 to 3 ms noise crack adds the onset. It has a little room reverb, and the peak is limited to -0.5 dBFS.
- **Format:** 22050 Hz, 16-bit, mono, 0.24 seconds, 10 KB, which is what GoldSrc expects.

**What is still off**

- The spectrum check flags one thing still: the sound is more tonal than the game's steps (flatness 0.058 against 0.2 to 0.35). I could not close that without adding noise, which is heard as static. Ears should judge this, not the number.
- The check cannot tell how it sounds in the game, so the volume and how it sits in the mix are untested.

**Licence:** the take is from `stable-audio-3-sfx`, under the Stability AI Community Licence. It is free for an organisation under US$1M annual revenue and needs an enterprise licence above that. The test accepted this, but it matters if the mod is ever sold or used commercially.

**To test:** copy the file into the mod as `<mod>/sound/player/pl_step1.wav` and walk on concrete. It replaces the game's own step file for that name. The game's `pl_step2` to `pl_step4` are unchanged, so the walk will mix the new sound with the old ones. The spec made one file only, as asked. If the modder wants all four, I can make variants.
