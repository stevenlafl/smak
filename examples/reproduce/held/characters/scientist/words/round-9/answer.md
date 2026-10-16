The model builds OK: `work:scientist.mdl`, with its spec at `work:scientist.spec.json`. I built it from your description alone. I have no pictures of the original, so nothing here has been compared side by side with it.

**What it is**
- It stands on Gordon's skeleton (`player/gordon/gordon.mdl`) with `"floor": 0`. The 42 bones and 77 animations are kept, so the monster's sequences keep their numbers.
- The first frame of `look_idle` is posed upright and slightly stooped, with the head forward and the arms hanging, fists at mid-thigh.

**Checks against your figures**

| Item | Target | Built |
| --- | --- | --- |
| Height | about 68 | 68.2 |
| Width across the hands | about 21.7 | 23.4 (includes the fists) |
| Triangles | at most 724 (twice the base body's 362) | 688 |
| Parts | every part from the description | 16 |

The report has no faults. Its only note is that the glasses frames are 0.5 from the tie. That is intended, since the tie hangs in front of the chest.

**Choices I made that you may want to change**
- **Coat colour:** I used a light grey, not pure white (tone 0.66), because the report warns when a picture is brighter than Valve's models. If you want it whiter, the warning will return.
- **Skin, hair and tie:** pale pinkish-beige skin, grey-white hair in a band ear to ear, and a navy tie with red diagonal stripes. The tie's stripes are painted on a tube.
- **Glasses:** thick dark rectangular frames with dark lenses.
- **Shirt:** painted blue on the front of the coat, so the coat reads as open.
- **Belt and shoes:** a black belt with a grey buckle, and dark reddish-brown shoes.
- **Hands:** the arms are longer than Gordon's, so I hung the coat sleeves and fists lower to reach mid-thigh.

**Not done, and why**
- **The run and walk cycles are Gordon's**, not the scientist's. Matching the 19-frame anxious run needs a strip of reference pictures, which I don't have. The file's run is Gordon's `run2`.
- **Activities:** Gordon's file has its own activity numbers. The scientist's AI asks for activities by number, so the game may play the wrong animation for some actions. The game's code needs checking for that.
- **Bodies:** the original scientist has four bodies (glasses, Einstein, Luther, Slick). This model has one, so the entity's `body` key does nothing.
- **Hip line:** the hips sit at about 34 units, as you described. The shoulders are about where the description puts them, but I have not measured the hip line in the picture.

Since the file is named `scientist.mdl`, it replaces the game's own file, so no code change should be needed to load it. Anything beyond that is the mod's code.
