I can't build the scientist yet. The character needs a game skeleton to keep its bones and animations, and the SMAK server has no game models it can read.

**What's stuck:** The build names `player/gordon/gordon.mdl` as its base, and the server's models folder is empty. The `models` listing shows only the work folder, and `info` on the Gordon file reports "no such file". Pointing `info` at the absolute path under `Projects/goldsrc.net/hlds-win/ts/models/` is refused, because the server only reads its models folder and work folder. I can't copy the file into either folder with the tools I have, and I can't restart the server.

**What I checked:** The reference pictures, the facts file (33.3 long, 21.7 wide, 68 high) and the motion strip, which together show a bald scientist with grey hair at the sides, glasses, a white coat over a blue shirt and a red-striped tie, white trousers and brown shoes. I also read the SMAK guide on characters and monsters. The guide's worked Gordon skeleton example uses the same Biped bone names I would need, so the parts can be planned against them. I have not written the spec, because the bone names and rest pose can only be confirmed from the real base file.

**What I need from you (pick one):**
1. Point the SMAK server's models folder at a folder that holds `player/gordon/gordon.mdl`. The likely source is `/media/Data3/Projects/goldsrc.net/hlds-win/ts/models/`, which is The Specialists' copy of Gordon. Restart the server with that folder set (or copy the file into the folder it already reads), then tell me and I'll build it.
2. Name a different base that is in the models folder, and I'll use that one.

Once the base loads, I'll write `scientist.mdl` with `floor: 0`, fit its stance to the reference outlines, build the coat, shirt, tie, trousers, shoes, glasses and hair, then check the report and pictures against the originals before calling it done.
