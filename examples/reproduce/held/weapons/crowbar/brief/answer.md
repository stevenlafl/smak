The crowbar builds OK, and the first-person placement is fixed. Two things changed: the idle pose, and the shaft thickness, which I had got wrong in my earlier report.

**What I changed**

- **First-person placement.** The bar is 32 long, so with the game's pose its claw ran off the top of the frame. I added an `aim` key to the first-person idle (`idle1`). The key puts the claw where Valve's claw sits on screen, and the build turns the right arm and hand to do it. In my render at the same size and view, the claw is now in frame, about 10 px from Valve's claw at 640×480. I could not reproduce the reviewer's 350 px offset, so I measured against my own render.
- **Shaft thickness.** My earlier report said the shaft was "about 1.3 across", but the tube radius was 1.35, so it was 2.7 across, about twice the game's. I set the radius to 0.65 along the shaft and 0.45 to 0.55 at the head, so it is 1.3 across. The build now reports the piece as 31.8 long and 1.3 wide.
- **Grip in the attack.** The hand is drawn, but the build's attack sheet is tightly cropped, so it is small. In frames 3, 4, 6 and 7 the black glove and its orange knuckles sit at the grip. I did not change the attack animation.

**What I did not change**

- The length is still 32, as you asked. The game's crowbar is about 24, so this is longer than Valve's.
- The idle is the only animation replaced, so the modder will see a different idle pose from the game's. The attack and the other animations are the game's.
- The head is still a simple curved steel tube, and it looks lighter than Valve's dark, flattened head. The steel covers only the hook.

**How to install**

Copy the three files from `work:crowbar_weapon/` into the mod's `models/` folder: `v_crowbar.mdl`, `p_crowbar.mdl` and `w_crowbar.mdl`. They keep the game's names, so no code changes are needed.

**What I checked**

- The build reports OK with every check passed. The `v_`, `p_` and `w_` files were all built.
- I rendered the new first-person file and the game's own at the same size and view. I checked the attack frames with the same renderer.
- I have not run the game, so the modder should still compare the three files in-game beside Half-Life's.
