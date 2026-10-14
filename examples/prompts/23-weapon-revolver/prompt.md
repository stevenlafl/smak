# 23 A cowboy's revolver in place of the .357 (weapon; parts that move with the game's bones)

## The prompt (112 words)

> Swap the .357 Magnum in Half-Life for an old western six-shooter, the kind the cowboy wears: a dark blued
> steel frame, a round fluted cylinder, a long thin barrel with a blade sight on the end, a walnut grip that
> curves down and back, a hammer, a trigger inside a guard. Keep the hands and all the .357's animations,
> and the cylinder has to turn and the hammer has to move when it fires, like the original. I need the
> first-person model, the one in other players' hands and the one on the floor. Show me it firing.

Built on Half-Life's own `v_357.mdl`, `p_357.mdl` and `w_357.mdl`: the results stay out of the repository.

## The rubric (written before the spec)

| # | Item | Must | Score |
| --- | --- | --- | --- |
| 1 | Three files with the game's names (v_, p_, w_357), hands, bones and animations kept | yes | 2 |
| 2 | A six-shooter: blued frame, a round fluted cylinder, a long thin barrel with a blade sight | yes | 2 |
| 3 | A walnut grip curving down and back, a hammer, a trigger in a guard | yes | 2 |
| 4 | The cylinder on the game's drum bone and the hammer on its hammer bone: they move when it fires | yes | 2 |
| 5 | Held as the .357 is, its grip in the hand; nothing open, inside out or apart | yes | 2 |
| 6 | Shown firing in first person | no | 2 |

**Score: 12 of 12 (100%), judged from the pictures built locally. Passes.**

## How the prompt became the spec

- `weapon: { like: "357" }`: the six-shooter built along +x, grip low, fitted over the Python in each file.
- The parts that move name the game's bones: the drum and its six flutes `bone: "cylinder_spin"`, the
  hammer and its spur `hammer`, the trigger `trigger`. The rest hangs on the bone that carried the old gun
  (`python_master`). In `p_357` and `w_357`, which have none of those bones, the whole gun is one piece.
- The grip is a turn pitched down and back from under the frame; the barrel a long thin turn with a blade
  sight at its end and an ejector rod under it; the guard a tube under the frame round the trigger.

## Iterations

1. The kit learnt parts on a weapon's bones for this case (`bone` on a part of a weapon spec, through
   `swapMesh`'s part bones). First build clean: the drum, the hammer and the trigger on their bones.
   Checked by numbers and pictures: through the reload the drum's middle moves 1.2 out and 1.9 down from
   the frame and back, and the game's own speedloader's bullets go into it, as into the Python's; in the
   firing animation the game's own cylinder barely turns (0.17), and so does this one.

