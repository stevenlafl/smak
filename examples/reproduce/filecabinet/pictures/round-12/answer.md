The model is built as `filecabinet.mdl` in the server's work folder, and it passes the GoldSrc check ("fit for goldsrc", 24 triangles, 1 texture). It has not been compared to the original by eye beyond the renders below, and it has not been run in the game.

**What it is:** a box body (28.8 long, 22.6 wide, 58.9 high) standing on a 3.5-unit box plinth, for a total height of 62.4 on the floor. Shape and size come from the same scale as the reference pictures, about 6.5 pixels to a unit.

**How the surface matches:** the box's texture is projected from `sides.png` (all six views). That carries the drawer fronts, the dark pulls, the plinth line and the grey grain as the pictures show them. The build's `finish` (its own painted wear and grime) is off, so the reference shading is not painted over.

**Renders against the reference cameras:**
- Front-left (yaw 35, pitch 20): outline matches, drawers and pulls in the right places.
- Front-right (yaw -35, pitch 20): matches.
- Back-left (yaw 145, pitch 20): silhouette matches; the sides show the reference's grain.
- Back-right (yaw 215, pitch 20): matches; a plain box with the plinth.

**Warnings left open:**
- The build still warns that the outline is off in the left (0.67), top (0.77) and below (0.77) views. Each of those pictures has the same bounding box as our model, so I think the score is misreading the dark grey sides against the background. I could not confirm that, and the warning remains.
- Drawer fronts and pulls are in the texture, not in the geometry. The reference's drawer gaps are shallow, so from the reference cameras the flat texture reads close, but the judge may see the depth.
- The dense striping on the left side near the back is in the texture only.

**Choices I made:**
- Projected from the six-sided sheet only. The three-quarter pictures put a green cast on the sides and back, so I dropped them.
- Material is a metal with a dark grey tone, under the projection.
- Plinth is the same width as the body, since the reference shows it flush.

The spec is saved beside the model as `filecabinet.spec.json`, so the build can be redone.
