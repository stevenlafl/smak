The model is built and the build says **OK: built, and every check passed**. It is `work:seal.mdl`, made from the spec in `work:seal.json`.

**What it is**

A character on the skeleton of `player/gordon/gordon.mdl`, named `seal.mdl`. It keeps the base's 34 bones and all 171 animations, and the contract with the mod's code is kept: bones, animations in order, attachments and bodyparts. The spec has `contract: { file: "player/gordon/gordon.mdl" }`, so the build checks it.

| Part | Material | How it is built |
| --- | --- | --- |
| Fatigue jacket and sleeves | muted olive cloth | soft blob over the torso and arms |
| Fatigue trousers | muted olive cloth | soft blob over the hips and legs |
| Dark vest, front and back | dark olive cloth | two squared plates on the chest |
| Vest pouches (two per side) | dark olive cloth | small squared boxes on the vest |
| Boots | black leather | squared blocks on the calves, reaching the feet |
| Gloves | near-black cloth | soft blobs on the hands |
| Balaclava | black cloth | squared shape over the head |

It is 712 triangles against the base's 817, and the report puts it at 76.4 units tall, about 6 over the 70 asked for. That is within the 10% the build allows.

**How I got there**

The first builds failed on four things, and I fixed each one:
- The body had too many normals for the engine (2,352 against 2,048), so I capped the soft parts' triangle counts and cut the sides of the squared parts.
- The pouches and boots were far too heavy, so I reduced them.
- The boots and one pouch came apart in some frames, so I moved their anchors to the calf and chest bones.
- The vest sat inside the jacket, so I moved it out so it shows.

**What to check in the game**

- The build checked the walk, run, crouch and jump holds. I did not see every stunt, dive, roll and wall jump in a render, so please run those in-game.
- I did not compare it side by side with Half-Life's own seal model. Judging whether it is "at least as good" is yours to make.
- The look is plain: a flat olive suit, black balaclava and boots, with no face, no fingers and few small details. The vest pouches are small.
- The base the build read is the copy in the Half-Life `ts` folder (`ts/models/player/gordon/gordon.mdl`), not a copy from the mod's own folder. It has the 171 animations you described, but if the mod has its own `gordon.mdl` with a different skeleton, the spec's base should point at that file and the model should be rebuilt.
