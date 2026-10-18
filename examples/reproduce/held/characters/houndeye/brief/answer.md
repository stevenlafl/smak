The revised houndeye builds OK with no faults, no warnings and no notes. It is at `work:houndeye.mdl`, with its spec at `work:houndeye.json` and the render sheet at `work:houndeye-sheet.png`. The render from before this revision is `work:houndeye-now.png`.

**What I changed, by the three points**

1. **Body (smooth, rounded, turtle-like shell):**
   - I removed the shell look: the two fold rings, the four lengthwise seam lines and the back ridge.
   - The body is now hunched. The shoulders rise to the front and the rump drops low.
   - Five back spines run along the shoulders and back, tallest in the middle.
2. **Paint (flat bright yellow, dark green stripes):**
   - The hide is a grimy dull mustard, which keeps the yellow but mutes it.
   - The stripes and spots are dark plum, which replaces the olive green.
   - The stripes are thinner and more broken, so they read as dapples rather than bands.
   - Wear and grime are raised, so the surface looks used.
3. **Head and eye (bulbous head, no face, legs upright):**
   - The head is a rounded wedge rather than a ball.
   - A brow overhangs the eye, a jaw sits under it, and a dark mouth slit marks the front.
   - The eye stays on the front of the head, with its red iris, black pupil and thin lid.
   - The two hind legs are splayed 28 degrees out from the body, and the front leg now angles forward. The splay is bound to the bones, so the game's own animations keep it.

**Kept as it was:** the squat yellow-brown body, three legs (two hind, one front), one large eye at the front, striped and spotted hide, and the feet on the floor (`"floor": 0`). The skeleton is still the headcrab's.

**Measures from the report:**

| Measure | Now | Asked for | Note |
|---|---|---|---|
| Height | 44.7 | 45 | the head was raised to close the gap |
| Length | 51.4 | 49 | 2.4 long, the head and spines add to it |
| Triangles | 866 | none | the median for creatures this size is 740, the third quartile 785, the most 1640 |

The previous revision had 752 triangles. The spines, brow and jaw account for the rise, and 866 is above the third quartile but well under the most.

**What the person should still judge:**
- I could not put it beside Half-Life's own houndeye, because that model is not on this machine. The three-model line-up has to be done in the game.
- The animations are the headcrab's own. The model does not have a run or a sonic-blast animation, so "runs and charges a sonic blast" is not shown.
- The body is still a turned shape with paint for the detail, and the spines are plain cones.
- The paint is flat colour with the light setting's shading, not a photographic texture.

If the person wants the hide greyer or more purple, the tone is one word in `work:houndeye.json` (`"grimy dull mustard"`), and a rebuild takes seconds.

No generator was used for this model, so no generator licence applies to it.
