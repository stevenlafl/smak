The sound is built and written to `work:sound/doors/doormove1.wav`. The build says OK, but it is not as close to the original as I wanted on loudness shape: the crest is about 5 dB off. I could not hear it, and I could not open the original's picture directly, so the targets below are the numbers the build read off that picture.

**Measured against the original's picture**

```
Measure            Made sound        Original (read off picture)   Result
Length             5.04 s            5.04 s                        matches
T20 (time to -20)  0.48 s            0.35 to 0.58 s                in range
Centroid           578 Hz            589 Hz                        2% off
Below 150 Hz       24.8%             30.1%                         5.3 points off
150 to 600 Hz      41.9%             37.8%                         in range
2k to 5k Hz        5.1%              4.4%                          in range
Crest              17.6 dB           about 12.7 dB                 4.9 dB off (outside 3 dB)
Format             11025 Hz, 8-bit mono (same as original)
```

The original's 600 Hz to 2 kHz share and its top band were not in the picture readings, so I could not check those.

**How it was made**

- A generated take of a sliding steel door, from the woosh-dflow model (seed 0). Its licence is CC-BY-NC 4.0, which is non-commercial. You said the licences were accepted for this test.
- Layer 1, `burst`: the first 0.6 s of that take, with a 12× drive to flatten its peaks, and a shaped envelope that drops by 20 dB at about 0.58 s.
- Layer 2, `tail`: the rest of the same take, very quiet, fading to -42 dB, so the file runs its full 5 s.
- Layer 3, `rumble`: low pink noise under 140 Hz, to restore the bass share.
- The same filter on both take layers: a cut around 280 Hz, a lift around 900 Hz, and a lowpass at 2.6 kHz.
- Finish: peak normalised to -0.5 dBFS. No limiter: a limiter pumped the quiet tail up and broke the decay.

**Open issues**

- Crest is the main miss. The burst's peaks still sit about 5 dB above its average level. I tried higher drive and flatter envelopes; the best I got was 16.9 dB, which then cost centroid and band accuracy.
- The build warns that 8-bit depth adds a hiss under the quiet tail. The original is also 8-bit, so I kept it for a like-for-like format. Switching to 16-bit would remove the hiss if it is audible in the game.
- The build also warns that a steady pink noise layer is heard as static. The rumble layer is a short low-pass noise, so I judged it acceptable, but listen for it.
- The spec was only passed inline. I have no file-write tool here, so it is not saved in the work folder. The shape of it is in the layers above and in the build calls.

Nothing here has been listened to. Please play it in the game, check the crest and the hiss, and tell me which way it is off.
