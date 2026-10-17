The model is built and the build says OK: `zombie.mdl` in the work folder, with its spec beside it as `zombie.spec.json` and a six-view contact sheet as `zombie-sheet.png`.

**What it is**

- **Skeleton:** Gordon's (`player/gordon/gordon.mdl`), kept whole: all 42 bones and 77 animations, with the same numbers. Floor is 0, so it stands with its feet at its origin.
- **Size:** 68.2 units tall, against the 68 asked.
- **Body:** a torn-looking white lab coat over the torso and arms, with a tail down to the thigh; dark grey trousers; grey-green skin on the bare hands and the head.
- **Parasite:** a dull yellow-brown dome over the head, sitting on the skull.
- **Hands:** three curved claws, nine units long, on each hand.
- **Pose:** the spine and neck lean forward, and the arms hang forward with the elbows bent, so it reads as hunched. The first animation is a stride from Gordon's walk, so the model stands mid-shamble.
- **Blood:** dark red paint on the chest, the side, the skirt and one sleeve.
- **Budget:** 574 triangles, against 362 for Gordon's own body (the check's ceiling is twice that).

**How it was made**

I wrote a character spec (kind `character`, base Gordon) with a `floor` of 0. It has the coat, trousers and skin as soft blobs built along Gordon's bones, the parasite as a squashed sphere hung on the head bone, the claws as finger parts on each hand, and the blood as paint on the coat. The pose is set by `pose.from: "walk"`, a spine lean, and arm angles. The first two builds failed or misled:

- The first build had 1400 triangles, over the ceiling, and a buried tendril. I cut the blob budgets and dropped the tendrils.
- The first lean was backwards: the spine turns were negative, and in this kit a positive turn about the y axis leans the top forward. I flipped them.

**What I did not check**

- **Against the game's own zombie:** I could not compare it. The server does not expose the game's `zombie.mdl`, so `contract` was refused for it. The animation numbers match Gordon's, not the zombie's, so the game's code may play a different animation under some numbers. Please check that before you rely on it.
- **Animation 0 changed:** the first animation (Gordon's idle) is now the shamble stride. Anything that plays it as idle will shamble.
- **Hitboxes:** Gordon's 20 hitboxes come with the skeleton, but I did not check them against the zombie's hull or its attack range.
- **Looks:** I have only the contact sheet and the walk strip, not the game. Beside Half-Life's zombie is the real test, and I can't judge that from here.

**Left out, and why:** the coat is not literally torn, since a tear would need a carved or painted rip. The parasite is a dome, not a body with legs, because the legs were buried and over budget. Both are easy to add if they want them.
