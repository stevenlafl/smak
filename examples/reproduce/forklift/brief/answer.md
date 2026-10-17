The forklift is built and the build says OK. It is `forklift.mdl`, written to the work folder as `forklift.mdl` (166,876 bytes), with its spec alongside as `forklift.json`.

**What it is**

| Measure | Asked for | Built |
|---|---|---|
| Length (front to back, forks included) | 187 | 187 (x -91 to 96) |
| Width | 60 | 60 (y ±30, the wheels) |
| Height (overhead guard) | 113 | 113 |

- **Body:** a yellow chassis with a rear counterweight, a floor plate, and an operator's cage with posts and an overhead guard.
- **Mast and forks:** two steel uprights, a top beam, a carriage plate, two forks, and two lift cylinders.
- **Wheels:** two large drive wheels at the front and two smaller steer wheels at the rear.
- **Driver:** seated in an orange hi-vis vest, navy trousers, a white hard hat, with arms on a black steering wheel. The driver is built from simple parts, not a rigged character.
- **Texture:** one 512 by 256 picture shared by all the parts, using the kit's paint, steel, asphalt, cloth, leather and plaster materials.

**How**

I wrote the spec as a set of boxes, cylinders, tubes and superquadrics placed on the chassis, then built it. The first build passed every fault check. Its warnings were about triangles and colour, so I cut the detail that the outline doesn't show (the counterweight, steering ring and limbs have fewer sides), muted the yellow and orange a little, and removed a closing point that made the steering ring fault. The final build is OK, and `check` for GoldSrc says "fit for goldsrc". The largest sub-model draws 2520 corners, which is over the vertex count, but the check counts shared vertices, which stay under GoldSrc's limit of 2048.

**What the modder should weigh**

- **Triangles:** the model has 840. The kit's count for Half-Life's props of this size is a median of 176, with 404 the most of any. The wheels (192) and the driver (about 200) take most of it. This is above the game's own, which may matter in the side-by-side comparison. If they want it nearer the game's count, the wheels are the next thing to cut, and I can do that.
- **Colour:** the yellow paint is still at the edge of the kit's colour range (30%, against Valve's under 30%). Forklift yellow is saturated by nature, so I left it.
- **Not checked:** I could not compare it with Half-Life's own look, because the kit has no game files here. The pictures are the kit's stand-in lighting, not the game's. The check that matters is the in-game look and how it sits beside the game's models, which only they can see. The model has a single resting pose, so the wheels and mast do not move in game.
- **Installing:** it replaces the game's `models/forklift.mdl`, so it needs no code change to load. Keep the original file in the mod folder until they have compared it in game.

Pictures: `forklift-sheet.png` (six sides), `forklift-cab.png` (a three-quarter close view of the cab and driver).
