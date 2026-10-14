# Shaped noise, a limiter and a picture read back: the sound build and its first experiment

Written 2026-10-14. This builds items 5, 6 (sounds) and 8 of the build list in
`research/asset-reproduction-failures.md` and runs the first experiment of its section 4. Valve's ten
originals were read in place from `~/.steam/steam/steamapps/common/Half-Life/valve/sound` and never copied;
only their numbers appear here. I could not listen to anything: every result below is a feature or a cap,
not hearing.

To run it again: `node research/sound-shape.mjs <the game's valve folder> [--json out.json]` (about 30 s).

## What was built

| Piece | Where | What it does |
| --- | --- | --- |
| Shaped noise | `src/audio/spectral.mjs`, noise `shape`, `iterations` | Short-time Fourier frames of 512 at a hop of 128, Hann window, random phase, magnitudes from a curve of [Hz, dB] interpolated on a log scale of frequency and straight in time between keys, overlap-added. 0 dB everywhere is the kit's white noise (RMS 0.577, checked in the test). Optional fast Griffin-Lim (Perraudin, Balazs and Søndergaard 2013, momentum 0.99), its targets the magnitudes a consistent noise of that level has, so the level stays put |
| Limiter | `limitTo` in `src/audio/synth.mjs`, `finish.limit: { crest, release }` | Gain at each sample is the least that keeps the next 2 ms under a ceiling, instant attack, exponential release; the body made up to full scale; the ceiling found by halving (24 steps, log scale) until the crest of the sum, `post` layers included, is the target. The DC block runs before it when there is a limiter or a `post` layer, so the crest reached is the file's |
| `drive` | any layer | tanh of that layer alone, at its own peak |
| `post: true` | any layer | added after saturation and the limiter, its `gain` in dB of the squashed body's peak |
| `particles.every`, `jitter` | particles layer | one grain each `every` seconds, moved by up to `jitter` of that |
| Picture measures | `src/audio/picture.mjs`, `pictureMeasures`; a spec's `picture` | Reads the label (the kit's own 3x5 font, so the length), the frequency marks (so the rate), the outline, and the spectrogram's colours back to dB (`levelOf` in `src/audio/draw.mjs`, within 0.1 dB). Gives length, centroid, bands, T20, crest (about) and onsets; the build report sets the made sound's beside them as `measureSoundCopy` does |
| `fromPicture` | `src/audio/picture.mjs` | A draft spec: one noise layer with a moving `shape` (keys at the start, the loudest frame, and as it falls 6, 12, 20, 30 and 45 dB; 16 points a curve; the tone lines taken out), its envelope's points (the frames' levels, 24 at most), a `modes` layer a tone line with its level and decay. Never samples |

Existing specs build to the same bytes: all 20 round-1 sound specs (both legs) hashed before and after the
change are identical, and `test/47-audio.mjs` passes. New cases are in `test/52-sound-shape.mjs`.

## The picture read back, against Valve's files

Each original drawn as the harness draws the pictures leg's input (`soundPicture`, 960 wide), then read with
`pictureMeasures` and `fromPicture`. "Valve / picture":

| Sound | Centroid (Hz) | Bands, most off (points) | T20 (s) | Crest (dB) | Onsets | Tone lines (Hz) | Keys / envelope points |
| --- | --- | --- | --- | --- | --- | --- | --- |
| weapons/cbar_hit1 | 1343 / 1467 | 5.1 | 0.559 / 0.58 | 9.5 / 9.8 | 1 / 0 | 3036, 1077 | 5 / 14 |
| weapons/357_shot1 | 937 / 921 | 1.9 | 0.748 / 0.813 | 8.5 / 10 | 3 / 3 | none | 6 / 20 |
| weapons/sbarrel1 | 604 / 615 | 6.0 | 0.614 / 0.604 | 8.3 / 11.2 | 1 / 1 | none | 6 / 23 |
| player/pl_step1 | 853 / 902 | 13.7 | 0.09 / 0.116 | 21 / 21.8 | 0 / 1 | none | 3 / 9 |
| player/pl_metal1 | 360 / 361 | 2.9 | 0.424 / 0.441 | 15.5 / 16.3 | 0 / 0 | none | 4 / 12 |
| doors/doormove1 | 622 / 589 | 2.6 | 0.514 / 0.464 | 13.9 / 12.7 | 2 / 7 | none | 6 / 11 |
| items/smallmedkit1 | 2177 / 1936 | 4.9 | 0.673 / 0.546 | 11.1 / 11.5 | 1 / 1 | none | 5 / 20 |
| debris/bustmetal1 | 1968 / 1896 | 0.8 | 0.439 / 0.441 | 12.7 / 12.4 | 0 / 0 | none | 6 / 20 |
| weapons/explode3 | 616 / 605 | 1.7 | 0.893 / 0.871 | 5.7 / 8.1 | 1 / 3 | none | 7 / 16 |
| ambience/drips | 839 / 795 | 1.7 | 0.434 / 6.223 | 26.9 / 24.9 | 4 / 8 | none | 5 / 16 |

