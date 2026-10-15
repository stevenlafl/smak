The drip loop is built, and the build says OK with every engine check passing. It's at `work:sound/ambience/drips.wav`. Put it in `<mod>/sound/ambience/` and the game plays it in place of the original.

**What it is:** 7.31 s long, 11025 Hz, 8-bit mono, with a cue point at its start so it loops, and the seam is crossfaded. It has five main drips at the same times as the original's (0, 1.87, 3.68, 3.98 and 5.84 s), with two of them close together just as in the original. Each one is a sharp splash followed by a ringing tail of about 1.5 s, with faint tone lines in it. There are also a few faint smaller drips and splashes in between, and a constant low rumble underneath.

**Measured against the original's picture:**
```
               made      picture
length         7.31 s    7.31 s
centroid       859 Hz    795 Hz   (8% brighter)
bands          within 1.7 points everywhere
crest          23.8 dB   ~24.9 dB (the picture's is read off its outline, within 3 dB)
onsets         4         8
```
It also falls within the range of the game's own loop-drip sounds on all 20 measured features.

**Where it's still off:**
- **Onsets (separate hits the measurement detects):** it finds 4 where the original has 8. Raising the faint in-between drips by about 5 dB didn't get them counted.
- **Those faint drips:** they show in the spectrogram as thin vertical stripes. The original has fainter versions of these, so mine may read a bit more artificial side by side.
- **Late tails:** in the original, the top of the spectrogram stays a little brighter late in each tail than mine does.

The numbers can't tell you how it actually sounds, or how loud and how roomy it will be once the map's `env_sound` adds its room. You'll need to listen in the game.

**Two things to know:**
- In a modes layer, each mode's `gain` acts as a linear amplitude, not decibels. I set them as decibels at first, which silenced the main tone, and fixed it.
- I left a test file, `work:sound/test/t.wav`, from checking that. My tools can't delete it, so remove it by hand.
