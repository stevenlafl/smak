The spec is built and the build says **OK**, with every check passed. It is named `9mmhandgun.mdl` and was made from the game's own weapon files, so the hands and animations are Valve's.

**What I made**

- **Spec:** `work:9mmhandgun.json`. It is a `held` model with `weapon: { like: "9mmhandgun", size: "own" }`, and one part, a `kit:firearm` with `preset: "pistol"` and `length: 10`. That gives a 10-unit-long pistol with a receiver, frame, grip, guard, trigger, magazine, barrel and sights.
- **Files for the mod:** `work:9mmhandgun_weapon/v_9mmhandgun.mdl` (first person, with the hands), `p_9mmhandgun.mdl` (in another player's hands) and `w_9mmhandgun.mdl` (lying in the world). They keep the game's file names, so the mod's `models/` folder takes the place of the game's own. Leave Half-Life's own folder untouched and copy these three files into the mod's `models/` folder.
- **Size:** the pistol is 10 long, 1.5 wide and 6.9 high. It is 192 triangles, which is in the range the kit gives for a pistol. The `p_` and `w_` files use 112 triangles each, the lighter mesh Valve uses for those views.

**Things to know before they judge it**

- **Colour is not what the brief asked for.** The build paints the gun a dark blue-black with grey highlights. I tried setting separate black and grey tones on the frame, grip, receiver and barrel, but the build did not change at all, so the options were not applied. I left them out of the spec. A true black and grey split would need a different route, which I have not found.
- **Five joints show small gaps.** The build notes that the receiver, trigger, guard, grip and barrel nearly touch without meeting, each open by about a third of a unit. It is a note, not a fault, but it is visible when the model is viewed close.
- **I checked the pictures, not the game.** The build's pictures show the first-person view with the gun in the hand, the other-player view and the world view. I have not run it in the game, so the "at least as good as Half-Life's own" call is theirs to make there.
