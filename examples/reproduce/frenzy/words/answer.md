frenzy_copy is built and the build says OK: it compiled with no leak, all 64 weapons, ammo and items are reachable on foot from the 15 starts, and the GoldSrc check reports it fit for the engine.

**What I built from**

The original frenzy.bsp isn't in the game or work folders, so I built from your description alone. Where it was vague or contradicted itself, I chose. For example, the NE annex overlapped the east wing's NE pit, so I put the annex beside the pit. I have nothing to compare against, so I can't say how close it comes to the original; that is what the side-by-side judging will show.

**What's in it**
- **Layout:** a 2400 × 2030 octagonal complex with chamfered corners. The spine runs the full length with a z 320 corridor, a bridge across the atrium, and the ladder at the south tip.
- **Atrium:** balconies at z 320, ledges at z 512, a raised light well, four angled func_wall bays, and the 64-wide service stair stepping 0 → 160 → 320.
- **Wings:**
  - Both have a z 160 mezzanine, two pits with a pillar each, and a ground room under the middle band.
  - The west wing has two doors (46, 47) to the ring corridor, each opened by its trigger (92, 93).
  - The east wing has an east ring under the mezzanine.
- **Ring corridor:** runs at z 0 all the way round, with diagonal corners.
- **NE annex:** roof at 300, a 12-step stair to a z 120 landing and on up to the mezzanine, and 8 orange lights with glow sprites.
- **Entities:** every spawn, weapon, ammo and item at the position you gave, plus the health charger.
- **Look:** grey concrete walls with a band of computer racks and a yellow base stripe, brown floors and grating, blue-grey plates on the spine, hazard-trimmed ceiling beams and fluorescent strip panels, all from halflife.wad.

**Where it differs from the original**
- **Entity numbers:** the 14 deathmatch spawns have the original numbers (32–45 and 60), and the 8 annex lights and glows sit in 16–31 and in the numbers left spare, as in the original. The player start is 25, not 1, because the kit always numbers brush entities first.
- **Extra lights:** the original's corridors seem to be lit by the fluorescent textures themselves, which I couldn't do here. I lit them with 60 extra cold-coloured light entities, numbered after the original's 93.
- **Not modelled:** the inward-leaning upper wing walls and the rounded frames around the rack band. The kit has no shape for a wall that overhangs as it rises.
- **Red railing by spawn 35:** halflife.wad has no railing texture, so the kit made one into `frenzy_copy.wad`. That wad has to ship beside the map.
- **Not tested in a game:** the doors opening, the triggers, the ladder and the charger only show in a game. The kit's walk test is geometry only.

Files are in `work/frenzy_copy/`: `frenzy_copy.bsp` goes in `valve/maps/` and `frenzy_copy.wad` in `valve/`. Load it with `map frenzy_copy`.
