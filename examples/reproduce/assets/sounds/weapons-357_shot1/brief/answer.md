The sound is made and passes the build with every check OK: `work:sound/weapons/357_shot1.wav`. It is 0.9 s, 22050 Hz, 16-bit mono, peak -0.5 dBFS. To use it, put it at `<mod>/sound/weapons/357_shot1.wav`, and the game plays it in place of its own shot with no code.

**What it is:** a generated take of a revolver shot, from the local model stable-audio-3-sfx (seed 0, prompt "a heavy revolver firing, one sharp loud gunshot with a short metallic crack and a deep low boom tail, outdoors"). I cut it to start at the shot's onset, then:
- a highpass at 120 Hz to take out the low rumble,
- a +6 dB peak at 1.8 kHz for the crack,
- a saturation of 2 and a limiter (crest 8 dB, the level Valve's weapons sit at), peak at -0.5 dBFS.

**How I chose it:** I compared 8 takes from two models. The first pass had too much bass and too little 600 Hz to 2 kHz energy, so the build warned on the spectrum. After the filter, all 22 measured features fall in the range of the game's gunshot sounds.

**Things to know:**
- **Licence:** stable-audio-3-sfx is under the Stability AI Community Licence. It is free for an organisation under US$1M annual revenue, and needs an enterprise licence above that. The other model (woosh-dflow) is CC-BY-NC, so I did not use it. You said you accept the local generators' licences for this test; if the mod is ever sold, check this one first.
- **Not verified:** the build cannot say how it sounds, nor how it plays in the game (volume, the map's room). The modder should A/B it against `weapons/357_shot1.wav` in the game. I also could not compare against the game's own file, because no game folders were given to the tool, so the "in range" result is against the game's shot sounds in general.
