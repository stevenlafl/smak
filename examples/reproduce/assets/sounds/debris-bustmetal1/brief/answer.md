The sound is built and the build says OK, with no warnings. It is at `work:sound/debris/bustmetal1.wav`, and it goes in the mod's `sound/` folder as `sound/debris/bustmetal1.wav` to replace the game's file.

**What it is:** a 0.85 second, mono, 22050 Hz, 16-bit WAV of a metal panel giving two crashes in a row, the second a little after the first, with a short bright crack at the start. The panel is a take from a local generator (Stable Audio 3 SFX, seed 0), using the prompt "a sheet of metal panel breaking apart, sharp bangs and rattling debris, close-miked, dry". I chose that take because it has two hits, which fits "breaking apart". The other three takes had one hit each.

**How I made it:** the spec below is the one that built it. I trimmed the take to its first hit onward, low-passed it at 1700 Hz so it sits darker than the generator's bright output, shaped the decay to about 0.6 seconds, and added a grain layer and a crack. I then limited it so its peaks are 10 dB above its average level, which is the crack range for metal hits.

**What the report still says:**
- Its flatness (how much of it is noise rather than tone) is 0.035. The game's metal hits sit at 0.16 to 0.28. The sound is still too tonal, and I could not close that gap without adding steady noise, which would sound like static. This is the one measure left off.
- Its loudest moment comes about 35 ms after the start, where the game's metal hits strike at once.
- I could not compare against the game's own `bustmetal1.wav`, because no game folder was given to the tool. The checks used the ranges for the game's metal hits as a class.

**Licence:** the take comes from Stable Audio 3 SFX under the Stability AI Community Licence. It allows commercial use for organisations under US$1M annual revenue, and needs an enterprise licence above that. You accepted the generators' licences for this test, so I have not changed anything for it.

**The spec** (to rebuild it, save it as a `.json` file and build it with SMAK):

```json
{
  "spec": "smak.sound/1",
  "name": "debris/bustmetal1.wav",
  "class": "metal hit",
  "seed": 1,
  "length": 0.85,
  "layers": [
    { "id": "panel", "kind": "sample", "file": "work:gen/bustmetal_s0.wav", "from": 0.09, "length": 0.85, "env": { "attack": 0.002, "hold": 0.6, "decay": 0.2 }, "filter": [{ "type": "lowpass", "f": 1700 }, { "type": "highpass", "f": 120 }], "gain": 0 },
    { "id": "grit", "kind": "particles", "count": 400, "band": [500, 1700], "grain": 0.006, "env": { "attack": 0.002, "hold": 0.1, "decay": 0.35 }, "gain": -12 },
    { "id": "crack", "kind": "noise", "color": "white", "env": { "attack": 0.0005, "decay": 0.006 }, "filter": [{ "type": "highpass", "f": 2000 }], "gain": -4, "post": true }
  ],
  "finish": { "saturate": 2, "limit": { "crest": 10, "release": 0.002 }, "peak": -0.5 }
}
```

**For the modder to judge:** I have not heard it, and I can't say how it sounds in the game, including its volume and the map's room. Please listen to it in the game, next to the original, and tell me whether it is at least as good. If it is too dull or too clean, I can change the filter, the grit or the take.
