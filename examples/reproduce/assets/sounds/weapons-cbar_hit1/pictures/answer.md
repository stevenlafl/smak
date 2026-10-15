`weapons/cbar_hit1.wav` is built and the build says OK with no warnings. It's written to `work:sound/weapons/cbar_hit1.wav` and takes the original's place when put in `<mod>/sound`. I haven't listened to it, and the build can't check how it plays in the game.

It's a layered sound: shaped noise as the body plus one `modes` ring at 1650 Hz. It is 0.69 s, 11025 Hz, 8-bit, mono, and plays once.

| Check | Result |
| --- | --- |
| Against the game's metal hits | 22 of 22 features in range |
| Centroid (brightness) | 1362 Hz against the picture's 1467 (7% off) |
| Band power, worst case | 5.8 points off (150-600 Hz) |
| T20 (time to -20 dB) | 0.569 s, inside the 0.24 to 0.7 s range |
| Crest (peak over RMS) | 8 dB, against about 9.8 read off the original's outline |

The ring doesn't hold as long as the thin line in the original's spectrogram, which runs the full length. The waveform is also less ragged than the original's, which has a few bursts in its first half. A generated recording could come closer on the grain. This server offers `generate`, but its models are licensed non-commercial, so that is your call.
