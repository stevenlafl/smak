I built `medkit.mdl`, and the build says OK. It is at `work:medkit.mdl`, with its spec at `work:medkit.json`.

**What it is:** a white case lying flat on the floor, 35 long, 26 wide and 7 high (about 7.4 with the strap). The case has a red cross on the top, "FIRST AID" in red on the front end, and a dark cloth carry strap lying along the top, off centre.

**How it was made:**
- The case is one box, with the cross as two flat red panels on its top and the lettering as a print on its front face.
- The strap is a thin box on top of the case.
- The materials are paint for the case and the cross, and cloth for the strap. Paint tones were kept within the range of the game's own walls, so the white is a used grey and does not look like a toy.
- The default finish adds light, edge wear, grime near the floor and slight variation between parts.

**Checks:**
- The build reports 24 triangles. Half-Life's pickups lying in the world have 28 at the median and 104 at the third quartile, so this is at or under the game's own weight. I set a budget of 104, and it passes.
- The GoldSrc check says "fit for goldsrc".
- I checked the six-sided picture and the three-quarter view. The lettering reads and the cross is centred.

**What I could not do:**
- I could not open the game's own `w_medkit.mdl` here. The models folder holds no game files, so I could not put the two side by side in the build or measure the game's model directly. The triangle comparison above uses the guide's figures for Half-Life's pickups.
- I could not see it in the game. That comparison is for you to make.

**To use it in place of the game's pickup:** it has to be installed under the game's file name, `w_medkit.mdl`, in the mod's `models` folder. A file that replaces one the game already loads needs no code. Under the name `medkit.mdl` it would be a new model that the mod's code must name at map start.

**Choices I made that you may want to change:**
- The carry strap is a flat strap lying on top, not a loop handle. A loop would need more triangles, and it would still be a few more than the case itself.
- The cross is on the top and the lettering is on the front end. Moving either is a small spec change and a rebuild.
