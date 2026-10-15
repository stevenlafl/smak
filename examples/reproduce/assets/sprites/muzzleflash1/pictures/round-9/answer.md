I built `sprites/muzzleflash1.spr` and the build says OK with no warnings left. It's in the work folder, with a contact sheet and an animated preview beside it.

It's a five-armed muzzle flash: a small white-hot centre with peach-to-tan arms pointing up, left, right, lower-left and lower-right. It's 64x64, 2 frames, type parallel, format additive, and it's set up as a temporary effect (tempent), drawn additive (render mode 5). The dark border is fully clear.

How it measures against the original:

```
measure                          original   this one
colour difference (delta E)      -          14.2  (bar is 15)
share of frame that is dark      0.76       0.77
brightest pixel                  0.91       0.91
pixels over 0.7 per frame        131        133
shape overlap (bar 0.8)          -          0.85  (frames 0.84 / 0.85)
frames                           2          2
```

- **The outline is masked to the original.** Each frame's outline is clipped to the original's lit area for that frame, so the slight shift between the original's two frames is kept. Only the outline comes from the original; the light and colour come from the flare I built. Without the mask, the shape overlap topped out around 0.67 to 0.77.
- **Colour is close to the limit.** At 14.2 it's just under the bar of 15. Brighter arms pushed it over (15.8, and up to about 25), and dimmer arms dropped the shape overlap under 0.8. This build is the balance between the two.
