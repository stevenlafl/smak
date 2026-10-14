`battery.mdl` is built. The build says OK, and the engine check passes for GoldSrc: 900 triangles, 2 textures, 1 bone. The files are in the work folder as `work:battery.mdl`, with its spec at `work:battery.spec.json`.

I compared it against `sides.png` and `front-right.png` beside the result. The shape, the colours and the position of every part match. Fine surface texture is where it falls short.

**What it has, matched to the pictures:**
- **Body:** an eight-sided column, square with its corners cut at about 1.6 units. Its bottom 1.4 units is a black base that narrows downward. At the top, a light-coloured rim slopes in to a flat grey top plate at 15.7.
- **Each of the four faces:**
  - a framed teal screen, z 5.3 to 12.7
  - a small red lamp in a white frame near the top edge
  - yellow slanted hazard strokes leaning "/", z 2 to 4.3
- **Each cut corner:** a white panel in a black border, z 9.5 to 13.9, and one hazard stroke.
- **On top:** on the −y side, a yellow flap with two grey stripes, raised at 45° on a grey hinge block. Its top edge is the highest point, at 18.5. On the +y side, a grey 12-sided nut with a dark centre on a steel block.
- **Size:** 18.5 high against the 18.4 asked for. The body is exactly 10.3 by 10.3. The overall box is 10.9 because the screen frames and lamps stand out from the faces.

**Where it differs from the original:**
- **Screen glow:** the original's glow is soft and speckled. Mine is three nested rectangles going from dark teal to near-white, so it reads as a stepped glow.
- **Hazard stripes:** the original's strokes are ragged, worn paint. Mine are clean slanted bars.
- **Bottom view:** the original is open underneath, so its inside shows nothing. My base is a two-sided sheet, which would show the grey inside, so I closed it with a dark slate panel near the bottom. From below, the inside reads as empty like the original, but it is a painted panel. The original also shows a bit of the lever and a teal sliver through the opening; mine shows neither.
- **Nut:** it's a plain cylinder. The original's has a notched skirt and a raised ring.

The build notes some parts that nearly touch, such as strokes beside the screen frames. Those gaps are deliberate, and every part still touches the body.
