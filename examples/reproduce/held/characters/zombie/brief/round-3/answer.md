The model is built and the build says OK, but I don't think it is yet as good as Half-Life's own zombie. Here is what I made and where it falls short.

**What I made**

- `work:zombie.mdl`: the model, 1.15 MB, 704 triangles, 68 units tall, feet at the origin (`floor: 0`).
- `work:zombie_hunch.json`: the model spec that built it. It is the only spec that produced the current `zombie.mdl`.
- `work:zombie-sheet.png`: six views from the build.
- The build is "OK, and every check passed." It has warnings but no faults:
  - the outline is 0.78 against the picture (under 0.8 is flagged);
  - 32 triangles where the arms meet the trunk will tear in motion;
  - the coat tears a little in running frames.

**How I made it**

1. The body came from the local shape generator (hunyuan3d-mini, non-commercial licence, which you accepted). I generated four takes from the prompt, and took seed 3: a long white coat, a green parasite-like head, and clawed hands. The generator would not follow "hunched", so the posture is from the skeleton.
2. Skeleton: `player/gordon/gordon.mdl`, with its animations kept. I used the Gordon skeleton because the scientist skeleton was refused (see below).
3. The body is a 560-triangle reduction of the mesh, sized 13 × 45 × 68, with the front picture projected onto it in its own colours.
4. Arms are aimed out at 38 degrees with the elbows bent 5, legs out 6 degrees, then bound to the skeleton.
5. The spine and neck are turned forward, which gives the hunched walk.
6. Four claw fingers on each hand, 7 units long, curled 45 degrees.

**How it compares with Half-Life's zombie (rendered strips in `work:game_zombie_walk.png` and `work:zombie_final_walk.png`)**

- The walk is hunched with the head down, which is closer to the game's. The game's zombie is more bent and has long, thin, tentacle-like arms.
- The left hand's claws float about 30 units off the mesh hand. The right hand's claws sit correctly. The build did not flag it.
- Blood is not painted. The coat only has the colour from the picture.
- Gordon's skeleton has no melee attack animation. The zombie's code asks for one by activity number, and the game's zombie has two slash animations for it. So in the game this model probably will not swing. This is my reading of the contract, not something I could run in the game.
- I could not test anything in the game. I only have the renders and the build report.

**What blocks the better base**

The scientist skeleton has walk, run, death and a melee-type activity (its "give shot" animation), so it would suit a monster better than Gordon. The kit refused it for the arm aim with "walk: needs a wider scale, and lying_on_back is kept in another file". I could not get round that, so I used Gordon.

**Suggested next steps**

- Fix the left claws, probably by regenerating the body with its arms apart.
- Find a base with a melee animation, or make the scientist base work with the kit.
- Paint blood on the coat with `finish` or a stained picture.
