# 36 A fat orange cat player model (model; a round cartoon character on the game's skeleton)

## The prompt (176 words)

> Garfield as a deathmatch player model, just for a test: a fat orange cartoon cat standing like a person,
> on Gordon's skeleton and animations like the other player models. A big round head with two big eyes
> under heavy half-closed lids, a wide cream muzzle with a pink nose and whiskers, small pointed ears, and
> three black stripes over the top of his head. A round body with a cream belly and black stripes across
> his back, thick orange arms with black stripes round the forearms ending in round paws, short thick legs
> with big oval feet, and a long tail curling up behind him. About as tall as a player, 72 with his head.
> Nothing may come apart when he runs, walks, crouches or jumps, and no holes. Show him running.

The character is someone else's: a test, kept local. Built on Half-Life's own player model, so its results
stay out of the repository (`.gitignore`) and `run.mjs` builds them again where the game is installed.

## The rubric (written before the spec)

| # | Item | Must | Score |
| --- | --- | --- | --- |
| 1 | On Gordon's skeleton and animations (42 bones, 77 animations kept), about 72 tall | yes | 2 |
| 2 | A big round head: big eyes under heavy half-closed lids, a cream muzzle, a pink nose, whiskers, ears | yes | 2 |
| 3 | Three black stripes over the head; black stripes across the back | yes | 2 |
| 4 | A round body with a cream belly; thick striped arms ending in round paws | yes | 2 |
| 5 | Short thick legs, big oval feet; a long tail curling up | no | 2 |
| 6 | Orange all over as the cat is; nothing apart in standing, running, walking, crouching and jumping | yes | 2 |
| 7 | Shown running | no | 2 |

**Score: 14 of 14 (100%), judged from the pictures built locally. Passes.** Plainest: the eyes read as
goggles under the lids more than a cartoon's eyes, and the belly as a patch; for the pass at higher
fidelity.

## How the prompt became the spec

- The base and the way parts hang on it are cases 19 to 21's. A big turned head sunk into the shoulders
  (no neck, as the cat has none); round turned hips and torso; thick cylinders for the limbs with spheres at
  the joints; round paws and turned oval feet; the tail a tube on the pelvis curling up behind.
- The face is set into the head's surface: the eyes spheres with pupils, each with an orange sphere over its
  top half for a heavy lid; two cream cheeks and a pink nose; whiskers out from the cheeks.
- The stripes are `marks`, painted on the head, across the back of the torso and round the forearms: they
  lie flat on the fur, so they are colour, not shape. The head's narrow to a point down the forehead; the
  belly is a cream sphere sunk into the torso's front.

## Iterations

1. The belly floated 34 units off and the stripes were open, crossed and stretched: two faults of the kit
   with parts laid along a limb (`span`). Such a part was built short (a turn's rings from 0 to 1) and
   stretched to the limb after, and what stood on it was stretched too: a band 0.9 wide on a 1 long
   forearm became most of the forearm, and a point 5 units `out` from the torso, taken along the short
   shape's normal (nearly straight up), went 80 units up. A spanned part is now made at the limb's length
   before it is built (a test in `test/46-specs.mjs`), and `out` goes along the placed surface's normal.
   That also gives a limb a picture patch of its true size: the cowboy's blocky sleeves were this.
2. Over GoldSrc's 2048 normals: fewer sides on the round parts.
3. The head was a third of the body's width and the face small: the head 1.3 times wider and sunk, the eyes,
   lids, cheeks and nose larger, the belly sunk further in. The head's stripes were dashes (a ridge narrows
   to a point at both ends unless told): full width to their ends and longer.
4. The stripes were built: six ridges and four bands, 0.2 to 0.3 units high, which changed no outline,
   caused three of iteration 1's faults and spent points and normals of a body held to 2048. They are
   painted now (`marks`, which the kit learnt for this): ten parts fewer, nothing to come apart, and
   sharper edges.
