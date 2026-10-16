The sound is built and the build says OK. It is at `work:sound/weapons/cbar_hit1.wav`, and it takes the place of the game's own file with that name when it sits in `<mod>/sound`.

I could not compare it with the original, because no game folders were given to the server. The comparison below is against your description of the original.

```
Measure                 Original (your figures)   Made sound
Length                  0.69 s                    0.69 s
Format                  11025 Hz, 8-bit, mono     11025 Hz, 8-bit, mono
Loudest point           0.023 s                   about 0.02 s (set in the envelope)
Fall after the peak     20 dB in 0.58 s           about 20 dB by 0.6 s
Centroid                about 1467 Hz             1194 Hz (class range 1074 to 1654)
Under 150 Hz            3%                        0.3%
150 to 600 Hz           8%                        8.4%
600 to 2000 Hz          69%                       70.2%
2000 to 5000 Hz         19%                       21%
Over 5000 Hz            1%                        0.1%
```

**How it is made:**
- **Recording:** a generated take of a crowbar on hard metal (`woosh-dflow`, seed 2), band-limited at 5 kHz and cut to the onset. It carries the gritty, rattly texture.
- **Layers:** a broad noise body and a short grit layer over the first 0.3 s, which then thin out. A low-mid noise band and a faint 110 Hz sine add the low energy. A set of tuned modes gives the ring near 1 kHz, with weaker partials at 1480, 2170 and 640 Hz that die away.
- **Finish:** a 5.5 kHz lowpass, light saturation, and a limiter with a 9 dB crest factor.

**Choices and checks:**
- **Licence:** the take is from `woosh-dflow`, licensed CC-BY-NC 4.0 (non-commercial). You said that was acceptable for this test.
- **8-bit:** the build warns that 8-bit adds a faint hiss under the quiet tail. I kept 8-bit because your description asks for it.
- **Centroid:** it is about 270 Hz darker than your 1467 Hz figure. It is still inside the game's own range for metal hits, but I did not push it further.
- **Layers over the take:** the build warns that the noise layers over a recording can sound like static. I kept them because they set the grit and spectrum, and the spectrogram shows no steady hiss.
- **Not checked:** I cannot hear it. Listen to it in the game, and check its volume and pitch there.

The spec was written inline and is not saved to a file in the work folder. If you want it kept, I can save it as a `.json` next to the take.
