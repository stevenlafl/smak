# 21 A cowboy player model (model; a clothed person on the game's skeleton)

## The prompt (183 words)

> A cowboy player model for Half-Life deathmatch, on Gordon's skeleton and animations like the other player
> models.
>
> A tall brown cowboy hat: a wide brim curled up a little at the sides and a dented crown with a dark band.
> A tanned face with a big dark moustache, eyes and a nose, and a red bandana knotted round his neck. A
> pale blue shirt with rolled sleeves, a brown leather vest over it, open at the front. A wide belt with a
> big brass buckle and a holster with a revolver on his right hip. Blue jeans, and leather chaps over the
> front of the legs. Brown boots with heels, and a spur on the back of each. Bare tanned hands. About 72
> tall with the hat on, standing like the other player models. Nothing may come apart or pop through when
> he runs, walks, crouches or jumps, and no holes. Show me him running.

Built on Half-Life's own player model, like cases 19 and 20, so its results stay out of the repository
(`.gitignore`) and `run.mjs` builds them again where the game is installed.

## The rubric (written before the spec)

| # | Item | Must | Score |
| --- | --- | --- | --- |
| 1 | On Gordon's skeleton and animations (42 bones, 77 animations kept), about 72 tall with the hat | yes | 2 |
| 2 | A brown hat: wide brim turned up at the sides, a dented crown, a dark band | yes | 2 |
| 3 | A tanned face with eyes, a nose and a big dark moustache; a red bandana at the neck | yes | 2 |
| 4 | A pale blue shirt with rolled sleeves (bare forearms, tanned hands); a brown vest open at the front | yes | 2 |
| 5 | A wide belt, a brass buckle, a holster with a revolver on the right hip | yes | 2 |
| 6 | Blue jeans with leather chaps over the front of the legs | no | 2 |
| 7 | Brown heeled boots with a spur at each heel | no | 2 |
| 8 | Nothing apart in standing, running, walking, crouching and jumping; no holes; shown running | yes | 2 |

**Score: 16 of 16 (100%), judged from the pictures built locally. Passes.** Plainest: the hands are flat
paddles with a thumb, and the spurs are small; both are for a later pass at higher fidelity.

## How the prompt became the spec

- The base and the way parts hang on it are case 19's. The body is round where a person is: the head, the
  hips and the torso are turned (ovals wider than deep), the limbs tapered cylinders `span`ned joint to
  joint, with a sphere at each shoulder, elbow (the rolled cuff), wrist and knee so that nothing opens when
  they bend.
- The vest is the torso; the shirt shows as a strip down its front, a collar and the sleeves, which end in a
  roll at the elbow over a bare forearm. The chaps are turns along the legs with their middle moved forward
  (`off`): leather over the front, the jeans showing behind.
- The brim is a `leaf` from rows of points, an oval ring whose sides rise: a brim curled up at the sides
  in one sheet. The crown is a turn with a dimple for its top cap, on a floor that closes it.
- The hair is a turn round the head with its middle moved back: it shows behind and at the sides, under
  the face in front. The face's parts are set into the head's surface by `{ s, angle, out }`.
- The boots are a shaft on the foot bone, a foot turned along x to a rounded toe, a heel, a sole, and a
  spur with its rowel at the back.

## Iterations

1. 2058 normals: over the 2048 a body holds. Fewer sides on the legs.
2. The shirt's strip, put on a point of the torso's surface, came out at the crotch: a part laid along a
   limb (`span`) gave the parts on its surface the place it had before it was laid. The kit's fault, fixed:
   its anchors now go where the part went (a test in `test/46-specs.mjs`).
3. The brim's curl was two tubes along its sides, which read as horns from the front: the brim is now one
   sheet whose sides rise. The hair was a block on the back of the head: now a shell round it.
4. Still over the normals in the high-detail body alone, with 160 more points than the low: `putBody`
   left the old body's points and normals in the submodel, uncounted by any triangle but counted against
   the limit. The kit's fault, fixed (`clearModel`; a test in `test/06-bodies.mjs`): both bodies 1565
   points, and the skeleton and the robot lighter too.
5. The moustache was a thin line: made big, a horseshoe out from the face. 2898 triangles, nothing apart
   in the five poses, fit for goldsrc.

