# 20 A skeleton player model (model; thin bones that must hold together in every pose)

## The prompt (187 words)

> A skeleton player model for deathmatch: a walking human skeleton, old yellowed bone. Build it on the game's
> own player skeleton and animations (Gordon's) so it moves like every other player model.
>
> It needs a skull with dark eye sockets with a dim red glow deep in them, a nose hole and a separate jaw
> with teeth; a spine of separate vertebrae down the back from the neck to the pelvis; a rib cage of curved
> ribs, five a side, joined at the front to a breastbone; collarbones and shoulder blades; a pelvis; long
> thin arm and leg bones with knobbly ends at the joints (shoulders, elbows, wrists, hips, knees, ankles);
> bony hands with fingers and feet with toes. Player height, about 72. It's a lot of thin bones, so be
> careful: nothing may come apart or float loose when it runs, walks, crouches or jumps, and nothing may be
> inside out. Show it running.

This case is built on Half-Life's own player model, as case 19 is: its results stay out of the repository
(`.gitignore`), and `run.mjs` builds them again where the game is installed.

## The rubric (written before the spec)

| # | Item | Must | Score |
| --- | --- | --- | --- |
| 1 | On Gordon's skeleton and animations (bones and 77 animations kept), about 72 tall | yes | 2 |
| 2 | A skull with dark sockets glowing dim red, a nose hole, a jaw with teeth | yes | 2 |
| 3 | A spine of separate vertebrae from the neck to the pelvis | yes | 2 |
| 4 | Five curved ribs a side joined to a breastbone; collarbones; shoulder blades | yes | 2 |
| 5 | A pelvis; long thin limb bones with knobbly joints at shoulders, elbows, wrists, hips, knees, ankles | yes | 2 |
| 6 | Hands with fingers, feet with toes | no | 2 |
| 7 | Yellowed bone; nothing apart in standing, running, walking, crouching and jumping; nothing inside out | yes | 2 |
| 8 | Shown running | no | 2 |

**Score: 16 of 16 (100%), judged from the pictures built locally. Passes.** The plainest parts are the
pelvis (a turned bowl) and the shoulder blades (flat plates): they read as what they are from a player's
distance, and are where a second pass would go.

## How the prompt became the spec

- `base: { file: "player/gordon/gordon.mdl" }`, as in case 19: 42 bones and 77 animations kept, the body
  put into both of Gordon's bodies.
- The long bones are cylinders `span`ned from joint to joint (`over` 0.5 to 0.6, so that they run into the
  knob at each end); the knobs are spheres `attach`ed to the joint bones. The spine is one turned column a
  bone, two bulges each, from the pelvis to the neck, so that each bend of the back bends between vertebrae.
- The ribs are tubes in the chest bones' space, mirrored, curving from the spine round to the breastbone;
  the collarbones run from the breastbone's top to each shoulder joint. The fingers lie along each hand's
  finger bone as the base holds it (the right hand grips a gun), the thumb rooted in the wrist.
- The skull is a turned shell on the head bone; the sockets and the nose are dark boxes set into its face,
  each with a small `neon` box deep inside for the glow; the teeth are separate small boxes round the front of
  its rim, and the jaw a U-shaped tube under them whose ends rise to the skull.

## Iterations

1. 3604 triangles: over GoldSrc's 2048 points and 2048 normals a submodel. Fewer sides on the spheres,
   columns, ribs and fingers: 2392.
2. The left thumb came 0.28 off the hand in the middle of the run. The pose check named only the texture;
   the kit now names the part (a written triangle is told back to its part by the pixels its corners sit on).
   The thumb was rooted at the wrist joint instead of a third of the way out.
3. The jaw was a slab wider than the face and the teeth did not show. Seven teeth above and seven below,
   round the front of the skull's rim, and a U-shaped jaw under them: it first sat at the neck (0.52 apart),
   then moved up and forward onto the teeth.
4. Three fingers and three toes looked like a cartoon's: four fingers and a thumb, five toes. 2672
   triangles, nothing apart in the five poses, fit for goldsrc.

