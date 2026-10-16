The model builds OK: `scientist.mdl` (with `scientist.spec.json` and a contact sheet) is in the work folder. I could not compare it against the original or run it in the game, so the side-by-side judgement is still yours.

**What it is:** a character on Gordon's skeleton (`player/gordon/gordon.mdl`), `floor: 0`, with all 77 of Gordon's animations kept. Its first frame is upright, arms hanging, legs straight, and the spine leaned forward about 11 degrees with the head forward.

**Checks:** height 68, width 22.5 (target 21.7), 708 triangles (budget 724, twice Gordon's 362). No holes, no floating parts, no fault in the run cycle.

**Where it differs from your description:**
- **Hips and hands sit high.** Gordon's skeleton puts the hip line at about 39 of 68 units (57%), not just under half, and the hands at about 36, hip level, not mid-thigh. I could not move the bones, so the legs read longer and the coat hem (about 23) sits lower than a mid-thigh coat would on the original.
- **Length is 14.8, not 33.3.** I think the 33.3 comes from a mid-stride measurement. Your description also asks for a standing first frame, so I kept the figure standing.
- **Face:** the skull is a simple faceted shape, not hollow-cheeked. The grey hair band is painted on, not modelled. The glasses, long nose, slightly prominent ears and thin mouth are there.
- **Tie:** it is red and black diagonal stripes, not navy and red. The material only offers those two colours.
- **Shirt and coat:** the blue shirt shows down a flat front panel, and the coat is a boxy shape with lapels. Trousers are the same off-white as the coat, as in your description.
- **Hit boxes** are Gordon's, not resized to a 68-unit scientist.

**Setup needed in the game:** `scientist.mdl` is a new file name, so the mod's code or scripts must name it at map start, or the engine will not load it.
