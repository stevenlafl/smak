# Paint or geometry: what Valve builds and what it paints

2026-10-16. Question (Steven, looking at the scientist built from words: "a big full diaper between his legs, and it
uses geometry rather than texture for a lot of stuff"): when should a detail be modelled, and when painted? The
answer is read off Valve's own models, measured and looked at; nothing of theirs is copied into the repository.

## Measured: the separate pieces of a model

`pieces(src, { seq: 0, frame: 0 })` on each model; a "thin" piece is under 1.5 units on its smallest side.

```
Model              pieces  triangles  thin pieces  what the thin ones are, triangles each
scientist (Valve)     50      1351        20       knuckles 3, tongue 14, teeth 6, glasses rim 5 and 4
barney (Valve)        48       865        17       sole plates 6, tongue 6, teeth 4, knuckles 2
hgrunt (Valve)        52      1212        17       hand cards 2 to 4, gun parts 6 to 10
filecabinet (Valve)    2        14         0
w_medkit (Valve)       2        99         0
scientist (ours)      30      1404         6       24 to 36 each: rounded solids (the glasses' parts)
```

So "thin is paint" is wrong: Valve models small things too. What differs is how: Valve's small geometry is a few
flat triangles (a card for the teeth, a five-triangle rim), where ours are rounded solids at 24 to 36.

## Looked at: the scientist's textures with the triangles that wear them (`smak uv`)

- **Chest:** the tie, the shirt, the belt and the coat's lapel edges are paint on one texture; single large
  triangles cross the tie. The tie is not geometry at all.
- **Pelvis, legs, arms, back:** the belt, the trousers' creases, the sleeves' folds and the coat's folds are
  painted, with their light and shade; the meshes under them are a few large triangles.
- **The coat's tail** is a panel of its own: one sheet of a few large triangles, its folds painted, hanging behind.
  The coat is open at the front: a back panel and two front edges. Nothing spans between the legs.
- **Geometry where the outline changes:** the collar ring standing off the neck; the glasses (the lenses flat
  cards with their shine painted, a rim of about five triangles); the nose.
- **The face:** all painted; eyes, brows and mouth are texture.

## The rule

1. **Paint what lies on a surface**, its shading too: folds, creases, a tie, a belt, buttons, pockets, a seam. The
   mesh under it is a few large triangles.
2. **Model only what changes the outline** at the size the game shows it, and then cheaply: a card, a ring, a rim
   of a few triangles.
3. **Build a garment as it hangs**: a coat is a back panel and open front edges, never one solid round both legs.
   One solid blended over two legs fills the space between them (the "diaper") and tears when they part.

## Measured: what changes no outline, and what it costs

The model drawn from the six sides at about the size the game shows a person across a room (2 cells a unit), and
for each piece the cells of the outline it alone covers (`src/spec/outline-parts.mjs`). A piece that alone covers 4
cells or fewer from every side changes no outline a player sees.

```
Model              pieces  no outline  their triangles, each
scientist (Valve)     50        8       knuckles 3 and 3, tongue 14, teeth 6 and 6, glasses 24, rim 5 and 4
barney (Valve)        48       23       1 to 24 (hands 24 and 9, holsters 12, soles 6, teeth 4)
hgrunt (Valve)        52        9       2 to 12 (boots, hands, the mask's filter)
scientist (ours)      11        2       ear 48, fist 72 (buried in the sleeve)
```

So Valve does keep pieces that change no outline (a lens in front of the face, teeth the mouth opens on, the
sole under a boot), but only as a few flat triangles: 24 at the most, a median of about 6. That, not "thin is
paint", is the line.

## How the kit tells it

The model build warns of a part that changes no outline from any side at 2 cells a unit and costs more than 24
triangles (Valve's most for such a piece): paint it on the part it lies on (`print`, `marks`, the material's
detail), or make it a few flat triangles. On Valve's scientist, Barney and grunt it says nothing; on the
scientist built from words it names the ears (48) and the fists (72, buried in the sleeves).

## A garment between the legs: two measures that do not tell it

Rule 3 has no check yet, because neither measure tried separates Valve's characters from the scientist built
from words:

```
Measure                                            Valve (scientist, barney, zombie, hgrunt, gman,   ours
                                                   islave, hassassin, otis)
a part encloses a point on the line between the    the scientist (its legs stand together in the      the coat
legs, from above the knee to mid-thigh             idle, so the line runs through the legs)
pieces whose corners hang on both legs             0 to 4 a model: the coat's tail, the crotch, the   the coat
                                                   trousers' front, a pelvis panel
```

What differs, by the pictures, is the shape: Valve's pieces across the legs are open sheets (a tail hanging
behind, a crotch joining the trouser legs), where the coat built from words is one closed, rounded volume round
both thighs. A check needs a measure of that; until then rule 3 is guidance.

Not yet told either: painted folds where a part's shape makes them (the coat's folds are its blob's).
