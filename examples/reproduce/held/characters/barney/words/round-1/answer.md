I built `barney.mdl` on Gordon's skeleton, and the last build says **OK**: every check passed, including the run, walk, crouch and jump poses.

**What it is**
- **Skeleton:** `player/gordon/gordon.mdl` is the only game model with a usable skeleton here. Barney's own model and the other people models (scientist, G-Man) aren't in the models folder. All 77 of Gordon's animations are kept.
- **Size:** 75.6 units tall, 1,892 triangles, one 512×512 texture. The legs come to about 52% of the height, matching the description.
- **Head:** a narrow, long-jawed face in peach skin with a nose, painted eyes, brows and mouth, and dark brown hair at the temples, sideburns and back. The dark grey helmet sits low on the forehead, with a violet-blue band running from the temples around the back and black pads over the ears.
- **Torso:** a black vest from the collarbone to just below the waist, with ribbed plates and a centre seam painted on. The orange emblem is on the left chest and the grey-and-white clipped badge on the right. "SECURITY" is painted across the upper back in olive-yellow block capitals. A wedge of shirt and a thin dark tie show at the neck, with a shirt collar.
- **Arms:** pale periwinkle sleeves with creases and buttoned cuffs, ending in small skin-tone fists.
- **Legs:** baggy royal blue-violet trousers with creases, a thin black belt, and a black holster on the right hip down to mid-thigh. The trousers puff at the knee and tuck into tall black laced boots with thick soles.

**Where it will differ from the original side by side**
- **Pose:** the first frame of Gordon's first animation (`look_idle`) holds the right forearm straight forward, as if holding a gun. Barney's original stands with both arms hanging, so the right arm won't match in the judge's frame-0 pictures. Changing that would mean changing the base's animations, which the brief says to keep.
- **Running:** the run cycle is Gordon's `run2`, which is 23 frames, not the 16 described. The swing and stride are close: arms swing opposite the legs and the back heel kicks up.
- **Simplified parts:** the fists are plain blocks with no fingers. The emblem's symbol and the badge are drawn small, because the texture is spread over the whole body. Even at 512×512, the eyes and badge only read up close.

Files are in the work folder: `barney.mdl`, `barney.spec.json` (the spec, which you can edit and rebuild), and `barney-sheet.png`.
