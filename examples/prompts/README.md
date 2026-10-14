# Prompts: models and maps from a person's words

Each folder here is one request a person might make, worked through the MCP server's tool `build`: their
words (`prompt.md`), the rubric the result is held to, the spec the words were turned into (`spec.json`), and
what came back (`result/`: the report and the pictures, exactly as the server returned them). They run from
a barrel to a cyberpunk city of four shops, a street and a sewer, and they are the worked examples an agent
reads before writing a spec of its own (`docs/SPEC.md` is the reference).

| Case | What | Tests |
| --- | --- | --- |
| 01 to 05 | Models: a barrel, a street lamp, a set tavern table, a handcart, a market stall | turned parts, bands, stacks and arms, repeats about any axis, mirrors; prefabs (a lantern file, case 01's barrel reused, a kit's sword) |
| 06 to 10 | Maps: a guard room, a cottage, a watchtower, a village square, a tavern | brush prefabs, doors and steps and hatches, storeys and stairs and cellars, open sky and model props, a layout drawing and `.map` prefabs |
| 11 to 17 | A cyberpunk city in pieces | a neon lamp and a hover car (models); a noodle bar, an arcade, a sewer with its waterway, a cyber-clinic (map modules, each alone); the city that includes them all (17) |
| 18 | A Black Mesa lab | the game's own textures picked from its `.wad` files by words and colour, and the one it lacks made |
| 19 to 21 | Player models: a truck robot, a skeleton, a cowboy | a body built on Gordon's own skeleton and animations, held together in a run, a walk, a crouch and a jump; dozens of thin bones each spanned joint to joint |
| 22 to 27 | Weapons: a wrench for the crowbar, a six-shooter for the .357, a drainpipe launcher, a tin-can bomb, a lunchbox mine, a pipe shotgun | a weapon fitted into the game's v_, p_ and w_ files, its hands and animations kept; parts on the game's moving bones (a drum that swings out, a pin pulled, a pump) |
| 28 | A furnishings set in a showroom | 26 models made to be placed many times (a home's, a park's, shops'), each built and checked, shown one by one in the map's gallery; nets of `mesh` |
| 29 to 31 | Houses: a ranch, a brick two-storey, a bungalow with a garage | a building standing in the open: its shell, a gable roof, doors and windows to the outside by side; five furnished rooms |

## How a case is made and judged

1. The prompt is written as a person would ask, under 350 words; what needs more is split into pieces
   (prefabs, modules) that are cases of their own, and the larger case names them.
2. The rubric is written **before** the spec: 4 to 8 items, each scored 0 (missing or wrong), 1 (there, but
   off) or 2 (as asked), the must-haves marked. A case passes when every must-have scores 2 and the total
   is at least 85%, judged from the pictures and the report.
3. The spec is built through the server until its checks pass: for a model, no open, crowded or flipped
   edges, nothing inside out, nothing floating, nothing seen through, on the ground; for a map, no leak,
   every entity reached on foot, nothing in solid, nothing standing in a wall, compiled, every room lit.
4. Every iteration is written down in `prompt.md`: what the report or the pictures showed, and whether the
   fix was the spec's or the kit's. Many were the kit's, and each such fix has a case in `test/46-specs.mjs`.

## Change requests

A case's `revisions/` folder holds the person's follow-ups ("looks good, now add a second fridge next to
the first"): each a prompt with its rubric (`NN-name.md`) and the spec as changed (`NN-name.json`), built in
order after the case under the same name, so that its report says what changed since the build before
(`CHANGED since the last build ...: things added: ...; 21 rooms and things are where they were`). They are
scored on doing the change and leaving the rest alone. Cases 03 (a model), 13 (a map) and 18 (its textures)
have them.

## Running them again

```
node examples/prompts/run.mjs [case ...] [--work <folder>] [--compilers <folder>] [--fgd <file>] [--wads <folder>]
```

starts the MCP server as a client does and builds every case (or those named) and its revisions through
`build`, writing each `result/` afresh. The map compilers are SDHLT built beside the kit
(`../SDHLT/tools`, from `git clone git@github.com:seedee/SDHLT.git` and `cmake -S . -B build && cmake --build
build`), or VHLT_DIR; without them the maps are checked but not compiled, and say so. The FGDs (Half-Life's
from the SDK, SDHLT's own) and the game folders for `wads` are found in the Steam install when not given.

## Blind runs

```
node examples/prompts/blind.mjs <case ...> [--model <name>]
```

hands a case's prompt, and nothing else, to a fresh Claude Code agent (`claude -p`) whose only tools are
the MCP server's: no shell, no files, none of these specs. What it builds is built again into the case's
`blind/` with its answer and what the run took, and scored with the case's own rubric (the case's
`prompt.md` says how it did). This is the test of the guide and the tool themselves: whether an agent that
has never seen the kit gets from the words to a sound model or map.

## The game's files

Case 18 reads Half-Life's own `.wad` files, and the city's maps are held against Half-Life's FGD. These are
read from the person's install and never copied here (AGENTS.md, rule 7): a case built with a game's
textures keeps only its prompt, spec and score (its `.gitignore` leaves its pictures and builds out), and
`run.mjs` builds them again where the game is installed.
