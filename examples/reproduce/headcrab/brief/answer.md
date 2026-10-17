The model is built and passes the engine-limit check, but it is not yet a good replacement for the game's headcrab. It is a static stand-in: it stands still and has no walk, leap, attack or hit boxes.

**What I made:** `work:headcrab.mdl` (78 KB), built from `work:headcrab.json`, the spec it came from.

| Item | Result |
| --- | --- |
| Size | 25.5 long, 16.8 wide, 12.9 high (asked: 26 long, 13 high) |
| Triangles | 228, in 9 pieces |
| Texture | one 256×256 picture, `headcrab_sheet0.bmp` |
| Build | OK, and every check passed |
| `check` for GoldSrc | "fit for goldsrc" |

**How it is made:** a dome-shaped cream shell over the legs, a pale head under its front, a cream beak pointing forward and down from under the head, four thin legs with two front legs reaching forward and out, and sharp dark-red claws on the front feet. The front of the model faces +x. The two front legs and the claws are mirrored across the middle, so each side matches. The front legs sink into the shell and head so no part floats.

**Why it is not yet at least as good as the game's:**
- It has one animation, a single still frame called `idle`. The game's headcrab has several (idle, walk, leap, attack, pain, death) that its code plays by number. Swapping this file in would most likely leave those numbers pointing at nothing.
- It has no hit boxes, so the thing could not be shot as the game's can. It also has no attachments.
- The triangle count is 228, against a kit median of 176 for creatures. This is inside the kit's range, but not lean.
- I have not seen it in the game, and this server has no game folder, so I could not put it beside Half-Life's own headcrab to compare.

**What would finish it:**
1. Give the kit the game folder that holds the original `models/headcrab.mdl`. Then I can put this shape on the game's own skeleton (the kit's "character on a game's skeleton" route), so the game's walk and leap animations keep working and drive the new body. I would also take the hit boxes from the original.
2. Writing hit boxes and extra animations from nothing needs the kit's programming interface run as a script. This server can only run the kit's command line, so that step needs someone with the kit's repository.

I took "in place of the game's headcrab.mdl" to mean a replacement under the same file name, which needs no code change in the mod. I picked the colours (cream shell, pale flesh, dark red claws) from your description. Do not install this file over the game's yet.
