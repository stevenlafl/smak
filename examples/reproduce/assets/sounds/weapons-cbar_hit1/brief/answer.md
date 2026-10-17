I made `weapons/cbar_hit1.wav` from a generated take. The build says OK, with one warning left about brightness. The file is at `work:sound/weapons/cbar_hit1.wav`. To use it, put it in the mod's `sound/weapons/` folder. The game loads it in place of its own with no code.

**What I sent to the generator:** "a steel crowbar striking a metal surface, one sharp metallic clang, close-miked, dry". Your wording was "the crowbar hitting a metal surface". I added "steel" and the clang, close-miked and dry details so the take would be a hit, not a scrape.

**How I picked it:** I generated four takes from each of two local models and chose seed 2 from Stability AI's model. It had the cleanest attack and ring of the eight.

**How it's shaped:**
- The take starts at its hit, with a 0.8 s length and a fast attack.
- A lowpass at 2.8 kHz (kilohertz) takes off the harsh top end, and a bump at 800 Hz adds body.
- A short room adds a tail, and a light saturate and limiter set the loudness.
- The game's second hit sound (`cbar_hit2`) is not replaced. Its own warnings were the same as hit1's, and you asked for hit1 only.

**Warnings still open:**
- The spectrum is brighter than the game's metal hits. The centroid (the brightness centre) is 2247 Hz against the class's 1074 to 1654 Hz, and the 2 to 5 kHz share is high. I tried a 1.8 kHz lowpass as well. That version sounded duller and still warned (centroid 1851 Hz). I kept the 2.8 kHz one because it has more clang.
- The sound is too clean compared with the game's (flatness 0.039 against 0.16 to 0.28). That is the trade-off for a clear hit.

**Licences:** The take is from stable-audio-3-sfx, under the Stability AI Community Licence. It is free for an organisation under US$1M annual revenue, and needs an enterprise licence above that. Its sidecar `.json` records the prompt and seed. I also generated takes from woosh-dflow, which is CC-BY-NC (non-commercial only), but I did not use them. You accepted the local generators' licences for this test, so I did not change the choice.

**Not checked here:** How it sounds, and how the game plays it (its volume, pitch and the map's room). Please listen to it in the game and say whether it is at least as good as the original.
