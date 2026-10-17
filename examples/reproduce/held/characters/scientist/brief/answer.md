The model is built and the build says **OK**, but I don't think it is yet at least as good as the game's own scientist. The spec is `work:scientist.json` and the model is `work:scientist.mdl` (947 KB, one texture built in).

**What it is**

| Item | Result |
| --- | --- |
| Skeleton | Gordon's (`player/gordon/gordon.mdl`), 42 bones, all 77 of its animations kept |
| Floor | `"floor": 0`, so the feet stand at the origin |
| Height | 68.5 units against the 68 asked for |
| Triangles | 706, against 362 for Gordon's body and about 740 for Half-Life's people of this size |
| Stance | Arms hanging, 8 out, 8 forward, elbows bent 12 |

**What it looks like**

- Older man, grey hair at the sides, bald on top (grey patches on the head sides).
- White lab coat, open at the front, down to the knee.
- Blue shirt and red tie painted on the coat front.
- Light khaki trousers and dark brown shoes.
- Glasses painted on the face.

**How I built it**

- The head, hands, coat, sleeves and trousers are soft blob shapes hung on the skeleton's bones, so they bend with the animations.
- Shirt, tie, glasses and hair are painted onto the surfaces they sit on, not built, because they barely change the outline.
- Each shoe is its own part on its own foot. A mirrored copy of a left-foot part hung on the left foot, which left the right shoe floating.
- Materials: plaster skin, cloth for coat, shirt, tie, trousers and hair, metal frames, leather shoes.
- I made no picture of the scientist and used no generator, so nothing came from a generator's licence.

**Where it falls short of the game's model**

I rendered both side by side (`work:game-scientist-sheet.png` for the game's, `work:scientist-final-sheet.png` for ours). The game's has a clearly drawn face with eyes, a narrower coat that tapers at the waist, lapels, a darker tie, and more presence. Ours reads as a scientist from a distance but the coat is still a bit bulky, the face is plain and the head is small.

**Things to check in the mod**

- The animations are Gordon's, so the mod's code plays them by activity number. Walking moves at about 64 units a second and running at about 345, so the speeds the monster code sets must match or its feet will slide.
- Nothing has been put in the game folder. To test, copy `work:scientist.mdl` over `models/scientist.mdl` and compare it in the game.

If you want it closer to the game's, the next steps are a face with eyes and a mouth, lapels on the coat, and a narrower coat. I'd need a reference picture of the scientist for the face to match the game's.
