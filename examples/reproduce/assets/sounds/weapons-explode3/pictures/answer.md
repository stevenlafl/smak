The build says OK: `weapons/explode3.wav` is written to the work folder under `sound/weapons/explode3.wav`, ready to go in a mod's `sound` folder.

I could not compare it against the original wav. The input folder holds only the spectrogram picture and a facts line, so every match below is against numbers read off that picture, and I have not listened to either file.

| Feature | Original (from picture) | Made |
|---|---|---|
| Length | 1.3 s | 1.30 s |
| Attack | at the start | 5 ms |
| T20 (time to −20 dB) | about 0.67 to 1.11 s range | 1.09 s |
| Centroid | about 605 Hz | 629 Hz |
| Band under 150 Hz | about 37% | 36% |
| Band 150 to 600 Hz | about 36% | 39% |
| Crest | about 8.1 dB | 8.5 dB |

All 22 explosion-class features are in range, and the build reports no faults.

How it is made:
- **Body:** one of four generated grenade-explosion takes (seed 0, 48 kHz), high-passed at 150 Hz and low-passed at 3.5 kHz, with an envelope that is loudest at the start and falls over about 1 s.
- **Low boom:** a sine tone sweeping from 110 Hz down to 40 Hz, kept quiet.
- **Grain:** short particles in the 400 Hz to 4 kHz range, falling away with the body.
- **Crack:** a short high-passed noise burst added after the limiter so the sound starts sharply.
- **Finish:** saturation at 6 and a limiter aimed at a crest of 8 dB.

Things you should know:
- **Licence:** the take comes from woosh-dflow, whose licence is CC-BY-NC 4.0 (non-commercial). You said that suits this test; I have not changed the file to work around it.
- **8-bit:** I kept 8 bits to match the original's depth. The build warns that this adds a faint hiss under the quiet tail. If that is heard as static, switching to 16 bits removes it, at the cost of not matching the original's format.
- **Not checked:** how it sounds in the game, its volume, and the map's room. The original wav is not in the input folder, so a side-by-side listen is the real test.
