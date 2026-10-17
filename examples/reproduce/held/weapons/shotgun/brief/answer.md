The shotgun builds **OK**, with every check passing. It is written in `work:shotgun_weapon/` as `v_shotgun.mdl`, `p_shotgun.mdl` and `w_shotgun.mdl`, under the game's own names. The spec is `work:shotgun.spec.json`.

**What I made**

The spec is a `held` model named `shotgun.mdl`, with `weapon: { like: "shotgun" }` and length 30. It is a pump-action shotgun built from eight boxes and cylinders, 136 triangles in all:

| Part | Material | What it is |
| --- | --- | --- |
| stock | very dark wood | the butt-stock, 9 long |
| butt | black rubber | the plate at the back of the stock |
| receiver | black metal | the body, 10 long |
| grip | very dark wood | the pistol grip under the receiver |
| barrel | black metal | 11 long, to the muzzle |
| tube | black metal | the magazine tube under the barrel |
| forend | very dark wood | the pump, a wider block round the tube |
| bead | black metal | the front sight |

Metal is painted black and wood very dark brown. I changed the first build because the metal came out rusty grey-brown and the wood orange. The second build reads black metal and dark wood, though the wood leans slightly maroon in the render.

**How it fits**

- The build took the game's own `v_`, `p_` and `w_` shotgun files and replaced only the weapon meshes. The hands, bones, animations, events and attachments are the game's.
- I kept the length at 30 (`size: "own"`), so the gun is 30.1 long rather than stretched to the game's shotgun length. Change `size` to `"old"` if you want the game's length.
- The fit uses `rig: "nearest"`, so each corner follows the old gun's bone that is nearest it.

**Things to check in the game**

- **The pump:** the game's first-person file has no separate pump bone; the gun rides on one bone (`Bone01`). The forend therefore moves only as far as the game's pump animation moves the whole gun. I did not check whether that reads as a pump action in game. If it does not, the forend needs its own bone, which means a change to the animations.
- **Sounds:** I gave no sounds, so the game's shotgun sounds play.

**To try it**

Copy the three files from `work:shotgun_weapon/` into the mod's `models/` folder. They replace the game's shotgun in first person, in other players' hands and on the ground. Then compare them with Half-Life's own in game.
