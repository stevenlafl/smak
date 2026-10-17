The model is built and the build says **OK**: `work:scientist.mdl`, with its spec at `work:scientist.spec.json` and a six-view picture at `work:scientist-sheet.png`. I have not run it in the game.

**What it is**
- **Skeleton:** Gordon's (`player/gordon/gordon.mdl`), with `floor: 0`, so the feet stand at the origin. All 77 of Gordon's animations are kept inside the file, including the walks, runs, flinches and death animations. The build raised no warning about external animation files.
- **Size:** 654 triangles. Gordon's own body is 362, and the check allows up to twice that.
- **Look:** an off-white lab coat to mid-shin, a light blue shirt with a dark red tie, dark trousers with the shoes built into them, two dark lenses with a bridge, grey hair at the back and sides with a bare crown, and a skin-coloured face.
- **How it was made:** the coat and trousers are soft blended shapes hung on the skeleton's bones, so they bend with the limbs. The shirt, neck, hair, glasses and tie are separate parts. Each hand has three fingers. The arms are aimed slightly out from the body.

**Things to know before they judge it**
- **Height is 74.6 units against the 68 asked**, about 10% over. The build passes because it is inside its tolerance, but it is tall. The height comes from Gordon's skeleton. Getting to 68 would mean a shorter base or a lower head.
- **It is blocky.** The coat is wide and boxy, the hair reads as a grey slab from behind, and the glasses are thin bars. The check's note about the coat's near-white is expected for a lab coat and was left as it is.
- **I rejected Barney's skeleton** (`barney.mdl`, which is the closest fit in size and triangle count). Forty-three of its animations live in separate files named after Barney, so a `scientist.mdl` built on it would have needed files that don't exist.
- **I could not compare it to Half-Life's own scientist.** That model's file isn't in the game folder here, so the "at least as good" call is theirs.

**To install:** copy `work:scientist.mdl` into the mod's `models` folder as `models/scientist.mdl`. The game's code usually plays animations by activity name (idle, walk, run, die), and Gordon's sequences carry those. If the mod's code plays animations by sequence number, check those numbers against Gordon's list, because they will differ from the game's own scientist.
