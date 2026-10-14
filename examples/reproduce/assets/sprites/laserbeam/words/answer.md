The sprite is built as `sprites/laserbeam.spr` and the build says OK, with every check passing.

**What was built:** one still frame, 32 wide by 64 tall, of type `parallel` (it always faces the camera). It's drawn additively, so black counts as see-through, and the game places it as a beam in render mode 5 (Additive). It's lit all the way to the top and bottom so it tiles seamlessly along the beam's length.

**How it's layered:**
- **Core:** pure white, with no noise and the same brightness from top to bottom. It's set 0.06 units left of centre, which works out to about 2 pixels (one unit is 32 pixels).
- **Halo:** a wider beam layer in pale grey that's very slightly blue (red 0.84, green 0.86, blue 0.91), with its noise turned up high (0.75). That gives the vertical streaks and the mottled darker patches. It sits less far left than the core, so the right side of the halo comes out a little wider and brighter than the left.

In the drawn result the white core is about 8 pixels wide, and the streaky halo fades to black roughly 3 pixels from each side edge.

**Measured by the build:**

```
size            32x64, 1 frame
colours         162 after quantising (loss 0.0025)
brightest       1.0 (pure white)
border light    0.102
```

That border number is not a fault. It counts the top and bottom edges, and those are meant to be lit because the beam tiles end to end there.

**Two things I couldn't check:**
- The build had no Half-Life beam sprites to measure against ("0 of 0 in range"), so the only comparison is with the description you gave.
- I judged the core and halo widths by eye from the small preview, not by measuring pixels. The streaks run straight up and down, but I didn't confirm the brighter and dimmer stretches along the halo edges fall every 10 to 20 pixels.

The sprite file is in the work folder, with a `-sheet.png` and `-animated.png` beside it.
