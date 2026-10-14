I built `ambience/drips.wav` and the build says OK. Every engine check passes, and all 20 of its measured features fall within the range of the game's own drip loops.

```
                 Result             Original (as described)
Format           11025 Hz 8-bit mono, loops from its start
Length           7.31 s             7.31 s
Drips at         0.05 1.87 3.69 3.97 5.85 s (same as the original)
Loudness order   1 = 5 > 2 > 3 = 4  same
Peak / RMS       -1.1 / -25.9 dBFS
Attack           under 10 ms        a few ms
Fade (T20/T40)   0.33 s / 1.45 s    0.5 to 1 s tail
Centroid         920 Hz             strongest band 700-900 Hz
Power <150 Hz    3.4%
      150-600    19%
      600-2k     75.2%
      2k-5k      2.4%               faint above 3 kHz
Flatness         0.064              mostly noise, a slight ring
```

How it's built:
- **Each drip** has three noise parts: a 30 ms "plip" around 750 to 850 Hz, a wet tail that fades over 0.6 to 1 s, and a weaker layer around 400 Hz to give the tail some body.
- **The ring** is a faint sine that glides up about 100 Hz over the first 0.1 s, like a drop's bubble, plus one or two ringing tones. All of these are tuned differently for each drip, between 620 Hz and 2 kHz.
- **The background** is a steady low rumble under about 300 Hz plus a quiet mid hiss, so the gaps between drips never go silent. Both run the full length, and the last tail runs into the loop point.

**Weakest match:** The rings are fainter than the description may mean. When they were louder, the tool rated the sound too bright and too pure, so I turned them down until they are only just visible in the spectrogram. If they should stand out more, raise the ringing-tone layers a few dB and accept a slightly brighter reading.

The tool can't tell me how it actually sounds or how it plays in a map, so it needs a listen in the game. The file goes in `<mod>/sound/ambience/drips.wav`.

While testing I also wrote `work:sound/test/drips16.wav`, a 16-bit copy I used to rule out the 8-bit format as the cause of the brightness. It's scratch and can be deleted; none of these tools can delete files.
