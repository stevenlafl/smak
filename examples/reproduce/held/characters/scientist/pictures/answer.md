The scientist model builds with **OK** and every check passes. It's saved in the work folder as `scientist.mdl`, with its spec beside it as `scientist.spec.json`. I haven't run it in the game.

**What it is**
- It stands on Gordon's skeleton and keeps all 77 of Gordon's animations. Its feet are at the origin (`floor: 0`), and it's 68 units tall.
- The first frame is the stance the original's sheet shows: a stride with the forearms bent forward to the waist. I took that as the first frame because the sheet's side views show a stride rather than a rest pose.
- Its parts are a white lab coat with a blue shirt, a red tie, and a dark belt. The trousers are white-grey, the shoes brown, the face and hands skin, and the hair grey at the temples and back. The glasses are a black bar across the eyes.
- It has 700 triangles (Gordon's own body has 362), with no faults.

**How I matched it**
- I set the stance, arm positions and colours by eye from the sheet and the four angles. I didn't feed the original's pictures into the kit's projection, fit or motion tools, since its rules say to match a game's views by eye rather than use them as input.
- I checked the front-left camera against the original and corrected the arm splay, the stride and the hair band.

**Where it still differs**
- The glasses are a painted bar, not wire frames.
- The hair is a grey band painted on a bald-topped head, and there are no ears.
- The coat is a plain box with a flat front, with no flare at the hem and no lapels.
- The shoes are chunkier than the original's.
- The stride and the hands are matched by eye, not measured.

**Licence note:** the output keeps Gordon's skeleton and animations from your Half-Life install, so it's a derivative of the game's files. That's fine for local testing, but the kit's rules say not to share it.
