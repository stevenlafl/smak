The cabinet is built and the build says **OK**. The file is `work:filecabinet.mdl`, and it passes the GoldSrc check ("fit for goldsrc").

**What it is**

- **Size:** 29 deep (front to back, pulls included), 23 wide, 62 tall. It stands on z 0, so it sits where the old one did.
- **Body:** a grey steel carcass on a dark plinth at the base.
- **Drawers:** three drawer fronts on the front face, each with a recessed seam and a raised plate.
- **Pulls:** three dark steel bars that stand off the face.
- **Lock:** a small brass disc above the top pull.
- **Finish:** grey steel with a grime level of 0.6, light wear on the edges, and a little variation between parts, so it reads as used rather than new.

**How it was made**

I wrote it as a JSON spec (`work:filecabinet.json`) and built it with SMAK. The carcass and plinth are boxes. The drawers and lock are painted panels on the front face, since they lie on the surface. The pulls are built boxes, because they stand off it by more than a unit. Each pull is attached to the front face, so its height matches its drawer. I shortened the carcass and pulls once so the whole cabinet, pulls included, is 29 deep rather than 30.7.

**Checks**

- Build: OK, no faults. 60 triangles, one 256 by 256 texture.
- GoldSrc check: fit, with 180 corners in the heaviest submodel.
- Close-up views of the front, back and underside look right.

**What I could not do**

- **Compare it with Half-Life's own.** The kit has no game files here, so I could not put the two side by side. The game's cabinet is probably more detailed: the kit's figures put a typical prop of this size at a median of 238 triangles, against our 60. Our model is well inside the engine's limits, but if the modder wants more detail, the drawers could get a rolled edge or a second texture.
- **See it in the game.** The kit's pictures are a stand-in for lighting. Judge the grime and the steel tone in-game.
- **Load it.** This file has the game's own name, so it replaces `models/filecabinet.mdl` in the mod with no code change. Copy it over the game's file in the mod's `models` folder. Keep a copy of the original.
