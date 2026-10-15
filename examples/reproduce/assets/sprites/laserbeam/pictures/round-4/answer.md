The sprite is built but the build does not say OK. One fault remains, and the original shows the same thing.

**What I built:** `sprites/laserbeam.spr` in the work folder, with its sheet and animated picture beside it.

- **Shape and size:** 32 by 64 pixels, one frame, a vertical beam filling its frame edge to edge, with a flat bright core and soft shoulders.
- **Colour:** a pale blue-white, `[0.8, 0.9, 1]`.
- **Type and format:** `parallel`, `additive` (black is clear), placed as an `env_sprite` with render mode 5 (Additive).
- **Origin:** centre.

**Against the original (the build's reference measures, since I could not open the original picture myself):**

```
measure                    original   built
colour difference (dE)     -          10.5   (15 or under is near)
border light (mean)        0.251      0.264
share dark                 0.02       0.00
shape overlap              -          0.88   (the bar is 0.7)
```

**The one remaining fault:** "light at its border". The original has light at its border too (mean 0.25), so fading the edge to clear the fault moves the sprite away from the original. I tried edge fades of 2, 4, 6 and 10 pixels. Each time the fault stayed, and the colour difference and shape overlap got worse as the fade grew. At 2 pixels the match is closest. The build clears the fault only if the border goes near-black, which the original does not do.

**Choices I made:**
- Used the flat beam profile, because the round profile left too much of the frame dark.
- Used a pale blue-white colour, because white and red both measured further from the original.
- Kept a 2-pixel edge fade, which gave the closest match.

**Decision for you:** keep the sprite as it is, matching the original and carrying its border fault, or clear the fault by dropping the border light, which moves it away from the original. I recommend keeping it as is, since the original has the same border.
