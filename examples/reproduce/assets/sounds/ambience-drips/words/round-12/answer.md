`ambience/drips.wav` is built and the build says OK. It is at `work:sound/ambience/drips.wav`: 11025 Hz, 8-bit mono, 7.31 s, looping with a cue point at its start.

I built it from layers only. No generated take is in it, so no generator licence applies.

**What it contains**

- Five drops at 0.06, 1.87, 3.68, 3.97 and 5.84 s. Each starts with a sharp splash, then a bloop that rises from 430 to 520 Hz and holds, a faint ring at 520, 610 and 690 Hz, and a 0.6 s tail.
- The drops at 0.06, 1.87 and 5.84 s are the loud ones. The drops at 3.68 and 3.97 s are softer.
- A continuous brown-noise murmur and low rumble run the whole length, so there is no silence.
- The loop tail fades out by about 6.9 s, before the first drop returns.

**Frequency shares against the brief**

```
Band        Brief   Made
<150 Hz      15%    14.5%
150-600 Hz   35%    35.2%
600-2k Hz    30%    32.3%
2k-5k Hz     18%    18.0%
>5k Hz        2%     0.1%
```

**What is still off**

- Centroid is 1025 Hz. The class of game loops sits at 671 to 1007 Hz, so it is a little bright.
- Flatness is 0.315. The class sits at 0.05 to 0.15, so the sound is noisier than a typical game loop. I tried to fix this by making the ring more tonal, but that pushed the 600 to 2k Hz share out of range, so I kept the balance.
- The report warns that the steady murmur could be heard as static. I kept it on purpose, because the brief asks for a constant hiss.
- The 8-bit depth draws a warning about hiss under the quiet tail. I kept 8-bit because the brief specifies it.

**Things I could not check**

- I have not compared it side by side with the original. No copy of the original is in the folders, so the targets come from your description, not from measuring the real file.
- The report cannot say how it sounds. Please listen to it in the game.

**Notes**

- The loop crossfade shortens the file by its own length, so I set the spec to 7.36 s to land at 7.31 s.
- The spec exists only in this session. I could not save it into the work folder from my shell, so tell me where you want the JSON written and I will put it there.
