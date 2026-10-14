I built `doors/doormove1.wav` and the build says OK with every engine check passing. It's 11025 Hz, 8-bit mono, 5.04 s long and plays once with no loop. Put it in `<mod>/sound/doors/` and it plays in the original's place.

I couldn't compare it directly against the original. The server has no game folders configured, so it couldn't load the real `doors/doormove1.wav` to draw beside mine. I matched it to your description instead.

**How it's built:**
- **Grinding body:** pink noise boosted around 500 Hz and kept roughly between 180 Hz and 2.2 kHz.
- **Grain:** a steady stream of tiny particles (300 per second, 250 Hz to 3 kHz) gives the gritty texture.
- **Low rumble:** brown noise under 150 Hz. It stays quiet through the body and comes up about 14 dB at 4.1 s.
- **End rattle:** band-passed noise from 4.08 s that pulses about every 60 ms, then fades.
- **Squeals:** four soft sine sweeps from 300 to 600 Hz, each about a second long, starting at 0.3, 1.55, 2.8 and 3.9 s.
- **Shape:** a 0.1 s fade-in, then a level body with small ripples. It swells to its loudest from 4.1 to 4.6 s, is down to about -30 dB by 4.9 s, and is silent by 5.04 s. A light saturation is applied at the end.

**What it measures:**
- Peak is -1 dBFS (decibels below full scale) and average loudness is -14.8 dBFS.
- Crest factor (peak over average) is 13.8 dB.
- Spectral centroid, the balance point of its frequencies, is 621 Hz.

```
<150 Hz   150-600   600-2k   2k-5k
 22.3%     42.8%     30%      4.9%
```

Most of the energy is between 150 Hz and 2 kHz, as described. The low band's share comes mostly from the end swell.

In the drawing, the swell and rattle at 4.1 to 4.6 s and the rising squeal arcs are both visible.

The kit has no door class to measure against, so I used the closest one, "loop machine". It puts 10 of 20 features in range. The ones off are its length, how bright it is, how noisy it is and its band balance. Those game sounds are short, tonal hums, so I didn't change this one to match them.

The tool can't tell how it sounds, so give it a listen in the game, on a door that uses this sound.
