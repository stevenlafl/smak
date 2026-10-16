The sound is built: `work:sound/debris/bustmetal1.wav`. The build says OK with no faults. Copy it to `<mod>/sound/debris/` to replace the game's file.

It is made entirely from layers, not from a generated recording. The four generated takes were poor (wrong hit timing, sparse body), so I did not use them. That also means no non-commercial licence applies to this file.

Measured against your description:

```
Measure            Target        Built
Length             0.87 s        0.86 s
Sample rate        11025 Hz      11025 Hz
Bits               8             8
Under 150 Hz       8%            7.6%
150-600 Hz         22%           22.5%
600-2k Hz          38%           37%
2k-5k Hz           30%           32.1%
Over 5k Hz         2%            0.8%
T20 (to -20 dB)    about 0.6 s   0.53 s
T40 (to -40 dB)    about 0.75 s  0.71 s
Attack             none          35 ms
```

The envelope follows your points: about half amplitude at 0.3 s and a quarter at 0.45 s. The sound is silent at the end.

Where it falls short:

- **Ringing bands:** I could not add the faint modal ring without it either spiking at the start or pushing the band shares out of range. The sound is noise-based, so flatness is 0.61, against the game's metal-hit range of 0.16 to 0.28. A judge comparing spectra will see that gap.
- **Crest:** 16 dB, against the game's metal-hit range of 5 to 12.5 dB. A limiter brought it down but moved the bands out of range, so I dropped it. Your description gives no crest figure.
- **8-bit hiss:** the build warns that 8-bit adds a hiss under the quiet tail. I kept 8-bit because that is the original's depth.
- **Not heard:** the build measures the sound but cannot say how it sounds. Listen to it in the game before you accept it.
