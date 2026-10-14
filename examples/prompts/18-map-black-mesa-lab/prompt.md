# 18 A Black Mesa lab (map, the game's own textures picked from its .wad files, a gap made)

## The prompt (212 words)

> A small Black Mesa research lab that looks like it came out of Half-Life itself: use the original
> game's textures for everything the game has. A main lab about 512 by 384 and 192 high, with the white
> lab floor tiles, the pale lab walls and a lab ceiling. In its middle, a sunken pool of glowing green
> toxic slime (the game's own slime) with a low railing round it. A corridor with a metal grating floor
> leads east to a control room, 320 by 256, lined with consoles of the game's computer panels, and in
> the middle of the control room a holographic display of the anomaly, a glowing cyan block standing on
> a pedestal. I don't think Half-Life has a hologram texture; if it doesn't, make one, and tell me which
> textures you couldn't find. Two scientists in the lab, a security guard in the control room, a
> headcrab by the slime, and I start in the lab's south-west corner. Bright fluorescent lab lighting.
> Walkable, sealed, nothing stuck in anything; tell me which game texture went where.

This case reads Half-Life's own .wad files (`halflife.wad`, `liquids.wad`) from the person's game, through the
server's `--wads` folders. They are the game's authors' (AGENTS.md, rule 7): the prompt, the spec and the
score are kept here, and the built map and its pictures, which show the game's textures, are not (this
folder's `.gitignore`); `run.mjs` builds them again where the game is installed.

## The rubric (written before the spec)

| # | Item | Must | Score |
| --- | --- | --- | --- |
| 1 | A lab 512 x 384 x 192 with the game's lab floor, lab walls and a lab ceiling (picked from halflife.wad) | yes | 2 |
| 2 | A sunken pool of the game's own toxic slime in the lab's middle, a low railing round it | yes | 2 |
| 3 | A corridor with a grating floor east to a control room 320 x 256, consoles of the game's computer panels | yes | 2 |
| 4 | A hologram in the control room: no such texture in the game, so made, glowing cyan, and the gap told | yes | 2 |
| 5 | Two scientists, a guard, a headcrab by the slime; the start in the lab's south-west corner | no | 2 |
| 6 | The report says which game texture went where | yes | 2 |
| 7 | Bright fluorescent light | no | 2 |
| 8 | Sealed, compiled with the game's .wad files, every entity reached on foot, nothing in solid | yes | 2 |

**Score: 16 of 16 (100%), judged from the pictures built locally. Passes.**

## How the prompt became the spec

- `wads: ["halflife.wad", "liquids.wad"]`, found by name in the game folders the server is given
  (`--wads`, here the Steam install's `valve`).
- Every material is a `pick` by words, and a colour where the words leave a choice: the floor
  `labflr`, the walls `labw` of a pale tone, the ceiling, the door, the slime `!toxic` (a liquid: a
  pick only takes the game's marked textures, `!`, `{`, `+`, when its words ask for them), the grating,
  the consoles' `lab1_comp`, the railing and the furniture `metal_bord`.
- The hologram: `{ pick: { words: ["holo"], else: { base: "neon", ... } } }`: no texture of the game holds
  the word, so the build makes it from `else` into the map's own .wad, which the map names beside the
  game's.
- The pool is a room `in` the lab, sunk 48, holding 40 of slime; the railing, the consoles and the
  hologram's pedestal are brush prefabs.

## Iterations

1. Clean on the first build, compiled with the game's .wad files and the map's own. The report says where
   each texture came from (the floor C1A0_LABFLR, the walls C1A0_LABW7B, the ceiling FIFTIES_CEIL01, the
   door LAB1_DOOR01, the slime !TOXICGRN, the grating FROSTGRATE, the consoles LAB1_COMP10A, the railing
   METAL_BORD05, the furniture METAL_BORD021, each with the next three it weighed) and tells the one gap:
   `hologram: a GAP in the .wad files given (no texture's name holds holo): made into the map's own .wad`.
   The floors lit 235, 250, 226, 208. The views showed the lab's tiles and walls, the green slime pool in
   its railing, the grating corridor, and the control room's computer consoles round the cyan hologram.
