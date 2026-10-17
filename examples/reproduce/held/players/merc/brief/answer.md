The model is built and passes every check: `merc.mdl` is in the work folder, and the build says OK.

**What it is**

- A mercenary built on the mod's own `player/gordon/gordon.mdl` (The Specialists' Gordon), so the skeleton, all 171 animations, the 4 attachments and the one bodypart with its 2 bodies are kept. The contract check confirms this.
- Height is 71.2 units against your requested 69, about 3% over, which is inside the 10% the check allows.
- 1,076 triangles, against 817 for the base body. The check found nothing over budget.
- No pictures were given, so nothing was carved from one. Every part is built by hand on the skeleton.

**How it looks**

- Black balaclava over the head and neck, a dark olive shirt on the torso and arms, dark khaki cargo trousers, and a dark grey plate vest with two black pouches on the chest.
- Two black pouches on each hip, a leather belt, and black leather boots.
- The shape reads as a soldier in the front, side and back views, and the run and jump frames hold together. The boots stay on the feet through the walk, crouch and jump frames.

**How I made it**

1. Torso, arms, trousers and balaclava are blobs (one smooth surface each) hung on the spine, arm, leg and head bones.
2. The vest is a box stretched down the spine, with the pouches attached to its front.
3. The belt is painted onto the torso, not built, because it is too thin for a part of its own to show.
4. The boots are two parts, one on each foot bone. Mirroring one boot put the right boot about 15 units from its ankle, because the base's feet are not symmetric.
5. The trousers' triangle count was raised, because the default reduction dropped the ankle piece and left the boots floating.

**Still to check**

- I can't run the game here, so the side-by-side comparison with Half-Life's merc is yours to make.
- The face is a plain black head, with no eye slits.
- The hands are bare ends of the sleeves, with no fingers.
- The khaki trousers read lighter than the name suggests.

To use it, copy `merc.mdl` from the work folder to `models/player/merc/merc.mdl` in the mod. The spec is saved beside it as `merc.spec.json`, so the build can be redone.
