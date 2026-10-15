The sound is built and the build says **OK**. It is at `work:sound/weapons/explode3.wav`, so copy it to `<mod>/sound/weapons/` to test it in the game. I could not listen to it, so the match is by measurement only.

The layers are one take from the local `woosh-dflow` generator, shaped with a driven body, a fall-off envelope, a filter that darkens over time, and crackle grain. Its licence is CC-BY-NC 4.0, which you said you accept for this test.

Measured against your description (the report's own figures):

```
Feature            Target              Built
-----------------  ------------------  -----------------------------
Format             22050 Hz, 8-bit     22050 Hz, 8-bit, mono, 1.3 s
Under 150 Hz       35%                 38%
150 to 600 Hz      30%                 36%
600 to 2000 Hz     20%                 19%
2000 to 5000 Hz    10%                 6%
Over 5000 Hz       5%                  2%
Crest (peak/RMS)   clipped body        6.5 dB
Time to -20 dB     fall to ~0.5 at 0.8 s  1.0 s
Attack             instant             40 ms
```

The report marks all 22 class features as in range for explosions. The high band (2 to 5 kHz) and the very top are still a little light against your 10% and 5%.

Warnings still standing, and why I left them:

- **8-bit hiss:** the kit warns that 8-bit adds a hiss under the quiet tail. I kept 8-bit because your facts call for it. Set `bits` to 16 in the spec if the hiss is a problem in the game.
- **Crack layer over a take:** the kit warns that the short transient layer over a generated take may read as static. It decays in 3 ms, so I kept it for the onset.
- **Attack of 40 ms:** the report reads the first peak at 40 ms, not instant. The remaining onset is the generator's own, and the crack layer was the most I could push it.

I also removed the limiter from the chain. It kept the crest low, but it lifted the tail so the sound did not fade as your description says. The result is a cleaner fall-off at the cost of a clipped body that is a little less flat than the original.

The spec is not saved to a file, so I can't reopen it from the work folder. Tell me if you want it written out as a `.json` to rebuild from.
