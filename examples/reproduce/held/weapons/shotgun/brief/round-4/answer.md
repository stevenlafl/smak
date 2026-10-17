The shotgun model is built and the build says **OK**. It is a plain blocky pump shotgun, 30 units long, with black metal and a dark wood stock and forend. I could not confirm in the viewer that the forend slides back far enough during the pump, so that needs a look in the game.

**Files** (in the work folder, `work:shotgun_weapon/`):
- `v_shotgun.mdl`: first person, with the hands
- `p_shotgun.mdl`: the weapon in another player's hands
- `w_shotgun.mdl`: the weapon lying on the floor

To install, copy the three files into the mod's `models/` folder under the same names. They replace the game's own `v_`, `p_` and `w_` shotgun files, so the mod needs no code. The spec is `work:shotgun.spec.json`, which rebuilds them.

**What I made:**

| Part | Material | Notes |
| --- | --- | --- |
| Stock | Dark wood | Box, the back of the gun |
| Butt plate | Black metal | Thin box at the back end |
| Receiver | Black metal | Main body, where the hand sits |
| Pistol grip | Black metal | Hangs under the receiver |
| Barrel | Black metal | 12 units long, 1.8 across |
| Magazine tube | Black metal | Under the barrel |
| Pump (forend) | Dark wood | Rounded block; attached to the game's `Bone01`, the bone its pump animation moves |
| Front sight | Black metal | Small box on top of the barrel |

**How it was made:** a `held` model with `weapon: { like: "shotgun", size: "own" }`, so the length is the 30 you asked for. The build fitted it over Half-Life's own shotgun files, keeping their hands, bones, animations and events. The three files come out at 348 triangles, with the first-person mesh at about 0.59 of that for the other two views.

**Choices I made that you can redirect:**
- Length: 30 units, as the modder asked, rather than the game's own shotgun length.
- The pump is on Valve's pump bone so it moves with the pump animation. The rest of the gun stays on the hand bone that carried the old one.
- The game's own shot, pump and reload sounds still play, since the names are unchanged. I did not make new sounds.

**What I checked, and what I did not:**
- The build passed all checks, including the shape, the size and the fit to the game's files.
- I rendered the first-person view, the pump animation at two frames, and the shot sequence. The gun reads as a shotgun in each.
- I could not put it beside Half-Life's own shotgun in a picture. The tools can't read the game's model files from the models folder, so the comparison has to be done in the game.
- Its shape is simpler than Valve's: flat boxes and a cylinder, not a sculpted model. The modder should judge whether it is "at least as good" in game, but I expect the game's own to look more finished up close.
- Two thin pieces (the butt plate and the front sight) were flagged as possible paint rather than solid shapes. That is only a note, not a failure.
