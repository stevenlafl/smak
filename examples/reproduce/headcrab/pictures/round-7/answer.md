The headcrab is built as `work:headcrab.mdl`, and the build says OK with every check passed.

**How I made it:** The body is carved from the outlines in all ten of your pictures: the six sides and the four close angles. Then those same pictures are laid onto it as its texture. That gives it the original's colours and surface markings: the pale yellow dome with red flecks, the brown ribbed back, the red legs and the toothed mouth underneath. The small black claws at each foot were too thin to survive the carving, so I added them as four separate pointed pieces in near-black.

**How close it is:**

```
                  asked   built
length (x)        25.9    25.8
width  (y)        19.2    18.7
height (z)        13.2    13.1
```

The outline match against each picture (1.0 would be exact):

```
front 0.97   back 0.97   left 0.957   right 0.957
top 0.965    below 0.965
yaw 35 0.951   yaw -35 0.953   yaw 145 0.949   yaw 215 0.955
```

I compared it side by side with the front-left and back-left close angles and the six sides, and it reads as the same creature from every one. The same legs, posture, dome and back pattern are in the same places, and the mouth shows from below and behind.

**What still differs:**
- **Mouth:** it's a bit darker in the back view than in the original.
- **Faint lines:** there are a few thin light lines on the dome, where the texture's pieces meet.
- **Claws:** the original's tiny pale claw tips aren't there.
- **Width:** it's half a unit short, because the claw tips stick out further on the original.

**Triangle count:** it uses 364 triangles. The build warns about this because three quarters of Half-Life's props this size have under 156. That's a typical count for a creature, though, and it's well within the engine's limits. I raised it from the default 156 because at that count the claws and outer feet were lost and the width came out at only 17.3.
