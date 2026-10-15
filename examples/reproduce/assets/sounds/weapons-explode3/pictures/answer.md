The sound is built and the build says OK: `work:sound/weapons/explode3.wav`, 22050 Hz, 8-bit, mono. It is made from layers only, so no generator or licence is involved.

It is written to the server's work folder. Copying it into the game's `sound` folder is your step, since I can't see the game folder from here.

**How it compares with the original (read off its picture):**

| Measure | Original | Built | Off by |
| --- | --- | --- | --- |
| Length | 1.30 s | 1.33 s | 2% |
| Centroid (the average pitch, in Hz) | 605 Hz | 555 Hz | 8% |
| Band under 150 Hz | 36.7% | 33.9% | 2.8 points |
| Band 600 Hz to 2 kHz | 21.2% | 23% | within tolerance |
| Tail (time to fall 20 dB) | 0.67 to 1.11 s range | 0.99 s | in range |
| Crest (peak over RMS, in dB) | about 8.1 dB | 8.6 dB | 0.5 dB |

The tolerances the report uses are 15% for centroid, 7 points for a band, and 10% for length. Every figure is inside them.

**What it is made of:** a short white-noise crack, a noise blast with a falling spectrum, a sine rumble sweeping from 95 Hz down to 40 Hz, and a debris layer of particles. It goes through a light room, saturation (drive 3) and a limiter with a 9 dB crest.

**One remaining note:** flatness is 0.043, just under the explosion class's 0.05 to 0.15 range. I traded that off against the under-150 Hz band, which matches the original better with the rumble up. Adding noise to fix flatness pulled the under-150 Hz band out of tolerance, so I kept the closer match to the original.

**Not checked:** the report has no game explosion folder to compare against (the server was given none), and it can't say how the sound plays. Please listen to it in the game and against the original, since level and room in the map change how it lands.
