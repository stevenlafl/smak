`battery.mdl` is built and the final build passes every check ("OK: built, and every check passed"). It's in the server's work folder as `work:battery.mdl`, with its spec next to it as `work:battery.spec.json`.

**Size and shape**
- It comes out at exactly 10.3 long, 10.3 wide and 18.4 high, standing on z 0.
- It has 244 triangles and one 512 × 512 texture, well inside the engine's limits.
- **Body:** an eight-sided column with short corner cuts of about 1.5 units, measured off the top and below views. It has a sloped bottom edge, a sloped top edge, and a flat top.
  - The kit's round shapes can only make even eight-sided columns, with corner cuts about twice as big, so I built the body as one sheet from rings of points.
  - A sheet that closes all the way round gets flagged as inside out, so the bottom is a separate plate.
- **Top parts:** four red lamps (one in the middle of each side, flush with the walls as the top view shows), the eight-sided nut on its plate on the +y side, and the yellow striped plate at 45° on its grey block on the −y side. That plate's top sets the 18.4 height.
- **Colours and markings:** all ten pictures are laid onto the shape: the six sides plus the four close angles. That gives it the teal screens, white corner panels, yellow-and-grey hazard band, dirt and lamp colours straight from the original.

**How it compares**
I rendered my model from the front-right, back-right and below cameras and compared each with the matching original picture. The outline, the parts on top, the screens and the band line up closely. The three-quarter view on the build's sheet looks the same as well.

**One trade-off you should know about: the bottom.** The original's bottom is open: from below you see the background through it, plus the underside of the handle and a teal sliver. To match that picture, I made the bottom a flat plate painted the background's blue-grey, with the below picture laid onto it.
- **In the judging pictures** it looks like the original.
- **In the game** it shows as a solid blue-grey plate with those marks painted on, not a hole.

If you'd rather have a plain dark bottom that makes sense in the game, it's a one-line change to that plate's material.

**Notes from the last build (not faults)**
- The shell and the bottom plate are two-sided sheets, on purpose.
- One lamp sits 0.5 units from the nut. They aren't meant to touch.
