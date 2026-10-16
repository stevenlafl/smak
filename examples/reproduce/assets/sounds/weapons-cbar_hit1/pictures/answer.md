The sound is built and the build says OK, with no warnings. It is written to the work folder as `sound/weapons/cbar_hit1.wav`, so it takes the place of the game's own file of that name.

I did not listen to it. Everything below is from the build's measurements and its picture, so the game is the final check.

```
Measure           Original        Made        Note
Length            0.69 s          0.69 s      exact
Peak onset        0.023 s         0 s         strike at the start
T20               0.58 s          0.55 s      time to fall 20 dB
Centroid          1467 Hz         1365 Hz     7% low
150-600 Hz        8%              6.5%
600-2k Hz         69%             73.8%
2k-5k Hz          19%             18%
<150 Hz           3%              1.7%
>5k Hz            1%              0.1%
Flatness          0.16 to 0.28    0.25        in range
Crest             about 9.8 dB    10.7 dB     within 3 dB
Class check       metal hit       22 of 22 in range
```

How it was made:
- **Strike:** four takes of a crowbar on metal were generated with woosh-dflow (an open-weights sound model). Take 2 had the closest band shares, so I used it. Its tail was too bright, so I lowpassed it at 1.3 kHz and shaped its envelope to the original's: peak at 0.02 s, down 20 dB by 0.58 s.
- **Body:** two particle layers, one for 100 to 600 Hz and one for 2 to 4 kHz, add grain. Steady noise over the take gave a static warning, so I used particles.
- **Ring and crack:** a faint 1 kHz modal ring, and a short high-passed crack at the onset.
- **Finish:** saturation of 2 and a limiter at crest 9, peak -0.5 dBFS, 11025 Hz.

Two choices you may want to change:
- **16-bit, not 8-bit.** The original is 8-bit, but the build warns that 8-bit adds hiss under the tail. Say if you want 8-bit to match the original's file format exactly.
- **Licence.** The strike is from woosh-dflow, whose weights are CC-BY-NC 4.0 (non-commercial). You accepted that for this test, so it is noted here and the sound is not for commercial use as it stands.

The spec itself lives only in this conversation, not in a file. The four generated takes are in the work folder under `gen/`, and the chosen one is `gen/cbar_hit_s2.wav`.
