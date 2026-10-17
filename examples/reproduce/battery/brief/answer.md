The model is built and passes the build and the GoldSrc check. It is at `work:battery.mdl` (in the work folder), with its spec at `battery.spec.json` and a six-side picture at `battery-sheet.png`.

**What it is:** a chunky energy cell standing on a square foot. A dark steel casing has a yellow and black hazard band near the bottom and a glowing cyan neon ring around the middle. A flat cap sits on top with a carry handle built from two posts and a bar. It is 18 units tall, 10 across in x, and 10 across in y. Its lowest point is at z 0, so it sits on the floor like the game's pickups.

**How it was made:** one spec, built in a single pass. Parts are a foot, a cylinder body (8 sides, so it reads as 10 across in both directions), a cap, two handle posts and the bar, with the hazard and neon rings painted on the body instead of built, so they add no triangles. The model has 92 triangles, which is inside three quarters of Half-Life's world pickups (104), though above their median (28). The check found no faults and fits GoldSrc's limits.

**What I could not verify:**
- **Not compared with the game's own `w_battery.mdl`.** No game models or FGD were available here, so the "at least as good" call is for you to make in game. The kit's counts are my only comparison.
- **Lighting and glow are unverified in game.** The kit's pictures use a plain stand-in light, and I haven't run anything in the engine. The neon ring should show bright in game, but only a test will confirm it.

**Choices you may want to change:**
- I read "lying on the floor" as the pickup sitting upright on the floor, because "18 tall" only works that way. If you wanted it on its side, tell me and I'll rebuild it lying along x.
- The model is named `battery.mdl`, a new file name. A new name must be loaded when the map starts: your code has to precache `models/battery.mdl` and point the battery entity at it. If you would rather it replace the game's pickup with no code change, rename it to `w_battery.mdl` and it takes the game's file's place.
