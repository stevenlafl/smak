# Map pictures from photographs, and grain that is not noise (2026-10-14)

Steven walked a map built from a spec and found its textures grainy. Earlier the same day a random value a texel
(`GRAIN`, 0.16) had been added to every map picture so that it would measure like Valve's texel-level contrast
(`fine` in `src/spec/look.mjs`). White noise reads as static, and Valve's textures are photographs cut down: their
fine detail is the material's own structure. His direction: references need not be the textures themselves; an
algorithm can make a picture of the material look like Valve's set.

## The trap

**A measure that white noise can satisfy is not measuring what Valve's textures have.** `fine` is the spread of
each texel against the mean of the nine round it. Noise texel by texel raises it as surely as a pore, a grain line
or a fleck of grit does, so the kit's plaster passed at Valve's 35th percentile while looking like a detuned TV.

The measure that tells them apart is how alike a texel's grain is to its neighbours': the correlation of that
same high-pass one texel right and one down (`structure` in `lookOf`, reported as "alike"). For independent noise
it is about -0.17 (worked out: the 3x3 mean shares a third of the neighbours), and for structure that spans two
texels or more it is over 0.

| | fine | structure (alike) |
| --- | --- | --- |
| Valve, 347 walls and floors: 10th / 50th / 90th | 0.052 / 0.125 / 0.26 | 0.021 / 0.174 / 0.328 |
| Valve's concrete (53): 10th / 50th / 90th | 0.044 / 0.123 / 0.267 | 0.017 / 0.204 / 0.321 |
| Valve's wood (56, crates and boards) | 0.099 / 0.224 / 0.352 | 0.176 / 0.229 / 0.301 |
| kit plaster with the per-texel grain (before) | 0.090 | -0.157 |
| kit stone, before | 0.090 | -0.153 |
| kit wood, before | 0.108 | -0.077 |
| a grey of white noise (the test's) | over 0.052 | under 0 |

Every plain base of the kit sat at the 1st percentile of Valve's by structure: the grain was all noise. The new
fault "grain that is noise, not the material's" is said when `fine` is past Valve's 10th and `structure` under it.

## Valve's set by kind

`research/texture-stats.mjs` now splits halflife.wad by the words in names (`KIND_NAMES` in `look.mjs`;
`--names` lists the members). Their wood is twice as grainy as their concrete and far more coloured, so grain and
patches are held to the kind's 10th, colour to whichever of the kind's and the whole set's 90th is higher, and
brightness to the whole set's (a tone's lightness is the person's choice). Bricks and roofs have no kind measured:
they are held to the whole set.

| kind (count) | fine 10/50/90 | coarse 10/50/90 | colour 10/50/90 | bright 10/50/90 | structure 10/50/90 |
| --- | --- | --- | --- | --- | --- |
| wood (56) | 0.099 / 0.224 / 0.352 | 0.082 / 0.157 / 0.486 | 0.055 / 0.167 / 0.303 | 0.158 / 0.29 / 0.542 | 0.176 / 0.229 / 0.301 |
| concrete (53) | 0.044 / 0.123 / 0.267 | 0.029 / 0.07 / 0.232 | 0.022 / 0.054 / 0.135 | 0.178 / 0.29 / 0.422 | 0.017 / 0.204 / 0.321 |
| metal (34) | 0.037 / 0.233 / 0.402 | 0.032 / 0.101 / 0.242 | 0.024 / 0.047 / 0.112 | 0.114 / 0.19 / 0.493 | -0.091 / 0.253 / 0.41 |
| tile (28) | 0.044 / 0.085 / 0.178 | 0.011 / 0.041 / 0.415 | 0.028 / 0.109 / 0.212 | 0.199 / 0.296 / 0.443 | -0.041 / 0.158 / 0.229 |
| ground (15) | 0.053 / 0.129 / 0.145 | 0.042 / 0.073 / 0.115 | 0.082 / 0.152 / 0.172 | 0.265 / 0.414 / 0.57 | -0.002 / 0.146 / 0.282 |

## The procedural paint, fixed and looked at

Changes in `src/spec/paint.mjs`, each looked at enlarged (5x and 2x) beside CRETE2_WALL01, STAIN_WALL01 and
CRETE3_WALL01 before any number was read:

- The per-texel grain became **grit**: two layers of value noise that tile, cells 2 and 3.5 texels across, with a
  fifth of a texel's own noise left (`grit`, `GRIT` 0.8), at `GRAIN` 0.3.
- A map's picture is **sampled four times a texel** and averaged (`SUBTEXEL`): a pattern finer than a texel is its
  average, not a value picked from it. Noise terms finer than a pixel in `colourAt` are kept to a quarter at a
  texel a unit (`sub`).
- **Wood's grain lines** were 1.5 texels apart at a map's scale (`wood(x * 0.5)`): drawn at 0.2, about five texels
  apart, with half again their contrast (`WOOD_LINES` 1.6), as Valve's boards have. **Iron's pits** likewise drawn
  larger. **Siding's lap line** was under a texel and vanished in the average: a texel wide at least.

Tried and dropped: making the grit's specks crisp (a tanh on the noise) raised `fine` to Valve's 10th and read as
camouflage at 5x. Soft grit at 0.3 reads as stucco.

| base | fine before / after | structure before / after | what look.mjs says after |
| --- | --- | --- | --- |
| plaster | 0.090 / 0.048 | -0.157 / 0.14 | nothing (concrete's 10th is 0.044) |
| stone | 0.090 / 0.048 | -0.153 / 0.15 | nothing |
| wood | 0.108 / 0.107 | -0.077 / 0.21 | nothing |
| planks | 0.147 / 0.145 | 0.111 / 0.27 | nothing |
| door | 0.114 / 0.105 | -0.010 / 0.26 | nothing |
| iron | 0.138 / 0.071 | -0.094 / 0.08 | nothing |
| dirt, grass, cloth, paint, rope, bone, leather, snow | about 0.09 / 0.044 to 0.050 | about -0.15 / 0.12 to 0.17 | little grain |

**The decision on `fine`.** With the noise gone, the softest bases sit at Valve's 7th to 10th percentile of texel
contrast. The measure is right about that: Valve's photographs have crisp texel-level detail (a fleck is in a
texel or not), and no procedural grit tried here has it without reading as camouflage. So the measure stays, the
paint stays soft, the warning says "little grain" and names the remedy: a photograph (`picture`). Every base a
map's theme uses unless told (stone, plaster, planks, darkwood, door, siding, shingles) passes outright, so a plain
map is not warned of its own look. `test/46-specs.mjs` holds the soft list, so a base that slips is caught.

## A material from a photograph (`src/spec/reference.mjs`)

`{ "base": "plaster", "picture": "work:refs/plaster.jpg", "size": 96 }`. The filters:

- **valve** (the default): the material's detail.
  1. The crop: `rect`, or the largest rectangle of blocks like the median block in colour, brightness (within half,
     so a light falling off across the photo does not split it) and contrast for that brightness
     (`materialRect`). A skirting along a wall's foot is left out (the test's stand-in photo).
  2. Laid one texel a unit: `size` units across the crop (`DEFAULT_UNITS` by base otherwise). Where the crop is
     larger than the texture, the middle of it is taken; smaller, it repeats a whole number of times.
  3. The broad light divided out: each texel over a blur of the brightness at 18% of the crop's shorter side.
  4. Made to tile: a cross-fade of the cell's first quarter into the texels that follow it, in x then y, keeping
     the grain's strength (the difference from the mean is divided by the root of the weights' squares, so the
     fade zone is not flatter than the rest).
  5. Matched (`toValve`): the brightness split into patches (a blur of radius 1, three passes) and grain (the
     rest); each scaled (0.25 to 8 times) until `fine` and `coarse` measure inside the kind's 10th to 90th, a
     little in from the edge they were past; the colour's spread about the tone scaled down until under the
     kind's 90th; the mean colour made the tone. A photo cut down a long way (2048 pixels to 96 texels) can give
     grain that is noise again: a share of the grain blurred by a texel (0.25 steps) is mixed in until `structure`
     is 0.05 or more. Patches are not matched on a cell under 48 texels: it repeats too soon to have any.
  6. The base's structure is drawn over it with no grain of its own: a door's frame, panels, bevels and handle
     (`colourAt` takes the picture as its `surface`), a tile's grout, bricks' courses, planks' seams, metal's
     panels.
