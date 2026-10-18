Every file on the list is in its place and every build says OK. Several items are still short of the brief, and I list them below.

| Asset | What changed | Result |
|---|---|---|
| `models/headcrab.mdl` (crawler) | Rebuilt as a banded body with a distinct head, eyes, a dark mouth ringed by 12 teeth, a pale belly, and six legs on the base's bones. | 440 triangles (Half-Life's most is 478). Engine check: fit for GoldSrc. |
| `models/v_`, `p_`, `w_crowbar.mdl` (wrench) | Head is now an open Stillson-style jaw with 4 + 3 teeth. Grip is bare iron with red at each end. | Attack frames show the head up and the red grip at the hand. |
| `fw.wad` | Panel has 3 round dials (dark faces) and 6 switches in place of the lamps and louvre. Hazard stripes wider. Walls use grey concrete, floor a darker worn concrete with speckle. | Dials, stripes and floor grain pass. |
| `sprites/fw_spit.spr` | Colour muted to olive-grey. First frame starts at 0. Measured against explosion. | 5 of 5 in range. |
| `sound/headcrab/hc_pain1.wav` | Rebuilt as a train of separate pulses with a falling squeal. | Centroid and bands match the game. Onsets read 2. |
| `sound/ambience/fw_drips.wav` | Bands set to the class, lowpassed. | 20 of 20 in range. |
| `sound/weapons/cbar_hit1.wav` | Added a low thump, which puts 5% of energy under 150 Hz. | Crest, loudness and flatness still flagged (see below). |
| `maps/fw_yard.bsp` | Grey concrete walls, dusk sky, dim sun, sodium lamps. Buildings stand on the ground, so no raised floors. Gatehouse door on the east side, start beside it. Pump house double doors on the south face with a sign above them. Drums: 3 on the ground and 2 stacked. Pipe section lying on the ground. | Builds with no faults. |
| `maps/fw_control.bsp` | Windows 80 by 96, glazed, four of them (were 48 by 48). Four consoles lined up under them. | Builds OK. |
| `maps/fw_pumphall.bsp` | Walls and floor are the new concrete from the wad. Layout and props unchanged. | Builds OK. |
| All three maps | End and changelevel triggers use the mod's texture, not the game's default. | Only the game's ladder-rung and glass textures remain. |
| `videos/` (wrench, crawler, pump hall) | Re-rendered from the new models and maps. | All OK. |

**Still short of the brief, for you to judge:**
- **Wrench in first person:** the still at frame 0 sits low and to the right, not where the crowbar sits. In the attack frames the head is up and the red grip is at the hand. I could not move the idle placement without changing the game's animations, which the brief says to keep.
- **Crawler legs:** the rear pair hangs on the pelvis, so it does not step with the walk. Check it in game.
- **Pain onsets:** the judge counts 2 onsets. About 27 pulses are visible in the picture, but equal-level pulses merge in the count.
- **Wrench hit:** the take still shows warnings on crest, loudness and flatness (16 of 22 features in range). The original spec shows the same warnings, so the earlier "22 of 22" could not be reproduced.
- **Walls and water:** sodium light tints grey concrete warm, so walls read tan-brown in the hall and control room. The water is the game's own water texture, so it is still flat teal.
- **Lift pit:** the open edges (up to 264 units down into the valve room) are still unrailed.
- **Sheen:** the kit has no gloss, so the wet floor is darker and speckled, not shiny.
- **Drums and pipe in views:** the smak views draw them as placeholder boxes, so I could not check their models in the map views.

**Licences:** the sounds use generator takes, not layers alone. `cbar_hit1`, `hc_pain1` and `fw_drips` come from woosh-dflow (CC-BY-NC 4.0, non-commercial), and `fw_drips` also uses Stable Audio (Stability AI Community Licence). My earlier note that no non-commercial audio remained was wrong.

**Housekeeping:**
- I can't delete `memory:smak-placement-rules.md` with my tools, so please remove it.
- Older copies sit beside the live specs: `specs/fw_yard.json`, `specs/fw_control.json`, `specs/fw_pumphall.json`, `specs/headcrab.json`, and `fw/fw.spec.json`. The live specs are `fw_yard/`, `fw_control/`, `fw_pumphall/` and `headcrab.spec.json`, plus `specs/fw_wad.json` for the wad.
