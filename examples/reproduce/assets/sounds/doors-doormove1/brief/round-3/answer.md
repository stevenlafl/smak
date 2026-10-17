The sound is built and the build says OK. It is at `work:sound/doors/doormove1.wav`, and the mod puts it at `<mod>/sound/doors/doormove1.wav`, where it replaces the game's own file of that name.

**What it is:** a 2.85-second mono 16-bit file at 22050 Hz, the game's rate for these sounds. It is made from synthesised layers, not a recording:

- **Whine:** a sawtooth rising from 420 Hz to 1400 Hz over 2.4 seconds, with a low-pass filter.
- **Harmonic:** a square wave rising from 630 Hz to 2100 Hz, band-passed and quieter, which adds the electronic edge.
- **Thud:** at 2.5 seconds, a sine that drops from 95 Hz to 38 Hz in a quarter second, then decays over about a third of a second.
- **Clack:** a short high-passed noise burst at the same moment as the thud, for the impact.

**What I tried and dropped:** I generated eight takes with the local generator (woosh-dflow). None had a clear rising whine followed by a thud, so none went in. Because of that, nothing from the generator is in the final file, and its non-commercial licence does not apply to this sound. I also removed a steady motor-noise layer, since the build flagged it as static-like hiss.

**What the build did not check:**
- It could not compare the sound to the game's own `doors/doormove1.wav`, because no game folders were given to it. So there is no measured comparison, only the sound itself.
- It cannot tell how the sound feels in play. The volume, the pitch the engine applies and the map's room are all unknown to it. The mod's author will need to listen in the game and compare it with the original.