- Length and rate were read exactly on all ten (the label's "0" and "5" share a glyph with "O" and "S"; the
  number is read as digits).
- The crest is an estimate: the outline gives each column's peak, not its RMS. The RMS is taken as the
  columns' peaks over (2 ln m)^0.3, m the samples a column holds, a factor **fitted on these ten** (Gaussian
  noise would be (2 ln m)^0.5, which read 2 to 6 dB high). It is within 3 dB on all ten; not checked on others.
- pl_step1's bands are 13.7 points off: its first frames, 46 ms at 11025 Hz, smear a 90 ms sound.
- drips' T20 is not comparable: the picture's frames are 46 ms and the features' envelope 5 ms, and a
  plink's 5 ms peak is far over its 46 ms mean. The harness holds no T20 for a loop.
- The tone-line rule (6 dB over the rows two away, in over 60% of sounding frames) found cbar_hit1's ring only
  once a line falling between two rows was counted as one; it lit each row alone in 25 to 40% of frames.

## The experiment

Each of round 1's ten pictures-leg specs (`examples/reproduce/assets/sounds/*/pictures/spec.json`) rebuilt
five ways and held to the harness's caps against the original:

- **before**: the round-1 spec as it is.
- **recipe** (the research's recipe): its noise layers replaced by one shaped layer from `fromPicture`, its
  other layers (modes, tones, particles) and finish kept, a crack, a limiter at Valve's crest.
- **alone**: the `fromPicture` draft alone (its shaped layer and its modes), a crack, a limiter at Valve's crest.
- **blind**: as alone, the limiter at the crest read off the picture: what an agent with the picture alone knows.
- **bare**: the draft with nothing added.

The crack is 1 ms held and 3 ms falling of white noise high-passed at 2 kHz, at 0 s, `post`, gain -12 dB
(none on the loop). Caps: length within 25%, centroid within 20%, every band within 10 points, T20 within the
class's range (the original's own within a quarter, or 0.05 s, where there is no class; none for the loop),
crest within 2 dB. S2 is length and T20, S3 centroid and bands, as `measureSoundCopy` caps them.

| Way | length | centroid | bands | T20 | crest | S2 | S3 | S2 and S3 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| before | 10 | 8 | 8 | 10 | 7 | 10 | 7 | 7 |
| recipe | 9 | 9 | 6 | 8 | 8 | 8 | 5 | 4 |
| alone | 10 | 10 | 6 | 8 | 8 | 8 | 6 | 5 |
| blind | 10 | 10 | 7 | 9 | 6 | 9 | 7 | 6 |
| bare | 10 | 10 | 8 | 10 | 2 | 10 | 8 | 8 |

Sound by sound (C: crest within 2 dB):

