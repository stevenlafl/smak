The sound is built and written to `work:sound/player/pl_metal1.wav`. The build says OK with two warnings, which I left in place, and it is not a full match to the original.

I did not have the original file. The kit only has your description, so the comparison is against those numbers and the stock `step metal` class, not a waveform side by side.

| Measure | Original (as described) | Built | Note |
| --- | --- | --- | --- |
| Length | 0.58 s | 0.60 s | Tail reaches -60 dB at 0.598 s; 3% over |
| Rate, depth | 11025 Hz, 8-bit | 11025 Hz, 8-bit | As asked |
| Centroid | about 361 Hz | 406 Hz | Slightly brighter |
| Under 150 Hz | 32% | 35.5% | +3.5 points |
| 150 to 600 Hz | 47% | 47.1% | +0.1 |
| 600 to 2k Hz | 20% | 15.8% | -4.2 |
| 2k to 5k Hz | 2% | 1.5% | -0.5 |
| Over 5k Hz | 0% | 0% | |
| Decay to -20 dB (T20) | not given | 0.25 s | Step metal class minimum is 0.32 s |

**Build**
- **Base:** a generated take of a boot on a steel grate (woosh-dflow, seed 2, CC-BY-NC 4.0 licence, non-commercial). It sets the grit and the scrape. Its onset is used, and it is EQ'd to pull 300 and 420 Hz down and lift 1.4 and 2.2 kHz.
- **Thumps:** a heel (90 Hz) and a sole (75 Hz), 35 ms apart, for the two quick contacts.
- **Clicks:** a short burst of grains at 0.7 to 2.5 kHz for the sharp opening clicks.
- **Second contact:** a grain burst at 0.16 s, the rattle near the original's 0.18 s spike.
- **Ring:** a 220 Hz plate-style hum with a 1.2 s decay, faded by 0.5 s, for the hollow tail.
- **Finish:** a little saturation, a short room (0.25 s, 12% wet), and a limiter at 16 dB crest.

**Warnings left in place**
- **8-bit hiss:** the build warns that 8-bit adds a faint hiss under the quiet tail. You asked for 8-bit, and the original is 8-bit, so I kept it. Set `bits` to 16 if the hiss is audible in the game.
- **Decay:** T20 is 0.25 s against a class minimum of 0.32 s, so it dies a little quicker than a stock step. I tried a longer heel thump and a later spike; neither lifted T20 without pushing the sub band off. The original's tail is fine by T40 (0.57 s, as you described), so I think this is the closest I can get within the bands.

**To use it:** copy `work:sound/player/pl_metal1.wav` into your mod's `sound/player/` folder, which replaces the game's own file of that name. I have not tested it in the game. The mix and volume there are for you to judge by ear.

**Licence:** the take comes from woosh-dflow, whose weights are CC-BY-NC 4.0. That's non-commercial. You accepted that for this test; if the mod is ever sold or monetised, the take would need replacing.
