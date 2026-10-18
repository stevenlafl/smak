The visor now reads as a visor, but I could not fix the white streaks. The model is built and the build says OK, with the same warnings as before.

**What I changed**
- **Visor:** added a dark blue-grey plate across the front of the helmet, on the head bone. The first try floated 1 unit off the helmet, so I moved it in. In the full front render it reads as a dark band over the eyes, separate from the helmet and the face.
- **Wear:** the default is back; I had tried turning it off as a test.

**What I tried for the streaks (none removed them)**

| Test | Result |
|---|---|
| Wear set to 0 | Streaks unchanged |
| Back picture first in the projection order | Streaks unchanged |
| Paint finish off (`finish: false`) | Streaks unchanged |
| Body given a blue-violet cloth material | Streaks unchanged |
| Side-view picture from the picture model | Not possible: all four takes came out front or back |

**Why they remain:** 15,758 texels that no picture sees (the sides and back of the legs, the boot soles, the outer edges of the hands) take the colour the front picture shows at the same height and side. At those spots the nearest colour in the picture is the white background. None of the spec's settings override that carry, so the streaks stay on the trouser backs, the soles and the hand edges. The render also shows a light line between the legs.

**What would fix it**
1. **Recommended:** a left-side photo or render of a guard in the same stance. I would project it as the `left` view and mirror it for the right, so the carry no longer reaches the legs' sides.
2. Accept the streaks as they are.
3. Build the legs and boots as their own parts. That needs the body carved rather than taken from the generated mesh, which the carve kind would make less faithful.

Which do you want? I'd go with 1.

**Still the same from the last build:** the back outline is 0.798 (just under 0.8), 45 triangles tear at the arm joints in motion, and the front look differs from the pictures (mean 14.7). The shirt, helmet, vest and trousers are as before, and the SECURITY lettering reads on front and back.

**Files:** `work:barney.mdl` is the current model, 698 triangles (650 body, 48 visor). It has not been run in the game. The test builds `barney_nofinish.json/.mdl` and their sheet are still in the work folder; I have no delete tool here, so say if you want them removed.
