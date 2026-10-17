The sound is built and the build says OK. It's at `work:sound/weapons/sbarrel1.wav`, and the modder copies it to `<mod>/sound/weapons/sbarrel1.wav` to replace the game's `sbarrel1.wav`.

**What it is:** a clip of a pump shotgun firing, taken from a generated take, then shaped into the game's format: mono, 22050 Hz, 16-bit, 1.39 s long, with the peak at -0.5 dBFS. The shot hits at once (attack 5 ms), with a body around 150 to 600 Hz and little above 2 kHz. The spec is `smak.sound/1`, with one sample layer and a small crack added so the start stays sharp.

**How I made it:**
1. I asked the local sound generator (woosh-dflow) for four takes of "a pump action shotgun firing, sharp blast then a metallic slide rack". I picked take 0, which has the blast and then a second hit for the slide.
2. The spec starts the take 0.07 s in, where its peak is, and cuts it to 1.15 s. A low lift at 160 Hz adds body, a cut at 900 Hz and 3 kHz removes the harsh top, and a lowpass at 1.5 kHz tames the brightness.
3. A short white-noise crack (2 kHz and up, 4 ms) sits on the onset, and a small room gives a little space. Saturation and a limiter (crest 9 dB) make it loud for its peak.

**Licence:** the generator's weights are CC-BY-NC 4.0, non-commercial. You accepted that for this test. The build's facts record it on the sample, so it will show up if anyone checks the file later.

**What the build reports:** 21 of the 22 measured features of the game's gunshot class are in range. The one left is the tail: it falls 20 dB in 0.44 s, against the game's at least 0.46 s, so it is a touch dry. The build also notes it has no game folders to compare against, so the comparison is with the class's typical figures, not the game's own `sbarrel1.wav`. I tried several settings: the longer room gave a tail that rang too long, and the shorter one dried it out, so I kept the middle setting.

**For the modder to judge by ear:** whether it sounds like a shotgun at least as good as the game's, whether the second hit (the slide) belongs in a single shot, and whether the tail is too dry in the map's room. The numbers can't show how it sounds, so this needs listening in the game.
