The shotgun builds OK, but it is the kit's standard pump shotgun, not the folding hooked-stock version the modder described. The folding stock and hook are not in it.

**What I made**

- A `held` spec named `shotgun.mdl` with `weapon: { like: "shotgun", size: "own", views: ["v","p","w"], rig: "carry" }`. The build fits it into the game's own `v_shotgun.mdl`, `p_shotgun.mdl` and `w_shotgun.mdl`, keeping their hands, bones, animations and events.
- One part: the firearm kit with `preset: "shotgun"` and `length: 30`. The build reports it as 30 long, 1.2 wide and 4.4 high, 224 triangles in first person and 132 in the other player's hands and in the world (Valve's lighter mesh rule).
- The build shows a black receiver and barrel, a dark pump with a grooved wooden forend, and a wooden stock, which fits the "black metal with wood" description. The first-person attack frames show the pump working.
- Files, in `work:shotgun_weapon/`: `v_shotgun.mdl`, `p_shotgun.mdl`, `w_shotgun.mdl`. The modder copies them into `<mod>/models`, replacing the game's three files. The standalone model is `work:shotgun.mdl`, and the spec is `work:shotgun.mdl.json`.

**What is missing**

- **Folding stock and hooked end.** I tried `stock: "folding"` and `forend: "pump"` in the kit options. The build accepted them without error and the shape did not change. A structured `stock` object was also accepted with no effect.
- **Hook as an extra part.** I added a tube hook and a hinge box beside the gun. Every extra part produced a second picture, and the build refuses a weapon with two pictures (`a weapon wears one picture`). I removed them, so the final build has the kit's gun alone.
- **Not checked in the game.** I looked at the build's pictures but did not open the model beside Half-Life's own in the viewer. That comparison is still for the modder.

**Options to close the gap**

1. Ask for a folding-stock option in `kits/firearmkit.mjs`, if the kit's author will add one.
2. Model the whole gun as a custom `held` mesh with its own single picture. That is more work and would not reuse the kit's parts.

I can start on either. My recommendation is option 2 if the folding stock matters to the modder, and the current build if the standard pump shotgun is good enough for them.
