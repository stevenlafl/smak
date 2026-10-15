`sprites/fire.spr` builds with OK, and I'm stopping at the second build. I have no reference sheet of the original, so I judged it by eye and by the report's checks.

- **Spec:** 32x96, 15 frames plus the first frame again at the end so it loops. Type is parallel oriented, format additive, drawn from its base at 10 frames a second.
- **Shape:** I widened and lengthened the flame after the first build, which came out too short and thin. It now reaches close to the top edge.
- **Checks:** All 5 report checks are in range against Half-Life's own fire loops.
- **Border:** The border is almost dark (0.002). The brightest border pixel is 0.102, which I take to be the soft fade at the base.
- **Numbers:** About 76% of the sprite is dark and the loop wrap is 0.86.
- **Colours:** The ramp runs yellow-orange through orange to dark red. It has no blue and no smoke.

I didn't tune further against the description. The tongues, the flicker and the height variation are whatever the stock `fire` layer produces.
