I built `frenzy_copy` and the build reports OK: it compiled, has no leak, all 64 pickups and starts can be reached on foot, there are no one-way places, and every entity class and key matches the game's FGD (the file that defines its entities). There was no copy of the original map here, so I built it from your description alone and never saw the two side by side.

**Files** (in `/tmp/smak-repro-nCQ6q3/work/frenzy_copy/`): `frenzy_copy.bsp`, the source `frenzy_copy.map`, and plan and view pictures. To play it, copy the .bsp into `valve/maps/`; it uses only textures from `halflife.wad`.

**Matches the description**
- **Outline:** x −1480 to 944, y −992 to 1040, with chamfered corners and the spine sticking out north and south.
- **Levels:** ground at z 0, mezzanines at 160, catwalks at 320.
- **Spine:** a corridor at z 320 with hazard-striped beams every 256, a ground corridor under it, and the south ladder with a thin wall each side.
- **Atrium:**
  - Octagonal, with the bridge, the rail slabs, west and east balconies, ledges at z 512 and a raised light well.
  - Four corner bays, the thin wall in the middle of the hall, and the health charger with spawn 60 facing it.
- **Wings:**
  - Each has a z 160 mezzanine, two pits with a square pillar each, and ground rooms under the band.
  - In the west, the two doors are opened by triggers.
  - Ceilings are about 464 with beams across them.
- **Outer ring corridor:** runs round the whole complex at z 0.
- **North-east annex:** a 15-step stair (8 high) up to a z 120 landing, then on to the east mezzanine, lit by eight orange lights with glow sprites.
- **Spawns and items:** all 14 deathmatch spawns and the player start are at your coordinates and facings, and every listed weapon, ammo and item is there.
- **Look:** grey stained concrete walls with a dark computer-rack band at z 40–110, dark brown floors, rusty grating on the mezzanines, bluish metal plates on the spine, and cold light except in the annex.

**Where it differs from the original, or is a guess**
- **Entity numbers don't match.** The kit always numbers brush entities first, so the player start is 21, not 1, and every other number shifts too. I couldn't change that.
- **The leaning upper walls are three stepped ledges.** The kit's sloped pieces only make ramps, so they can't lean a wall inward.
- **I added routes the description doesn't mention.** These are stairs in both west pits, a stepped service strip in the atrium, and catwalks along the atrium's north and south sides. Without them, the west mezzanine and the z 320 balconies couldn't be reached.
- **The pits are 240 wide, not about 300.** The wall beside the atrium needed to be thicker to carry the atrium's chamfered corners. The ring corridor also narrows to about 90 at the outer corners.
- **Small details are left out:** the yellow-green base stripe, the rounded frames round the racks, the red railings by spawn 35, and the annex's irregular shape beyond one cut corner.
- **Texture names are my choice.** I picked them to fit your description, not from knowing the original's.

**Not verified**
- **The game itself:** nothing has been run in-game, so the doors, triggers, ladder and charger are untested. The reach test is geometry only, using the engine's numbers.
- **Lighting quality:** I asked for a final-quality light compile with bounced light, but the renderer still calls the lightmaps a draft, so I can't confirm it took effect. Average floor light is 114 of 255.
- **The separate engine check:** it reports one error, "halflife.wad not found", because that check wasn't given the game folder. The build itself found the wad in your Steam Half-Life folder and used it.
