The sound is built and the build says OK: `work:sound/weapons/357_shot1.wav`, 22050 Hz, 8-bit mono, 1.06 s. To use it, put it in `<mod>/sound/weapons/`, where it replaces the game's file of that name.

I did not have the original to put beside it, so every comparison below is against your description and the gunshot class ranges, not the recording.

**How it is made:** a generated .357 shot (take 0 of four, the one that starts on its hit) is the body. It is shaped with a tail that falls about 20 dB by 0.8 s, then saturated to the top setting. A thump and a crack sit at the start, and a low rumble under 150 Hz follows the same tail. The generator is woosh-dflow, with a CC-BY-NC 4.0 licence (non-commercial). You accepted that for this test, and the build records it in its facts.

```
Measure                   Made        Original (your description)
------------------------  ----------  ----------------------------
Length                    1.06 s      1.06 s
Full level by             ~5-20 ms    ~12 ms
T20 (drop 20 dB)          0.99 s      ~0.81 s after the peak
T40 (drop 40 dB)          1.01 s      near silence at ~1.0 s
Crest                     11 dB       (class 4.5 to 11.7)
RMS                       -11.6 dBFS  (class -11.7 to -4.5)
Under 150 Hz              17%         21%
150-600 Hz                31%         26%
600-2000 Hz               43%         46%
2000-5000 Hz              7%          6%
Over 5000 Hz              1%          2%
```

The build reports 22 of 22 of the gunshot class's features in range.

**Where it is off:**
- The attack is about 20 ms, not 12 ms. The limiter that brings the crest down slows it.
- The tail is about 0.18 s longer than the original's 20 dB drop. Tightening it lifted the tail again through the limiter, so I kept the level that held the crest.
- The 8-bit depth adds a faint hiss under the quiet tail. I kept 8 bits because your facts say the original is 8-bit. Leaving out `bits` gives a 16-bit file with no hiss, if you prefer that.

Nothing here was checked by ear in the game. Please listen to it there, since level and mix there matter as much as these numbers.
