# 34 A construction site (map module; half-built houses as brush frames)

## The prompt (166 words)

> The neighbourhood's building site, on the south side of the main street behind a plywood hoarding with a
> gate: two houses going up on dirt. The first is framed: a concrete slab, timber studs on all four walls
> with gaps for the doors and windows, top plates, plywood sheathing started on two walls, and roof trusses
> across the top, with scaffolding of steel pipes and plank decks along its front. The second is further
> behind: its slab and its walls only half studded. Around them: two stacks of lumber, a sand pile, a green
> dumpster and a blue portable toilet. You must be able to walk into both frames through their door gaps and
> round the whole site. Show me the frames from the gate and close up.

## The rubric (written before the spec)

| # | Item | Must | Score |
| --- | --- | --- | --- |
| 1 | A dirt site behind a plywood hoarding with a gate from the street | yes | 2 |
| 2 | A framed house: slab, studs with door and window gaps, top plates, some sheathing, roof trusses | yes | 2 |
| 3 | A second house less done: slab, walls half studded | yes | 2 |
| 4 | Scaffolding of pipes and plank decks; lumber, sand, a dumpster, a portable toilet | no | 2 |
| 5 | Compiles, lit by the sun, both frames walked into through their door gaps | yes | 2 |

**Score: 10 of 10 (100%), judged from the pictures. Passes.**

## How the prompt became the spec

- The frames are prefabs of brush pieces, written by a script from the frame's size and its gaps: a
  concrete slab; a stud every 32 along each wall, none in a door or window gap; top plates; plywood on two
  walls; and trusses of two thin wedges each, every 48. The second frame is the same with a third of its
  studs not yet up. Scaffolding, lumber stacks, a sand pile, a dumpster, a portable toilet and the hoarding
  are prefabs too; as all furniture, `func_detail`.
- A crowbar lies inside each frame, so that the walk test proves each is walked into through its doorway.

## Iterations

1. Clean, but nothing showed the frames could be walked into: a crowbar put inside each. They lay at the
   floor's height, inside the slab: raised onto it, both reached.
2. The map's pictures looked at its props and not at its brush furniture: the kit now looks at what stands
   in a room, prefabs too, from a man's height.
