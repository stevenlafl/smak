The sound is built and the build says **OK**. The file is `work:sound/items/smallmedkit1.wav`, which takes the place of the game's own `items/smallmedkit1.wav` when put in a mod's `sound` folder.

**Measured against your targets** (from the build report):

```
Band        Target   Made    Off
<150 Hz       5%      3.7%   -1.3
150-600      25%     27.7%   +2.7
600-2k       30%     30.7%   +0.7
2k-5k        15%     15.5%   +0.5
>5k          25%     22.4%   -2.6
```

- **Length and format:** 0.76 s, 22050 Hz, 8-bit mono, played once. The peak is -0.6 dBFS with no clipping, and no engine faults were reported.
- **Beeps (0 to 0.33 s):** four square-wave tones at 600 Hz, one short and three about 0.065 s, with gaps. The gating is hard, so each beep has its edge click.
- **Fumbling (0.33 to 0.58 s):** a rustle take from the local generator, band-limited to 150 to 2000 Hz, with three short clicks at 0.38, 0.42 and 0.48 s.
- **Burst (0.58 to 0.76 s):** a spray take from the local generator, band-limited to 2 to 8 kHz, with a small low body under it. It starts and stops abruptly, with no fade.

**Things to know:**
- **Licence:** the two generated takes come from woosh-dflow, which is CC-BY-NC 4.0 (non-commercial). You said that is acceptable for this test. It would block commercial use of the file.
- **Fumble level is a guess.** The report gives band shares, not levels per section. The fumble is faint on the picture, so it may sit a few dB below the one-fifth level you described. Listen to it.
- **Warnings left in:**
  - Eight-bit depth, which you asked for. It adds a faint hiss under the quiet stretches.
  - Short steady noise over the burst take. This is the low body, plus the three clicks. It is brief and was kept on purpose.
- **Not compared to the original:** no game folders were given, so the build could not read the real `items/smallmedkit1.wav`. The match is to your description, not to the original file.
- **Not checked by the build:** how it sounds to a person, its volume in the game, and how the mix sits. Please listen in the game before you judge it.
