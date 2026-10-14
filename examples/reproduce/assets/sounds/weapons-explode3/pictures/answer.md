The build says OK: no faults, and all 22 measured features fall within the range of the game's own explosion sounds.

**Output:** `work:sound/weapons/explode3.wav`. It's mono, 22050 Hz, 8-bit, 1.3 s, matching the original's format and length. Copy it to `<mod>/sound/weapons/explode3.wav` and the game plays it in the original's place.

**Compared with the original's picture:**
- **Envelope:** both start at full level with no ramp-up. The body stays flat and clipped for about the first 0.6 s, then the sound fades to near silence by 1.3 s, ending without a click.
- **Spectrum:** it's broadband noise weighted toward the low end. The highs are strong at first and darken over the tail, the way the original's top band does from about 1.0 s on. A quiet falling 80 to 55 Hz rumble under it gives the slow low swings visible in the original's tail.
- **Character:** heavy saturation gives the same squashed, loud blast. Peak is -0.6 dBFS (decibels below full scale), RMS (average loudness) is -9.2 dBFS, and the peak-to-average ratio is 8.6 dB.

**Where it may differ:**
- The tail drops off a little earlier: it's 20 dB down at about 0.71 s, and in the original's waveform that looks closer to 0.9 s. I only had a picture of the original to measure, so that 0.9 s is an estimate by eye.
- RMS sits right at the bottom edge of the game's range (-9.2). The picture looked a touch louder to me in the body.

The checks can't tell how it actually sounds or how it plays in the game, with its volume, pitch and the map's room. That needs a listen in the game.

The final spec is the last build above: four layers (pink-noise blast, brown-noise rumble, sine boom, band-passed white-noise debris), saturate 8, seed 11.
