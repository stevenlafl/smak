# 19 A truck-robot player model (model; a character on the game's own skeleton)

## The prompt (196 words)

> I want an Optimus Prime player model for Half-Life deathmatch, just as a test. Use the game's own player
> skeleton and animations (take Gordon's player model as the base) so it moves exactly like the other player
> models: same bones, same joints, every animation working.
>
> The look: a big truck robot. Red chest with two blue-tinted glass windows on it and a silver grille below
> them, a grey waist, red upper arms and forearms, chunky grey hands. Red shoulder blocks with a silver
> exhaust stack standing up on each. Blue legs, thick at the shins, with a black truck wheel on the outside of
> each shin, and grey feet. A blue helmet with a silver face plate, glowing blue eyes and a short antenna on
> each side of the helmet. About the height of a player (72 units). Nothing may come loose or fall apart
> when he walks, runs, crouches or jumps, and no holes. Show me him running.

This case is built on Half-Life's own player model (`player/gordon/gordon.mdl`, from the person's install by
the server's `--wads` game folders): its skeleton and its 77 animations are the game's authors'. The prompt,
the spec and the score are kept here; the built model and its pictures are not (`.gitignore`); `run.mjs`
builds them again where the game is installed. The character is someone else's too: a test, kept local.

## The rubric (written before the spec)

| # | Item | Must | Score |
| --- | --- | --- | --- |
| 1 | On Gordon's skeleton and animations: the base's bones and all 77 animations kept, the body replaced in both its bodies | yes | 2 |
| 2 | About 72 tall, standing as the player models stand | yes | 2 |
| 3 | Red chest with two blue glass windows and a silver grille; grey waist | yes | 2 |
| 4 | Red arms, grey hands; red shoulder blocks with an exhaust stack on each | yes | 2 |
| 5 | Blue legs, thick shins with a black wheel on each, grey feet | yes | 2 |
| 6 | Blue helmet, silver face plate, glowing blue eyes, an antenna each side | yes | 2 |
| 7 | Nothing comes apart standing, running, walking, crouching or jumping; no holes | yes | 2 |
| 8 | Shown running (a strip of the run) | no | 2 |

**Score: 16 of 16 (100%), judged from the pictures built locally. Passes.**

## How the prompt became the spec

- `base: { file: "player/gordon/gordon.mdl" }`, found in the game's `models` folder: the parts are placed on
  its skeleton as it stands in its first animation's first frame, each corner hung on a bone, and the body is
  put into the base file in place of both its bodies (low and high detail): its 42 bones and 77 animations,
  blends and all, are the game's own and untouched.
- The limbs are boxes laid along the bones with `span` (from one joint to the next, 1 or 1.5 past each so
  that the joints overlap): thighs, shins, upper arms, forearms, the chest from Spine1 to the neck. The head,
  the hands, the feet, the pelvis and the shoulder blocks `attach` to a bone's joint (`{ bone }`); the
  windows, the grille, the face, the eyes, the antennas, the stacks and the wheels attach to those parts.
  Left and right are spanned apart (the base's pose is not symmetric: its right hand holds a gun).
- The build holds the shape in the base's first pose, the middle of a run, a walk, a crouch and a jump: a
  part that came apart in any of them would be a fault.

## Iterations

1. Clean on the first build: 680 triangles, 74.4 tall, nothing apart in any of the five poses, fit for
   goldsrc; `info` of the result: 42 bones, 77 animations, both bodies carrying the new body. The sheet shows
   the red chest with its blue windows and silver grille, the stacks on the shoulders, the blue legs with a
   wheel on each shin, the helmet with its face plate, glowing eyes and antennas; the strip of the run shows
   him running on the game's own animation. The strip's floor line (z 0) ran through his middle (a player
   model's origin is its box's middle); the build no longer draws one for a character.
