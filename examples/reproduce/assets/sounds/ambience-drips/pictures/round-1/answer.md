The build says OK: every engine check passed and all 20 measured features fall inside the range of the game's own drip loops. The file is `work:sound/ambience/drips.wav`. To use it, put it in `<mod>/sound/ambience/` and it plays in place of the original.

**How it matches the original:**
- **Format:** 11025 Hz, 8-bit, mono, 7.31 s, with a cue point at the start (the loop seam is crossfaded over 50 ms).
- **Timing:** five drips at about the same times as the original's: 0.0, 1.84, a small one at 3.68, then 3.97 and 5.85 s. Each one wraps back cleanly at the loop.
- **Each drip:** a sharp noise splash centred around 500 Hz, a little low body under it, a faint ring at about 500 and 850 Hz, and a noisy tail that dies away over about 1.6 s.
- **Background:** a steady hiss under the whole loop, rolled off above 1.5 kHz, like the room tone in the original recording.

```
                 mine     game's drip loops
centroid         869 Hz   671-1007
flatness         0.115    0.05-0.15
150-600 Hz       18.1%    13.2-33.2
600-2k Hz        73.3%    62.3-82.3
2k-5k Hz         4.4%     0-12.5
```

**Where it still looks different side by side:**
- **Top of the spectrum:** the original has more energy above about 2 kHz, including faint ringing lines in the drip tails. Mine is darker up there.
- **Why I didn't fix it:** every time I added that high content, it dominated the moment the drip hits, and 7 or 8 of the 20 features went out of range. So I left it out.
- **Drip tails:** in the original they stand out more against the background than mine do.

The build can't tell how it sounds or how the game plays it (volume, pitch, the map's room effects), so it needs a listen in-game.
