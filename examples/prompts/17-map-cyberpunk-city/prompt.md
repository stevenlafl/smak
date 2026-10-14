# 17 The cyberpunk city (map; puts together cases 11 to 16)

## The prompt (311 words)

> Now the city itself, a dark noir street at night, putting together everything I've had made.
>
> The street runs east to west, about 1800 long and 448 wide, open to the night sky, its buildings rising
> high on both sides (about 512). Wet black asphalt, dark brick and concrete walls. I start at its west end
> looking east.
>
> Along the north side, west to east: my noodle bar (case 13), my arcade (case 14) and my cyber-clinic (case
> 16), each opening onto the street as I had them, with a neon sign over each shop front in its own colour:
> pink for the noodles, purple for the arcade, green for the clinic.
>
> On the south side: a cramped pawn shop with a counter and two pistols lying on it and a glass display
> window beside its door that shatters when shot, the lobby of an apartment block with a row of mailboxes
> and a security guard, and between them a narrow alley running south, open to the sky, with a dumpster and
> a stack of wooden crates that break when shot. At the alley's far end it leads into my sewer (case 15).
>
> Above the shops, the walls are full of life: lit windows high up, a few fire-escape balconies, and two
> big glowing billboards, one magenta and one cyan, high on the south wall facing the street.
>
> Light the street with my neon street lamps (case 11): three along each side, their arms out over the
> road, each throwing a pool of cold cyan light. Park one of my hover cars (case 12) at the north kerb and
> have another hanging in the air above the street, as if flying past.
>
> It should feel dark and noir: the street lit only by the lamps, the signs, the windows and the
> billboards, faint but never pitch black. Every place reachable on foot, from the street into every shop,
> the lobby, the alley and down into the sewer; sealed, nothing stuck in anything. Use the earlier cases as
> they are: build them in, don't redo them.

The glass window and the breakable crates were added to the prompt and to rubric item 3 while the spec was
being built (the person asked for glass and breakables then); the rest of the rubric is as it was written
before the spec.

## The rubric (written before the spec)

| # | Item | Must | Score |
| --- | --- | --- | --- |
| 1 | A street about 1800 x 448, 512 high, open to the night sky, wet asphalt and dark walls; the start at its west end facing east | yes | 2 |
| 2 | North side, west to east: the noodle bar, the arcade, the cyber-clinic (cases 13, 14, 16 included as built), each with its neon sign in its colour over its front | yes | 2 |
| 3 | South side: a pawn shop with two pistols on its counter and a breakable glass window by its door, an apartment lobby with mailboxes and a guard, an alley between them with a dumpster and breakable crates | yes | 2 |
| 4 | The alley leads into the sewer (case 15 included as built), reached on foot down its stairs | yes | 2 |
| 5 | Lit windows, fire-escape balconies, a magenta and a cyan billboard high on the south wall | no | 2 |
| 6 | Six neon street lamps (case 11), three a side, arms over the road, each with a pool of cyan light | yes | 2 |
| 7 | A hover car (case 12) parked at the north kerb and another in the air over the street | no | 2 |
| 8 | Dark and noir but never black; sealed, compiled, every entity reached on foot, nothing in solid | yes | 2 |

**Score: 16 of 16 (100%). Passes.**

## How the prompt became the spec

- The street is a `sky` room 1792 by 448 and 512 high with `night: true` (a dark sky, a moon of 14) and no
  lamps of its own (`light: "none"`): its light is the six street lamps' `light` entities, the signs, the
  windows and the billboards (`neon` materials: texture lights).
- The four map modules come in by `include`, each as built in its own case: the noodle bar `as: "noodle"`,
  the arcade, the clinic `north_of` the street at 96, 640 and 1216 along it; the sewer `south_of` the
  alley. Their rooms come in prefixed (`noodle_shop`, `sewer_drain`...), their test streets and starts left
  out, their prefabs, models and materials with them; and since this map's rock is brick, each module's
  rooms are lined with its own walls, floors and ceilings. The street's links join it to each module's
  first room, and the alley's to the sewer's.
- The pawn shop, the alley (a `sky` room 160 wide) and the lobby are this map's own rooms on the south
  side, with brush prefabs for the counter, the shelf, the dumpster, the mailboxes and the lift door. The
  pawn shop's display window is a `window` link with `glass: true` (a `func_breakable` pane, half
  see-through, material glass); the crates in the alley a prefab put as a `func_breakable` of wood.
- The lit windows (three rows a wall, some dark, by a fixed pattern), the fire escapes and the two
  billboards are prefabs on the street's walls; the signs over the shop fronts too.
- `models` names cases 11 and 12 by file: six neon lamps at the kerbs facing the road, a hover car parked
  at the north kerb and one at z 300 over the street.

## Iterations

1. Built and compiled (15 rooms, 25 seconds), with three faults from the walk test and the light: the
   pistols on the pawn shop's counter reached only crouching, a way 32 wide by the lobby, the alley dark
   (18). A section through the pawn shop's door showed its shelf standing just inside it: the spec had put
   the shelf against the shop's street wall, not its back wall. The lobby's lift door was on its street wall
   too, by its door. Both moved to the back walls, the mailboxes turned the right way, the alley given
   three lamps of 110.
2. Clean. The street seen from its two ends had a day's blue sky: without the game's sky pictures the
   views drew the sky in a default colour. A night map's views now draw it dark. The noodle bar's walls
   were brick, the street's, not its own plaster: the kit carved all rock in one texture and lined only
   floors and ceilings. Rooms can now line their walls (`surfaces.walls`), and an included module's rooms
   are lined with its own walls.
3. The person asked for glass and breakables: the pawn shop's window and the alley's crates were added
   (the kit learned glazed windows and brush entities for furniture).
4. Clean: floors lit street 80, pawn shop 35, alley 39, lobby 47, the modules as they were alone. The plan
   (picture-1) shows the street with the three shops north and the pawn shop, the alley down to the sewer
   and the lobby south; the views three times as bright (picture-3) every one of the 15 rooms with its
   things; the props' views (picture-5) the street with its lamps and the parked car, and the noodle bar's
   lanterns and sign. Views taken from the street's two ends at a man's height (not kept: the build's own
   pictures cover the same) showed the night sky, the lit windows, the billboards, the shop signs in their
   colours, the lamps and the car flying over, and the glass window beside the pawn shop's door.
