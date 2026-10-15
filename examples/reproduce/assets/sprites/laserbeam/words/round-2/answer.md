I built `sprites/laserbeam.spr` and the build says **OK: built, and every check passed**.

```
size         32x64
frames       1 (still)
type         parallel
format       additive (render mode 5)
colours      111, almost nothing lost to the palette
border light 0.235 (brightest pixel 1)
dark share   0.19
```

It's made of two beam layers, both of which tile seamlessly from top to bottom:

- **White core:** a flat band about 10 px wide. It's pure white with almost no noise, so it stays just as bright along its whole length. I set it 0.04 left of centre (about 1.3 px at this size), but I couldn't confirm that from the small preview.
- **Halo:** pale cool grey (RGB 195, 205, 230) at 0.36 of the core's brightness, set a little right of centre so the right side comes out wider and brighter. It has heavy noise (0.6) and streaks (0.9), which give it the vertical striations and darker patches the description mentions, and it fades toward the left and right edges.

A few things I couldn't check:
- **No comparison to the original.** The build's comparison to Half-Life's own beams says "0 of 0 in range", so nothing was actually compared. I also had no picture of the original to measure it against.
- **Halo width is an estimate.** I only looked at the small contact sheet. Rendering it larger failed because the render tool only opens models. The 0.19 dark share fits about 3 px of black on each side, but I worked that out from the numbers rather than seeing it.
- **Brighter and dimmer stretches.** The halo's mottling should vary along the edges, but I didn't confirm that it does every 10 to 20 px.
- **Bluish outer edge.** In the preview the outer edge of the halo looks a bit bluer and harder than "soft". That may just be the sheet being drawn small. If the side-by-side shows a hard rim, lowering the streak strength should fix it.
