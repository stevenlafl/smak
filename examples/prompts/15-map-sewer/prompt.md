# 15 The sewer and the waterways (map module; a prefab of the city, case 17)

## The prompt (258 words)

> The underground for my cyberpunk city, as a piece I can attach to the city's back alley. It starts at
> street level in a small concrete maintenance room (about 192 square) where I start when I try it alone.
> From there a long flight of stairs goes down, about 224 units, into a big storm drain.
>
> The drain runs east for about 900 units: 256 wide, very tall. Down its middle runs a sunken channel
> about 96 wide full of dark water, with a dry concrete walkway along each side, and a narrow metal
> bridge across the channel in the middle. Square ducts run along the walls up high. Dim, cold
> blue-green lights every so often, and two zombies shambling along the walkways. If you fall in the
> water you can get out again at either end of the channel.
>
> Off the drain's north side, through a doorway, is a squatter's hideout (about 384 by 320): a mattress, a
> desk made of crates with two glowing screens on it, a chunky generator with a glowing status light, and
> a shotgun lying on the desk. It's lit by the screens and one weak bulb.
>
> At the east end the drain narrows into a low flooded culvert you can wade through, water half a man
> deep, with a headcrab lurking in it.
>
> Everything should be reachable without jumping, nothing stuck in walls, sealed, and dark but not black
> (light just enough to find your way).

## The rubric (written before the spec)

| # | Item | Must | Score |
| --- | --- | --- | --- |
| 1 | A small concrete room at street level with the start; stairs down about 224 into the drain | yes | 2 |
| 2 | A drain about 900 long and 256 wide, very tall, with a water channel 96 wide sunk down its middle | yes | 2 |
| 3 | Dry walkways on both sides, a bridge across the middle, ducts along the walls up high | yes | 2 |
| 4 | A way out of the water at both ends of the channel (no one-way place) | yes | 2 |
| 5 | A hideout off the north side: mattress, crate desk with two glowing screens and a shotgun on it, generator with a glowing light | yes | 2 |
| 6 | A flooded culvert at the east end, water about half a man deep, a headcrab in it | yes | 2 |
| 7 | Two zombies on the walkways; dim blue-green light, the hideout lit by its screens and one weak bulb | no | 2 |
| 8 | Sealed, compiled, every entity reached without jumping, nothing in solid, dark but not black | yes | 2 |

**Score: 16 of 16 (100%). Passes.**

## How the prompt became the spec

- The module's first room is the maintenance room (`access`, at street level, with the start). The drain is
  `east_of` it with `floor: -224`, aligned `south` so that the stairs the kit puts in it (14 steps, along
  its south walkway, from an `opening` at 0 along the shared wall) come down clear of the channel.
- The channel is a room placed `in` the drain (`offset: [32, 112]`, `floor: -64`): carved with it, it is a
  trench 96 wide down the drain's middle, filled 48 deep with `water` (a liquid brush of `!SM_SEWAGE`).
  `steps_up_west` and `steps_up_east` (brush prefabs) climb out of it at its two ends.
- The bridge (a rusted deck with two rails), the ducts, the mattress, the crate desk with two `neon`
  screens, and the generator with a glowing status light are brush prefabs.
- The hideout is `north_of` the drain through an opening; the culvert `east_of` it with `water` 36 deep
  over its floor (half a man: waded, not swum).

## Iterations

1. `ERROR rooms[2] (channel).size: ... does not hold one`: a room inside another is part of its space, and
   needs no room for a player itself; the kit no longer asks it of rooms placed `in` another.
2. A zombie stood on the stairs (it fits 64 higher), and every room but the maintenance room was dark: the
   drain 11, the hideout 14, the culvert 14. The zombie was moved along the walkway. The kit hung its lamps
   24 under the ceiling, which in a drain 352 tall is far from the floor: they now hang no higher than 192
   over it. The hideout's bulb and the culvert's lamp were made brighter, and a room placed `in` another
   (the channel, whose floor is under the water) is not held to the dark line, which the report says.
3. The drain still 17: six lamps of 130 for its 900 length. Clean: floors lit 30, 36, 38, 33, 32: dark,
   not black. The plan (picture-1) shows the channel down the middle with the steps at both ends and the
   bridge across it, the ducts along both walls, the hideout to the north with the desk's two screens, the
   mattress and the generator, and the culvert to the east; the views three times as bright (picture-3)
   the stairs going down, the walkways and the water, the hideout's glowing screens; the section
   (picture-4) the 14 steps down 224 from the maintenance room to the drain.

## Blind run

`blind.mjs`: the prompt alone, handed to a fresh agent with nothing but the MCP server (no shell, no files,
none of these specs). It took 31 turns and 292 seconds (guide 13, models 1, entities 4, build 7, info 4, render 1); its spec (blind/spec.json),
built again (blind/result/), passes every check, and its pictures show the maintenance room, a stairwell of its own down 14 steps, a drain 900 long with a channel of dark water down it, steps out at both ends, a bridge, ducts, wall lamps, the hideout with its mattress, desk, generator and bulb, the culvert with water 36 deep and the headcrab; dark but over the line everywhere (27 to 41). Against this rubric: **16 of 16**.
