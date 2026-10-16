The sound is built and the build says OK: `work:sound/weapons/cbar_hit1.wav`, to go in `<mod>/sound/weapons/` so the game plays it in the crowbar's place. I haven't heard it or run it in the game.

**What it is**

- **Event:** a crowbar striking metal, from a generated take (seed 0 of the woosh-dflow model) placed at the onset, then darkened with a 3.5 kHz lowpass and a 120 Hz highpass.
- **Ring:** a 760 Hz bar-mode ring at -14 dB, for the tail.
- **Attack:** a short high-passed crack after the finish, as the build's warning asked, plus a grain layer at 800–3000 Hz.
- **Finish:** saturation of 1.5 and a limiter at crest 9 dB.
- **Format:** 11025 Hz, 8-bit mono, matching the original. The build warns that 8 bits adds a hiss under the quiet tail. I kept it because the original is 8-bit; with 16 bits the file would be cleaner.
- **Length:** exactly 0.69 s, like the original. I removed the room reverb, which pushed it to 0.79 s.

**Measured against the class (the game's metal hit sounds)**

| Measure | Made sound | Class range |
| --- | --- | --- |
| Length | 0.69 s | 0.37 to 0.86 s |
| Attack | 5 ms | — |
| T20 | 0.27 s | 0.24 to 0.70 s |
| Centroid | 1095 Hz | 1074 to 1654 Hz |
| Crest | 9.0 dB | 5.3 to 12.5 dB |
| Flatness | 0.034 | 0.16 to 0.28 |

The build counts 20 of 22 features in range. The one miss is flatness: the sound is still too tonal. Adding more grain barely moved it, and more noise would be heard as static, so I left it. The original's own flatness isn't measured here; the spectrogram picture is the only comparison I made.

**Comparison with the original**

I read the original's picture (`input/sound.png`): a dense click at the start, the loudest energy up to about 0.3 s, then a ring that fades by 0.69 s, with energy mostly in the low-mid range. The made sound's picture has the same shape: a hard start, a loud body, and a tail to the end. I could not run the picture-based comparison, because the original's picture was not in the work folder when I built, so the report has no original numbers to set against.

**Licence:** the take comes from woosh-dflow, under CC-BY-NC 4.0 (non-commercial). You said that was accepted for this test. If it is ever used commercially, that needs a different take or a different model.
