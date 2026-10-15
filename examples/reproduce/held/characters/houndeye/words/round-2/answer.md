I built **houndeye.mdl** on Gordon's skeleton, and the last build says **OK, every check passed**. The skeleton has all 42 of Gordon's bones and keeps all 77 of his animations. The model stands with its feet at its origin (`"floor": 0`).

The model is in the work folder as `houndeye.mdl`, with its spec in `houndeye.spec.json` and the six-view picture in `houndeye-sheet.png`.

| | Asked | Built |
| --- | --- | --- |
| Length | 49 | 50 |
| Width | 34 | 34.3 |
| Height | 45 | 44.6 |

**What's there:**
- **Body:** one bean-shaped lump with no neck. It sits in the top two-thirds of the height, and from above it's a teardrop narrowing to a blunt tail. The back arches highest over the shoulders.
- **Skin:** mottled olive-to-mustard. The belly and lower flanks fade to cream, with thin cyan veins, brown wrinkle lines, and a dark pore on each flank.
- **Eye:** a big oval socket on the front, tilted 12° down, with a thin pinkish-red rim. It holds 12 near-black maroon spheres in a 4x3 grid, each with a white highlight.
- **Mouth:** a dark red oval vent on the underside just behind the eye, with pale tooth ridges.
- **Back:** seven low triangular plates lean backward from behind the eye to the rump. Under them are chevron bands pointing forward that wrap down the upper sides, in cyan, chocolate brown, gold, cyan, brown and cream. From above it reads as a striped back.
- **Legs:** two front legs at the shoulders, splayed slightly outward, and one centred under the tail. Each has a wrinkled yellow-green thigh, a pale shin that bends backward, knobbly knee and ankle, and two pale cream toes forward plus one back.

**Where it falls short of the original:**
- **Movement:** Gordon is a two-legged skeleton, so the bounding three-legged gallop can't be reproduced. The two front legs hang on Gordon's hips and swing with his run. In the running frames one front leg kicks well out forward, which the original never does. The rear leg and the body ride on the pelvis, so the rear leg doesn't kick back. Separately, every animation keeps Gordon's player names (run, jump, die and the rest), not the original houndeye's.
- **Triangle count:** the report warns about 2,098 triangles, about six times the base's own 362. Half-Life puts a large monster at 500 to 1,000, so this is heavy. Most of it is in the body, the eye socket and the 12 eye spheres. It's under GoldSrc's limit of 2,048 points per body, but I can cut sides further if you want it lighter.
- **Small flaws in the face close-up:** a sliver of the dark socket shows outside the rim at its top corners, and a speck of pale skin shows between two bottom-row eyes.

I could only use Gordon's skeleton: every other monster model I tried (the headcrab, the bullsquid) said "no such file", and the models folder lists nothing else.
