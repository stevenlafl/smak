The grenade explosion is built and the build says OK. It is at `work:sound/weapons/explode3.wav`, a 22050 Hz, 16-bit mono WAV of 1.35 s. Put it in the mod's `sound/weapons/` folder and it replaces the game's `explode3.wav` with no code. I have not heard it, so the final call is theirs in the game.

**What it is made from**
- **A generated take:** stable-audio-3-sfx, seed 0, prompted with "a hand grenade exploding, one deep sharp blast, debris scattering afterward, close-miked, dry". I picked it because it has a clear hit at the start and a body that decays. The other model, woosh-dflow, produced longer rumbles with tails that were too long.
- **Shaping:** a 1.35 s cut from the take's first hit, with a fast attack and a decay. A lowpass at 8 kHz, plus two boosts at 1.2 kHz and 3 kHz, brighten it.
- **Debris:** a short train of grains between 800 Hz and 4 kHz, quiet, for the grain the take lacked.
- **Low boom:** a sine that falls from 90 Hz to 40 Hz over half a second, quiet under the blast.
- **Finish:** saturation, then a limiter, peaking at -0.5 dBFS.

**Checks**
- The report measures it against the game's explosion sounds: 22 of 22 features in range.
- The build warnings I fixed were: too dark, too little energy from 600 Hz to 2 kHz, too pure, a spiky crest, and silence at the end.
- The post-limiter crack layer raised the crest, so I removed it.

**Licences**
- The take is from stable-audio-3-sfx under the Stability AI Community Licence. Commercial use is free for an organisation under US$1 million annual revenue. Above that it needs an enterprise licence.
- The woosh-dflow take was non-commercial (CC-BY-NC 4.0), but I did not use it. The person accepted these licences for this test, so the file is fine for them to try.

The spec is inline in the build call and is not saved as a file in the work folder. If they want to tweak it, the layers above are the parts to change.
