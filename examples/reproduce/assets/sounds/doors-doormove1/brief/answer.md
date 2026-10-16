The sound is built and the build says OK: `work:sound/doors/doormove1.wav`, 22050 Hz 16-bit mono, 1.5 s, peak -0.5 dBFS. To use it, copy it to `<mod>/sound/doors/doormove1.wav`. The game loads it in place of its own file, with no code.

**What I made:** A take from a local text-to-sound model (woosh-dflow), prompted with "a heavy metal sliding door moving, steel rollers rumbling along a track, a long low metallic grinding slide." I sent more words than the modder's own phrase, so they can ask for theirs instead. I tried four seeds (random takes of the same prompt) and picked seed 0, because it has the most continuous grind and a clear start. The spec then:
- shortens it to 1.6 s and cuts the top above 5 kHz,
- adds a small boost around 1.5 kHz so it is less dark,
- applies a mild saturation and a limiter (a peak limiter that evens out loud spikes), so it does not jump out of the mix,
- adds a little room.

**Licence:** The model's weights are CC-BY-NC 4.0 (Creative Commons Attribution-NonCommercial). That is fine for a test and for a non-commercial mod. If the mod is ever sold or monetised, it needs a different take. That is the modder's call.

**What I could not verify:** I can only read the waveform and spectrogram, not listen. The first version had a slow swell (about 2.2 s before its peak) and was too dark, so I reshaped it. The final version still rises for about 0.7 s, and its spectrum is not checked against the game's own `doormove1.wav`: the report compared it to the metal-hit class, which is a poor fit for a door. The modder should listen in the game and compare it with the original. If it sounds too much like a wash rather than a grind, tell me and I will try another seed.
