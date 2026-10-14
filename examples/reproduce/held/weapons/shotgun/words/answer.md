The shotgun is built and the last build said OK. All three files are in `work:shotgun_weapon/` (`v_shotgun.mdl`, `p_shotgun.mdl`, `w_shotgun.mdl`), and each keeps the game's hands, bones and animations.

**One deviation:** the first-person file has no hooked butt. The p_ and w_ files do.
- **Why:** the fit lines the new gun up on its bounding box. The butt's 13-unit drop below the bore pushed the whole gun up into the eye line, so the barrel hid behind the receiver and a slate block filled the screen. Putting the butt on the hand bone and trying all four fit turns didn't fix it. A near-invisible needle above the gun to balance the box only half-worked: it still left a dotted line on screen and flipped the p_ and w_ fits.
- **Why I think it's faithful anyway:** the game's own first-person mesh appears to have no stock either. It has a two-triangle `bodyback.bmp` face where the stock would join, and its handle and grip textures have no triangles.
- **Result:** the first-person gun now matches the description. The receiver is closest to the camera, with a dark back face and the thin rust band. The barrel runs up and to the left to about mid-screen, the ribbed rail and bolts show on top, and the orange glove grips under the receiver.

**What each view shows**
- **Full gun:** about 42 long. The barrel and its magazine tube make up the front quarter, with a bright steel muzzle, a dark bore and a blade sight. The pump runs about 17 units, with flared top and bottom ridges, three rows of dark grooves with light bars between them, and a lug at each end. The receiver is a block 5 deep with a hump and a trigger guard. A rust band sits at the joint, then the slate-blue stock bends down about 70° to a wedge butt with a plate, 13 below the bore. The colours are olive-black gunmetal, violet-blue on the barrel and rail, and slate-blue on the stock.
- **w_:** it lies flat on its side, with the hook in the floor plane.
- **p_:** the barrel points down and the hook is at the rear, as the game's own fit places it.

**What I couldn't check**
- I couldn't look at the original models. The tools refuse files outside the work and models folders, and the game's files are under Steam. So nothing was compared side by side; every check was against the written description.
- The pump parts are on `Bone01`, which I assumed is the pump bone. In the pump and shoot animation strips I couldn't clearly see the pump slide, so that's unconfirmed.

**Rebuilding:** two specs are needed, and the order matters because each one writes only its own files.
1. Build `work:shotgun_v.spec.json` (first person only). It writes to `work:shotgun_v_weapon/`, so copy `v_shotgun.mdl` from there into `work:shotgun_weapon/`.
2. Build `work:shotgun.spec.json` (p_ and w_ only). It writes straight into `work:shotgun_weapon/`.
