I built `sprites/fire.spr` and the build says OK, with every check passing. It's a 32x96 parallel oriented additive sprite with 15 frames that loops at 10 frames a second, with its origin at the base of the flame.

The build measured it against your contact sheet:

```
                         original   mine
mean colour (delta E)       -       4.1   (15 or under counts as near)
share that is dark         0.38     0.44
border, brightest pixel    0.275    0.119
border, mean               0.028    0.010
frames                      15       15
```

How it compares by eye:
- **Same:** a wide orange flame that fills most of the frame, brightest at the bottom middle and fading to dim licks at the top.
- **Different:** mine is a bit whiter-hot at the base. It also covers a little less of the frame (44% dark against 38%), so the sides are slightly emptier.

I couldn't close those last two gaps:
- **Covering more of the frame:** making the flame any wider, or brighter, pushes light onto the frame's border, and the build fails that as a fault.
- **Less white at the base:** I tried my own colour ramp to tone it down, and it moved the colour further from yours (delta E 10). So I kept the built-in fire ramp and added a faint orange glow, which gave the closest colour.

**The loop:** the tool writes the first frame again at the end of a loop, so the engine wraps smoothly. To land on exactly 15 frames I asked for a loop of 14, which means frame 14 repeats frame 0.

The sprite is at `work:sprites/fire.spr`, with `fire-sheet.png` (all frames) and `fire-animated.png` beside it.
