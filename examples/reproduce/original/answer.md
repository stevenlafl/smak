I've made the whole mod: all 26 files are at the required names in the work folder. Every map, model, sprite, sound and video builds with no faults, and every model passes the engine check. None of it has been run in the game, so the doors, the level changes, the lift and the ending are checked on geometry only.

**Maps** (all three build clean)

| Map | What's in it | Walk test |
|---|---|---|
| `fw_yard` | 1504 × 1504 yard at dusk under its own sky, with a 448-high wall round it. A gatehouse with a swinging door and a window, a closed steel gate by the start, stacked drums and the truck-sized broken pipe section. You leave through the pump house's double doors, which hold the level change and landmark `fw_lm1`. | All 5 places reached |
| `fw_pumphall` | 2688 long (about 2650 of it is the hall itself). An identical pump house to arrive in, the flooded hall with three pumps (the third carries the "PUMP 3" sign), catwalks on both sides joined by a bridge, ladders and sump steps out of the water. The wrench is on the west catwalk and three crawlers are in the water. A stair leads up to a corridor holding the level change and landmark `fw_lm2`. | All 8 reached |
| `fw_control` | Four consoles under four glazed windows, looking down on a replica of the hall. A wall button sends a lift down to the valve room. Using the valve wheel shows a message and ends the mod 4 seconds later. Two crawlers. | All 6 reached |

The water is 64 deep, which is swimming depth in Half-Life. The walk test can't follow a player down through water deeper than a player is tall, so I settled on 64 rather than deeper.

**Models**
- **Props:** valve wheel, drum, console, pipe junction and wall lamp.
- **Wrench:** replaces the crowbar's first-person, in-hand and world models. The in-hand and world models get their own lighter set of parts, because the automatic reduction smeared the red paint.
- **Crawler:** built on the headcrab's skeleton and keeps all 21 of its animations. At 448 triangles it is under the headcrab's 478.

**Textures, sprites, sounds, showcase**
- **`fw.wad`:** 14 textures, with photo-based concrete and steel.
- **Sprites:** the steam rises and thins, and the glow is sodium orange. The spit's inner motion is slightly under the game's range for sparks.
- **Sounds:** all six are in range of the game's own sounds of their kind. They come from a non-commercial (CC-BY-NC) generator, which you've accepted.
- **Showcase:** three videos and the props sheet.

**Things you should know**
- **Extra files the game needs:** each map also lists its own small .wad (ladder rungs), so `fw_yard.wad`, `fw_pumphall.wad` and `fw_control.wad` must ship beside `fw.wad`. The yard also needs its sky in `gfx/env/fw_yard/` and the pipe model `models/fw_bigpipe.mdl`. All of these are in the work folder.
- **Over the game's triangle counts:**
  - The wall lamp is 220 triangles, where the game's most for a prop that size is 194.
  - The valve wheel (376) and the drum (336) are over what three quarters of the game's props that size use, though under its most.
- **Crawler legs:** the headcrab has only four legs, so the middle pair is fixed to the body and doesn't step.
- **Wrench in first person:** the head looks large on screen. At Valve's first-person scale it really is about 8 units tall.
- **Lift pit:** it's a 256-unit drop when the lift is down. I railed it and left a gap to step onto the platform.
