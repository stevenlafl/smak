I made `filecabinet.mdl` and the build says OK. The check passed for GoldSrc, with 12 triangles and one texture of 256 x 256. I did not put it beside Half-Life's own cabinet, because the game's `filecabinet.mdl` is not in the models folder here, and the kit cannot run the game. So whether it is at least as good is for the modder to judge in the game.

**What it is**

- **Size:** 62 tall, 29 deep (front to back) and 23 wide, standing on z 0 so it sits where the old one did.
- **Shape:** one box. The drawers, handles and label slots are painted on its front face, the same way the game's own cabinet is built (it has about 14 triangles, per the kit's notes).
- **Front:** four drawers, each with a recessed face, a small label holder above, and a raised dark pull.
- **Material:** steel with a muted grey tone and a little rust. The label holders are a slightly lighter grey steel. The pulls are dark iron.
- **Wear:** the finish adds light from above, rubbed edges, grime near the floor and slight variation between faces, so it reads as used.

**How I made it**

I wrote a spec and built it through the kit. The first build had the label holders close to white, which is brighter than the walls and floors of Half-Life, so I changed them to a plain grey and rebuilt. The second build passed with no warnings.

**Files, in the work folder**

- `filecabinet.mdl`: the model.
- `filecabinet.spec.json`: the spec it was built from.
- `filecabinet-sheet.png`: the six-side picture.

**To install:** copy `filecabinet.mdl` over the mod's `models/filecabinet.mdl`. It replaces the game's file under the same name, so the mod's code does not need to name it at map start.

**What I could not check**

- How it looks in the game's lighting. The kit's pictures are a plain stand-in for the engine's light.
- The label holders and pulls are painted, not built, so they show clearly close up and only as shading from across a room.
