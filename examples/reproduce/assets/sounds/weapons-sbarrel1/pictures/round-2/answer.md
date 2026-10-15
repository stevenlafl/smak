The build says OK and every engine check passed. The file is `work:sound/weapons/sbarrel1.wav` (22050 Hz, 8-bit mono, 1.04 s, played once). Put it in `<mod>/sound/weapons/` and the game plays it instead of the original, with no code change.

How it measures against the original's picture, as the build reported it:

```
                    original (picture)   mine
length              1.04 s               1.04 s
centroid            615 Hz               676 Hz (10% off)
bands, worst        -                    1.2 points off (600-2k)
crest               ~11.2 dB             11.5 dB
T20 (to -20 dB)     0.46-1.01 s window   0.77 s
onsets              1                    0
```

**How it's built:** It's a dark, wide-band blast that stays clipped flat out to about 0.4 s and then dies away by about 1 s, matching the original's outline. The high end fades out first, as in the original. A dip at about 0.03 s followed by a second crack gives the double-barrel hit you can see near the start of the original. Underneath is a low boom falling from 100 Hz to 45 Hz.

**What's still off:**
- **Second shot not detected:** The meter counts 0 onsets against the original's 1, so it doesn't pick up that second shot as a separate hit. You can see the dip in the picture, but when I made the cracks louder the limiter flattened the whole sound, so I kept them as they are.
- **Slightly quiet:** It's 0.4 dB under the quietest of the game's own gunshots (RMS -12.1 dBFS, range -11.7 to -4.5). That's 21 of 22 features in range. Pushing it into range wrecked the envelope, so I traded that for the better match to the original.

These are measurements only. Nobody has listened to it or tried it in the game, where the volume and the map's room will change how it sounds, so give it a listen in game.
