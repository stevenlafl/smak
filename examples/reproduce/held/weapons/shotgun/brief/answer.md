The shotgun is built and the build says **OK**, with every check passed.

**What I made**

A held weapon spec, `shotgun.mdl`, made from SMAK's built-in shotgun part (`kit:firearm`, preset `shotgun`) and set to 30 units long. It has about 224 triangles in eight pieces. Half-Life's own first-person shotgun is about 276 to 363 triangles, so this is lighter than the game's own.

| Part | Triangles | What it is |
| --- | --- | --- |
| receiver | 28 | black metal action body |
| barrel | 32 | black metal barrel |
| magazine | 32 | tube under the barrel |
| forend (the pump) | 32 | wood |
| stock | 24 | wood (not in the first-person file, as in Valve's) |
| guard, trigger, front sight | 76 | small metal parts |

**How it was made**

1. I read the spec guide's section on weapons in place of a game's, and checked Half-Life's own `v_shotgun.mdl` for its bones and animations.
2. I wrote the spec to `work:shotgun.json`: `kind: "held"`, `weapon: { like: "shotgun", views: ["v","p","w"], size: "own", rig: "carry" }`, with one `kit:firearm` part (`preset: "shotgun"`, `length: 30`).
3. I built it. The build said OK on the first try, so I changed nothing after that.

**Files**

The game-named files are in `work:shotgun_weapon/`:

- `v_shotgun.mdl`: first person, with Valve's hands and animations
- `p_shotgun.mdl`: the gun in another player's hands
- `w_shotgun.mdl`: the gun lying in the world

To use them, copy the three files into the mod's `models/` folder. They replace the game's files of the same names, with no code changes. The first-person reference sheet, the spec and a preview sheet are also in the work folder (`shotgun.spec.json`, `shotgun-sheet.png`).

**Choices I made that they may want to change**

- **Pump:** Valve's `v_shotgun.mdl` has no separate bone for the pump. Its pump animation moves the whole gun with the arm, so this one does the same. The forend does not slide on its own.
- **Colours:** the receiver and barrel are black metal and the forend and stock are a brown wood. I did not make the wood darker. If they want a darker pump, that is a material change.
- **Length:** 30 units, to match "about 30 long".

**Not checked:** I have not run this in the game. The pictures are the build's own renders, so the mod author should compare the first-person view beside Valve's in-game.
