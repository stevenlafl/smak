The sprite is built and the build says OK: `work:sprites/zerogxplode.spr`, with `-sheet.png` and `-animated.png` beside it. One soft warning is left: the shape match is 0.78 against a 0.8 bar, and that's all from the last three frames.

**What it is:** a one-shot fireball, 64x64, 15 frames, type parallel, format additive. It's placed as a tempent (temporary effect), render mode 5 (Additive). It starts as a small white-hot ball, grows into a lumpy cloud that rises up and to the right, cools through yellow and tan to dim brown, and throws a few specks of debris. That follows the reference sheet frame by frame.

How it compares with the original, as the build measured it:

```
measure                     reference   mine
mean colour (delta E)       -           14     (bar 15, passes)
share of frame dark         0.72        0.75
brightest                   0.91        0.91
pixels over 0.7 per frame   476         440
border brightest            0.818       0.305  (mine keeps its edge dark)
shape overlap, mean         -           0.78   (bar 0.8)
  frames 1-10               -           0.84-0.92
  frame 0                   -           0.66
  frames 12-14              -           0.61, 0.59, 0.29
```

**Why the last 0.02 didn't close:** the original's last frames leave a faint brown smear spread over most of the frame. Mine fades to dark sooner, and the build seems to force a one-shot dim at its first and last frames. A dim brown glow layer weighted toward the end of the animation helped some. Every change that pushed the shape past 0.8 also pushed the colour error to 15.5–22, though. I picked the build that passes colour and misses shape by 0.02 over one that passes shape and misses colour by a lot.

How it's made: four layers, each kept inside the reference's outline frame by frame (outline only, none of its colours):
- the lit cloud with debris, in a custom white-to-yellow-to-brown colour ramp
- a faint fireball under it to fill gaps
- a late brown glow for the fading smoke
- an early white glow for the hot first frames

One leftover: a throwaway test sprite, `work:sprites/zgtest.spr` (plus its pictures), is still in the work folder. These tools can't delete it, so it needs removing by hand.
