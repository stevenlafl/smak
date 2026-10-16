The sprite builds with "OK: built, and every check passed", but the build still prints warnings against the original. They are listed below. It is written to `work:sprites/zerogxplode.spr`, with `-sheet.png` and `-animated.png` beside it. I did not copy it into the reproduce assets folder, since you didn't ask for that.

**What the original is:** a one-shot explosion. A small grey-white flash opens in frame 0, grows to a hot white ball by frames 2 to 4, then cools to amber and brown. A lumpy smoke body rises slightly and drifts down-left, and it fades to dark by frame 14. Sparks are a few sparse dots.

**What the spec does:**
- Class `explosion`, use `tempent`, 64x64, 15 frames, not looping, 15 fps, type `parallel`, format `additive`, origin centre.
- One `billow` layer (a lit cloud) with `ramp: "reference"`, so its colours are read from the original frame by frame. Its shape is masked to the original's lit area with `mask: "reference"`. Those two choices account for most of the match.
- A short envelope (`attack` 0.35, `start` 0.3, `decay` 0.4, `gain` 1.4). The decay is what makes the last frame end dark, which the build requires.
- Six small debris dots, with no trails, for the sparks.

**Measures against the original, from the final build:**

| Measure | Original | Mine | Bar |
| --- | --- | --- | --- |
| Mean colour difference (delta E) | — | 10.6 | 15 or under |
| Share of frame that is dark | 0.72 | 0.76 | within 0.05 |
| Shape overlap (mean) | — | 0.70 | 0.8 |
| Border light | 0.818 | 0.713 | 0.08 |
| Hot middle (pixels over 0.7) | 476 | 432 | not flagged |
| Brightest frame's position | 0.36 of play | 0.29 | 0.08 |
| Last frame | — | 0 (dark) | must end dark |

**Still off:**
- **Late frames (12 to 14):** the original keeps a dim, lingering smoke, and mine fades to nothing sooner. That lowers the shape overlap to 0.70. The one-shot must end dark, so I could not hold the smoke to the last frame without breaking that rule.
- **Border light:** the original's bright edge reaches 0.82 and mine 0.71. The mask trims the edge of the cloud, and larger sizes or gains either did not help or pushed the peak too early.
- **Flicker:** the jitter is 1.59 against a half-life range of 1.04 to 1.48, so frames shift more than the reference between them.

I tried a few variants. The one above was the best balance. A larger cloud (size 1.0) and a stronger gain both helped the edges but moved the peak earlier (to frame 3 at 0.21 of play), so I kept this one. I can keep working on the late tail or the flicker if you want to push further, but those two are where I'd expect the most remaining difference.