- **literal**: the crop laid over the texture as it is (repeated if `size` is smaller), made to tile only with
  `tile: true`. In a map, `size` is the texture's own size in units (a 32 by 48 poster). Not held to Valve's look.
- **aged**: literal, its light flattened at 60%, then matched as valve but keeping its own colour and with the
  brightness kept inside Valve's range instead of a tone.

### Measured on six photographs (Poly Haven CC0 scans and one Commons photo; `~/stignored/reference-textures/`)

`node ~/stignored/reference-textures/compare.mjs <kit>` writes `compare.png`: each material procedural, from its
photograph, and a Valve texture of that kind from halflife.wad (read in place). At the photographs' real sizes:

| material | photograph, size | fine | alike | what was done |
| --- | --- | --- | --- | --- |
| plaster | white_plaster_02, 39 | 0.05 | 0.16 | 4 by 4 times; grain x3.9 |
| plaster | the same, default 96 | 0.04 | 0.13 | grain x8 and softened 0.75 (the scan is very smooth) |
| stone | concrete_wall_006, 79 | 0.05 | 0.05 | the crop found at 341,85; grain x2.3, softened 0.25 |
| planks | plywood, 20 | 0.11 | 0.34 | 8 by 8 times, softened 0.75; reads as boards |
| tile | floor_tiles_06, 118, aged | 0.05 | 0.20 | the photo's own checker, made to tile |
| metal | metal_plate, 20 | 0.10 | 0.25 | 8 by 8 times |
| door | distressed_painted_planks, 63 | 0.12 | 0.21 | panels, bevels and handle over painted boards |
| door | a Fort Atkinson door, literal, rect | 0.10 | 0.24 | the door itself, stretched to 64 by 128 |

Looked at: concrete, the door over painted boards, the photographed door and the aged tiles read as material and
not noise. Small photographs at their real size repeat visibly (plaster at 39 units is a 4 by 4 grid of 32
texels): take a photo of more of the surface, or give a larger `size`. A photo with its own pattern (tiles) under
a base that draws one (tile) doubles it: SPEC.md says to give it to plaster or stone, or use aged.

## Not done

- The seam is a straight cross-fade; a cut along the least different path (image quilting) would hide it better
  where the photo has strong lines.
- A small crop repeats as a grid. Quilting patches of it at random would hide the repeat at the cost of the
  photo's own layout.
- Valve's scale: the real size of a scan is taken as one texel an inch. Whether Valve's artists drew features
  larger than that is not measured.
- A model's parts take a picture by `project`; a material's `picture` is for maps and .wads only.
