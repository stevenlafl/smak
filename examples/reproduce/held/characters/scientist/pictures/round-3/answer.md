I couldn't build the scientist yet. The build needs the game's own model files, and this server doesn't have them.

**What's stuck:** A character is a body put on a game model's skeleton, so the kit has to read that model. The server's models folder is empty. It only lists the work folder (`pictures/`), and `player/gordon/gordon.mdl` is not there. The kit's guide says the models folder is set with the server's `--models` flag, and this server was started without it. I can't fix that from here, and I shouldn't change the server's configuration without your go-ahead. I also searched the kit's guide and the disk for a Half-Life install and found nothing I could read.

**What I checked:** The reference pictures are the Half-Life scientist: a bald head with grey hair at the sides, black-rimmed glasses, a white lab coat over a blue shirt with a red-and-blue striped tie, white trousers, a black belt and brown shoes. The coat hangs to mid-thigh and is open at the front. The pose is a slight forward lean with one hand at the hip. The spec for characters requires the base model, so I have no other route to a `kind: "character"` file that keeps the animations. Making a plain prop in its place would not be the model you asked for.

**What I need from you (pick one):**
1. The path to a models folder with `player/gordon/gordon.mdl` in it (for example `…/Half-Life/valve/models` or `…/Half-Life/ts/models`). Then I restart the server with `--models <that folder>` and carry on. Restarting the server is a configuration change, so I'll wait for your go-ahead.
2. Or the path to any single `.mdl` with a human skeleton that suits you better, if you have one.

Once the base is loaded, the plan is: write the spec with `floor: 0`, build the coat, shirt, tie, trousers, shoes, glasses and hair as parts, paint the markings from the reference pictures, check the report, and look at the pictures until the build says OK.
