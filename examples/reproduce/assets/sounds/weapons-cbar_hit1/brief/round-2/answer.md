The sound is built and the build says **OK**, with three spectrum warnings I could not clear. It is at `work:sound/weapons/cbar_hit1.wav`. To use it, put it at `<mod>/sound/weapons/cbar_hit1.wav`, and the game plays it in place of its own crowbar hit with no code change.

**What I made**

- **Source:** a generated take from the local `stable-audio-3-sfx` model, seed 1 of 4 takes. I sent this caption: "a steel crowbar striking a metal surface, one sharp metallic clang, close-miked, dry". You asked for "the crowbar hitting a metal surface". I added "steel", "one sharp metallic clang", "close-miked" and "dry" so the model returns a single hit with no room sound. Use your own wording if you want it.
- **Licence:** the Stability AI Community Licence. Commercial use is free for an organisation under US$1M annual revenue. The take's sidecar file is `work:gen/crowbar_metal_s1.json`.
- **Spec:** the take is cut 0.8 s from its first hit, low-passed at 2200 Hz to take off its harsh top end, given a 0.5 s decay, a short room, a saturation of 2, and a limiter with a crest of 9 dB. The output is 22050 Hz, 16-bit, mono, 0.52 s long, with a peak of -0.5 dBFS.

**Build results**

| Measure | Result | Game's metal hit |
| --- | --- | --- |
| Length | 0.52 s | 0.37 to 0.86 s |
| Time to fall 20 dB (T20) | 0.33 s | 0.24 to 0.70 s |
| Centroid (brightness) | 2071 Hz | 1074 to 1654 Hz |
| Share in 2k to 5k Hz | 29.1% | 4 to 25% |
| Flatness (noisiness) | 0.032 | 0.16 to 0.28 |

The build matches the game's metal hits on 18 of 22 measures. Three remain off: it is a little too bright, it is a little too much of a pure ring, and its top band is a little high. Earlier versions were brighter still, so the low-pass moved it toward the game's range. I stopped there because a darker filter makes the sound more tonal, and the build's numbers already disagree with each other on this.

**What to listen for in the game**

- Whether the clang rings too much, since the take is more tonal than the game's hit.
- Whether it is too loud or too quiet beside the other weapon sounds. The build cannot judge volume.
- Whether it sounds dry in the map's room.

If it is not good enough, the next steps are a different seed (0, 2 or 3) or a different caption. I can also add a little grit to the top of the sound. Tell me which by ear.
