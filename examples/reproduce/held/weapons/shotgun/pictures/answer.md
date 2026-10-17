The shotgun builds OK. The build reports two warnings I did not clear, and I could not check the first-person view against the reference exactly, so read the notes below before judging it.

**Where the files are**
- `work:shotgun.json`: the spec, named `shotgun.mdl`.
- `work:shotgun.mdl`: the world model.
- `work:shotgun_weapon/v_shotgun.mdl`, `p_shotgun.mdl` and `w_shotgun.mdl`: the first-person, other-player and lying-in-the-world files. They keep the game's names, so they replace the stock ones when copied into a mod's `models` folder. I have not copied them into the game folder.

**What the model is**
- One carved body (156 triangles, 40.8 long, 13.4 wide, 5.2 high) built from the six-sided sheet and the four angle pictures, then painted from the same pictures.
- Held as `weapon: { like: "shotgun" }`, with `size: "own"` and `turn: "as drawn"`.
- I changed `turn` from the default. With the default, the gun in first person pointed up and to the right, and the attack frames did not match the reference. With "as drawn" the gun's position and size in the attack frames match the reference closely.
- The muzzle is at the high-x end and the grip at the low-x end, as the spec asks.

**Warnings left in the build**
- The outline overlap against the four side views of the sheet is 0.65 to 0.77, against the build's 0.8 line. Each side view is carved to 0.96 or better against its own picture, and the angle views are at 0.86 to 0.93, so the gap seems to come from the sheet's views themselves. I did not find the cause.
- The thin gap between the two barrels near the muzzle is still lost at the carve's resolution.
- The colour difference is 2 to 4 on average, worst at the lower middle of the right side.

**What I could not do**
- I could not read the examples folder (permission was denied), so I worked from the guide and the pictures.
- The comparison with the reference is by eye. In first person, the gun is about the right size and pose, but it is less bulky than the reference and has a more prominent sight post at the top of the muzzle.
