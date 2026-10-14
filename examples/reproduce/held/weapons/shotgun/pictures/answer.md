The build says **OK**: every check passed. The spec is `work:shotgun.spec.json`, the replacement files are `work:shotgun_weapon/v_shotgun.mdl`, `p_shotgun.mdl` and `w_shotgun.mdl`, and the model is 320 triangles on one texture.

**What it is**, read off the reference pictures:
- **Shape:** a chunky slate-blue stock with a drop grip, a thinner black receiver with vent slots and a rear sight, and a fore-end that flares out in two diamond-shaped bumps. In front of that are the barrel over the magazine tube, a light-grey muzzle clamp and a front sight.
- **Size:** 40.8 long and 13.4 high from the top of the sights to the bottom of the grip, matching the original. It's 5.1 thick against the original's 5.2.
- **Markings:** the brown band at the front of the pump, the blue-grey underside of the pump, faint grey ribs on the body, and a light stripe along the top of the barrel.
- **Each view:**
  - **World model:** I rendered mine from the reference's cameras. Every side shows the same outline as the original, with muzzle, stock and bumps in the same places.
  - **First person:** it's held like the original, with the muzzle pointing away and the receiver near the camera. The stock is left out, as in Valve's own first-person model.
  - **Another player's hands:** stock up and muzzle down, like `in-hand.png`.

**Things to know:**
- **A bug in the kit.** Telling the fit to keep first person as drawn (`turn: { v: "as drawn" }`) crashes with `Cannot read properties of undefined (reading 'join')`. The other options either point the muzzle at the camera or turn the gun upside down. To get around it, I built the whole gun upside down and used the `x` option for first person, which flips it upright. The other two views pick their own fit and come out right. If the bug gets fixed, the gun could be built upright with "as drawn".
- **First person isn't an exact copy.** Valve's first-person shotgun is a separate, more detailed model, with a purple chrome side plate near the camera. Mine reuses the world shape, so first person is the closest of the three views to looking different. I tried adding the plate, but it landed on the side the camera doesn't see and showed on the world model, so I took it out.
