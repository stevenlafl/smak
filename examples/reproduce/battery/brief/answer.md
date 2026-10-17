The model is built and passes the build and the GoldSrc check: **OK, fit for GoldSrc**. It is `work:battery.mdl` (68,592 bytes), with its spec at `work:battery.json`.

**What it is**
- A grey metal cell, 14 units tall and 7 deep, with 10 across. A stubby dark handle sits on top. The total height is 18 and it stands on the floor at z 0.
- A yellow and black hazard band runs across the bottom 3 units.
- Two green glowing panels are raised on the front face: one large, one thin.
- 36 triangles in all. The game's pickups typically have 28 at the median and 104 at three quarters, so this is in range. It uses one texture at the spec's default size, and it has one bone and no animations, as a pickup needs.

**How I made it**
I wrote it as a spec, a plain JSON description of the parts, and built it. The cell is a box with the panels set on its front face. The hazard foot and the handle are boxes attached to the cell's bottom and top. The glow is a neon material and the casing is metal. The build fitted a finish of light, wear and grime over the surfaces, so the edges read as used.

**Things to know before you compare it in the game**
- **It is not yet in the game.** I can't run the game here, so I have not seen it beside Half-Life's own. I also could not measure the game's `w_battery.mdl` against it, since its files aren't in this kit and I can't copy them. The triangle count and the height and width are the only numbers I can compare.
- **The file name needs the mod's code.** The engine only loads a model under a new file name if the map start names it. The game's HEV battery pickup is hard-wired to `models/w_battery.mdl`. To use `battery.mdl` you need to change that model path in the mod's code and precache the new file at map start. If you would rather not touch the code, the file can replace `w_battery.mdl` directly, and the game would load it with no code change.
- **The handle is a little rusty.** The iron base adds rust by default. It reads as age, but if you want a cleaner handle, set `rust` to 0 on the `grip` material in the spec and rebuild.
