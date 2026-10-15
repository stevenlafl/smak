I built weapons/explode3.wav and the build says OK. Every check passed, and all 22 measured features are within the range of the game's own explosion sounds.

The file is mono, 22050 Hz, 8-bit, 1.3 s long and plays once. It's in the work folder under `sound/weapons/explode3.wav`. Copy it to `<mod>/sound/weapons/` and the game will play it instead of the original.

How it compares with the description:

```
measure           made                     description
start             full scale from sample 0  full scale, no click
pinned/clipped    0 to about 0.45 s         first ~0.4 s
peak / crest      -0.3 dBFS / 7 dB          clipped hard
T20 / T40         0.98 s / 1.14 s           ~1/3 at 0.8 s, rumble by 1.1 s
end               fades to near silence     no sharp cutoff
onsets            0                         no separate hits
centroid          590 Hz                    weighted low
power <150 Hz     37%                       strongest under 300 Hz
150-600 Hz        39%
600 Hz-2 kHz      17%                       the crackle at the start
2-5 kHz           5.5%
>5 kHz            1.4%                      weak, dies fastest
```

**Layers:**
- **Main blast:** shaped noise whose high end rolls off over time, so the tail turns into a dark rumble after about 0.7 s.
- **Low rumble:** brown noise kept quiet, filtered to 30–140 Hz.
- **Crackle:** short particles between 300 Hz and 2 kHz that die away by 0.75 s.

Hard saturation and a limiter set to a 7 dB crest (peak over average loudness) keep the start pinned and clipped.

**Two things to know:**
- **Attack:** the report gives a 25 ms attack. The waveform is at full scale from the very first sample, so that figure looks like just where the single loudest sample happens to land in the clipped block. One random seed did measure 0 ms, but it also showed an onset (a second hit), which the original doesn't have. I kept the version with no onset.
- **Not checked:** I haven't heard it. The build can't say how it sounds or how the game plays it (volume, pitch, the map's room acoustics), so listen to it in the game.
