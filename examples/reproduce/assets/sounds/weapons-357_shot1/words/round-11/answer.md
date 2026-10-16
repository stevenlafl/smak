The sound is built and the build says **OK**: `work:sound/weapons/357_shot1.wav`. It is 1.06 s, 22050 Hz, 16-bit mono, which is the GoldSrc format. Copy it into `<mod>/sound/weapons/` so the game plays it in place of the original.

**What I made it from:** a generated take of a .357 shot (woosh-dflow, seed 3), used as a texture layer under a shaped noise blast. The take is under the CC-BY-NC 4.0 licence, which is non-commercial. You said that's fine for this test, so I've used it. Its licence is recorded in the take's sidecar file.

**Measured against your description:**

| Feature | Target | Built |
| --- | --- | --- |
| Length | 1.06 s | 1.06 s |
| Onset | instant, full scale | 0 ms attack, crack at the start |
| Under 150 Hz | about 30% | 28.3% |
| 150 to 600 Hz | about 30% | 34.5% |
| 600 to 2000 Hz | about 22% | 23.0% |
| 2000 to 5000 Hz | about 13% | 9.9% |
| Over 5000 Hz | about 5% | 4.3% |
| Decay to -20 dB (T20) | falls fast after 0.45 s | 0.51 s |
| Decay to -40 dB (T40) | near silence by 0.95 to 1.06 s | 0.59 s |
| Class check (gunshot) | — | 22 of 22 features in range |

The T20 and T40 targets are my reading of your description, not measurements of the original. I don't have the original file here, so I couldn't compare them directly.

**Known gaps:**
- The build still warns about one noise layer over the take. That layer is the blast body, which the original's roar needs. The grain texture comes from the take.
- Flatness is 0.198, just under the class range. I left out tones because you said the sound has none.
- The dip at 20 to 30 ms and the few dips in the clipped section are in the envelope.
- I can't hear the sound. The numbers and the picture say how close it is, not how it sounds. Please listen in the game, since the map's room and the volume will also change how it plays.

**Caveat on reproducing it:** I don't have a file-writing tool here, so the spec lives only in this conversation. If you need to rebuild it later, I can save it to the project as a `.json` file.
