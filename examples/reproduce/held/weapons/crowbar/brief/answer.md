The crowbar is built and the build says **OK**, with every check passed. It's a first pass, and the shape is cruder than the game's crowbar, so the in-game comparison will decide it.

**What I made**

- A `held` spec named `crowbar.mdl`, with `weapon: { like: "crowbar", views: ["v", "p", "w"], size: "own" }`. The spec is at `work:crowbar.spec.json`.
- The build fitted it into the game's own files, which it found in `Half-Life/valve/models/`. The three replacement files are in `work:crowbar_weapon/`:
  - `v_crowbar.mdl` (first person, with the hands)
  - `p_crowbar.mdl` (in another player's hands)
  - `w_crowbar.mdl` (lying in the world)
- The hands, bones, animations and events are the game's own. Only the weapon's meshes changed.
- The weapon is 26 long, from `size: "own"`, which keeps the length it was built at with the grip where the game's grip was.
- It is three round tubes, 96 triangles in all:
  - **Shaft:** red paint, from the grip to the claw (`red_paint`, a paint base in the "red" tone).
  - **Grip:** a bare steel sleeve over the first 10 units of the shaft.
  - **Claw:** bare steel, bent up at the far end to a point.

**How to try it**

Copy the three `.mdl` files into the mod's `models/` folder, over the game's `v_crowbar.mdl`, `p_crowbar.mdl` and `w_crowbar.mdl`. Keep the originals somewhere safe. The files keep the game's names, so the game loads them with no code change.

**Where it falls short of the brief**

- The wear is done with bare-steel parts, not with rubbed paint. The grip and the tips read as steel, but the edges of the red do not look worn.
- The shape is round tubes, so the claw is a thin hooked point rather than the game's flat bar. A flatter claw would look more like a crowbar, if the modder wants that.
- The build's pictures show only my weapon. I did not render Half-Life's crowbar beside it, so the side-by-side look is for the modder in the game.
