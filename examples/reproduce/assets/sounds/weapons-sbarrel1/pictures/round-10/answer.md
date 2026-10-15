The sound builds OK: `work:sound/weapons/sbarrel1.wav`, 22050 Hz, 16-bit mono, 1.04 s long, matching the original's length. Its report puts all 22 of its features within the game's gunshot range.

The spec is layers only, with no generated take, so the generator licence question doesn't arise.

**What it is:** a white-noise blast with a spectrum shaped to the original's (strongest below 600 Hz, falling off above 2 kHz), a 110 Hz sine that sweeps down to 45 Hz for the low thump, and a sparse grain tail. The finish saturates at 8 and has no limiter. The sound comes out at T20 0.644 s, T40 1.023 s, centroid 702 Hz, crest 11 dB and RMS -11.5 dBFS.

**Where I departed from the original:**
- **Bit depth:** 16-bit, not the original's 8-bit. The spec warns that 8-bit adds a hiss under the quiet tail that reads as static. Say if you want 8-bit to match the original's format.
- **No measurements of the original:** the picture path was refused because it is outside the work folder, and I couldn't copy it in, so the original's numbers were never read. The comparison is by eye on the two pictures, plus the game's gunshot ranges. Both pictures show a sharp onset, a dense early blast, and a thin tail to about 1 s, but I haven't measured the original's crest or RMS, so "as close as I can" is judged by eye, not by numbers.
- **Not in the game yet:** I haven't put it in a mod's `sound` folder or heard it in a game. The report says the game's volume, pitch and map room can't be checked here, so listen to it in the game before you call it done.