| Sound | before | recipe | alone | blind | bare |
| --- | --- | --- | --- | --- | --- |
| weapons/cbar_hit1 | S2 S3 C | S2 -- C | S2 S3 C | S2 S3 C | S2 S3 - |
| weapons/357_shot1 | S2 -- C | S2 S3 C | -- -- C | S2 -- C | S2 -- - |
| weapons/sbarrel1 | S2 -- - | -- S3 C | S2 -- C | S2 S3 - | S2 S3 - |
| player/pl_step1 | S2 S3 C | S2 -- - | S2 -- - | S2 -- - | S2 -- - |
| player/pl_metal1 | S2 S3 - | S2 S3 C | S2 S3 C | S2 S3 C | S2 S3 C |
| doors/doormove1 | S2 -- C | -- -- C | S2 S3 C | S2 S3 C | S2 S3 - |
| items/smallmedkit1 | S2 S3 C | S2 -- C | S2 S3 C | S2 S3 C | S2 S3 C |
| debris/bustmetal1 | S2 S3 C | S2 -- C | S2 -- C | S2 -- C | S2 S3 - |
| weapons/explode3 | S2 S3 - | S2 S3 C | -- S3 C | -- S3 - | S2 S3 - |
| ambience/drips | S2 S3 C | S2 S3 - | S2 S3 - | S2 S3 - | S2 S3 - |

### What it says

1. **The shaped layer reproduces the measures; the bar is met without the limiter.** bare meets S2 and S3 on
   8 of 10, the research's bar, and matches experiment A1 (S3 on 8 of 10). Its misses are pl_step1 (bands
   11.6 points, centroid 16%: the picture's smear above) and 357_shot1 (bands 10.2, just over).
2. **The limiter reaches the crest, and costs the spectrum.** With it, crest is within 2 dB on 8 of 10
   (from 2), but S3 falls to 5 to 7. Squashing a body whose envelope was already copied from Valve's clipped
   file adds clipping's spectrum a second time: bustmetal1's bands go 5 to 12 points off, 357_shot1's 10 to
   15, and explode3 squashed to 5.7 dB is a plateau whose loudest 5 ms falls late (peak at 1.1 s against
   Valve's 0.25 s), so its T20 measures 0.17 s. The bar of "S2 and S3 on 8 of 10 with the crest" is **not**
   met: the best is 6 of 10 (blind).
3. **No limiter raises a crest.** pl_step1 and drips are made 3.3 to 3.7 dB less spiky than Valve's in every
   way. Their peaks are shorter than a frame; the frame-level envelope cannot hold them. Laying the outline's
   column peaks onto the envelope was tried and dropped: it moved the peak onto a spike and broke T20 on 7 of 10.
4. **The research's recipe (keep the agent's other layers) is the worst way.** The agent's modes, tones and
   particles were tuned beside its own noise; added to a shaped layer that already holds the whole picture's
   power they push bands 12 to 16 points off on four sounds, and sbarrel1's length to 37% over.
5. **The crack does nothing for these numbers.** Cracks at 0 s or at each picture onset, at -12, -6 or -2 dB,
   left onsets unchanged (the features' flux cannot see an onset in the first frame) and at -2 and -6 dB
   forced the limiter to squash the body hard to pay for the spike, moving smallmedkit1's centroid from 18% off
   to 31% and 51% off. Whether a judge hears the crack is S1 and S4, which no number here measures.
6. **Release.** 0.05 s (the first default) squashed the head of a copied envelope: alone met S2 on 7 and T20 on 7.
   With no crack, 0.01 s, 0.005 s and 0.002 s gave alone S2 on 7, 8 and 9; 0.002 s is the default. A release that
   short is near a clipper, which is what Valve's weapons are (explode3 has 10.5% of its samples over 0.9).

Round 1's own pictures-leg specs, rebuilt by today's kit, meet S2 and S3 on 7 of 10. The failure research
counted S3 on 6 for that leg; I did not trace the one difference.

## What I could not verify

- How any of this sounds. No listening was possible here.
- How a judge scores these builds on S1 and S4 (what it is, its character). Only the harness's caps were
  measured.
- The crest estimate off a picture on any sound but these ten, from which its factor was fitted.
- Whether `fromPicture` finds tone lines on other sounds: it found them on the one of the ten that has them.

## Where it touches other code

- The MCP tool `build` calls `buildSoundSpec(spec, { games })` (`mcp/tools.mjs`), so a spec's `picture`
  resolves against the server's working folder, not `work:`. Passing `readPicture: (name) =>
  smak.unpng(readFileSync(pathOf(folders, name)))`, as its model branch does, makes it work as the other
  specs' pictures do. mcp/ was left alone.
- The harness (`examples/reproduce/assets.mjs`) could hand `fromPicture`'s measures to the judge beside the
  picture; nothing there was changed.
