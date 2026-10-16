frenzy_copy is built and compiled, but the build still says **NOT OK**. Three items are unreachable on foot, and the views are much darker than the original.

**Build status**

| Check | Result |
| --- | --- |
| Compiled (BSP, the game's map file) | Yes, to `work:frenzy_copy/frenzy_copy.bsp` |
| Leaks | None reported |
| Entities checked against the FGD (the entity definitions) | 117 entities, all pass |
| Places reached | 61 of 64 entities reached on foot |
| Unreached | `ammo_ARgrenades` at (-664, 152, 320) and (-664, -152, 320), and `item_longjump` at (-72, 0, 320) |

The three unreached items sit on the 320-high platforms. The walk test cannot find a way up to them. I tried shortening the walls that border those platforms. That made two handgrenades need a jump, so I reverted to the 3-fault version.

**What matches**

- Layout, floor heights and room sizes come from the height plan (153 by 131 cells of 16 units, the walkable floor is about 84% of its area).
- All 64 entities are placed at their marks and heights, including the 8 `light` and 8 `env_glow` pairs.
- The brush entities are real: 12 `func_wall`, 2 `func_door`, 2 `func_ladder`, 1 `func_healthcharger`, 2 `trigger_multiple`.
- Textures were picked by picture from `halflife.wad`: floor TNNL_FLR7C, upper walls CRETE1_WALL01, ceiling -0FIFTIES_W12, a lab-panel wall (LAB1_SLOT1B) in the west, and CRETE3_FLR05 floor in the east.

**What does not match**

- **Light.** The views are still dark. I raised the lamp brightness to 800 and the areas to brightness 2, and the lamps now show on the plan. The views are still far darker than `views.png`.
- **Brush sizes are guesses.** The `func_wall` slabs are 96 by 16 by 320, doors 96 by 16 by 112, ladders 32 by 16 by 160. The plan only shows thin orange outlines, so their true sizes are not in the inputs.
- **Items on top of walls.** Four items marked at z 336 sit on top of walls, because the height plan has no 320 floor there. I put them over floor 0 at z 336.
- **Sweep warning.** 55 places drop more than 210 units. This is a warning, not a fault. The original has its ledges too.

**Gotcha I found on the way**

A brush entity's `entity` key belongs on the `furniture` entry that places the prefab, not on the prefab piece. On the piece it is silently a solid `func_detail`, which blocks the walk. I could not save this to memory because the Write tool is disabled in this session.

**Not saved to disk**

I have no file-writing tool here, so the spec lives only inline in this conversation. The built files are in `work:frenzy_copy/`: the `.map` source, `.wad`, `.bsp`, and the plan and view pictures. If you want the spec as a `.json` file, say where, and I'll write it on the next turn.

**Next steps if you want to push further**

- Lights: a brighter setting for the lamps, or light entities placed closer to the ceilings in the views.
- Platforms: a route up to the 320 level, or moving the three items.
