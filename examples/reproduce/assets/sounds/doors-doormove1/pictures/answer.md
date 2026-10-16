The sound is built at `work:sound/doors/doormove1.wav`, which is the game's name for it, so it replaces `doors/doormove1.wav` when placed in `<mod>/sound`. The build says OK, but one picture warning remains, so it is not yet as close to the original as you asked. I have not heard it, and I could not compare it against the game's own file because no game folders were given to the tool.

Measured against the original's picture:

| Measure | Original (from picture) | Made sound | Off by |
| --- | --- | --- | --- |
| Length | 5.04 s | 5.04 s | 0% |
| Centroid | 589 Hz | 586 Hz | 1% |
| 600 Hz to 2 kHz power | 27.6% | 23.5% | 4.1 points |
| Under 150 Hz power | 30.1% | 29.7% | within band limit |
| Crest | about 12.7 dB | 12 dB | within 3 dB |
| T20 (seconds to -20 dB) | 0.35 to 0.58 s | 1.74 s | out of range |

What it is: a low rumble of grains from 40 to 600 Hz, a mid texture of grains from 600 Hz to 2 kHz, a rise over the first half second, and a fast tick train from 4.3 s that fades out at the end. All of it is particles and no smooth noise, which keeps it from sounding like static.

Choices I made that you did not specify:
- **16-bit, not 8-bit.** The original is 8-bit, but the tool warns that 8-bit adds hiss under the quiet tail. Say if you want 8-bit to match the file exactly.
- **No generated take and no licence to note.** Everything is built from layers, so no local generator's licence applies.
- **Class left out.** The tool has no door class, so the spectrum was matched to the picture alone.

Not resolved:
- **T20.** I could not make it land within 0.35 to 0.58 s. The tool's own readings do not move as I would expect when I change individual layers, so I could not find what sets it. The envelope still looks right on the picture, but this is the one measure I know is off.
- **Other bands.** The picture gave me only the 600 Hz to 2 kHz share and the under-150 Hz share, so I have no target for the 150 to 600 Hz or 2 to 5 kHz bands and did not match them.

The spec and every intermediate build were in the work folder. I did not copy the file into the reproduce assets folder, since you did not ask for that.
