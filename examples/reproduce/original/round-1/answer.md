I built every asset in the brief and every build passes its checks, but about half the files aren't at the paths you listed. The tool decides where maps, models, the wad and videos go, and I had no way to move files. The pump-hall flight is also in flat colours rather than textures.

**Where the files are**

| Wanted | Written to |
|---|---|
| `maps/fw_yard.bsp`, `maps/fw_pumphall.bsp`, `maps/fw_control.bsp` | `fw_yard/fw_yard.bsp`, `fw_pumphall/fw_pumphall.bsp`, `fw_control/fw_control.bsp` |
| `models/fw_*.mdl` (the five props) | the work root, e.g. `fw_drum.mdl`; also under each map's `models/` folder |
| `models/v_crowbar.mdl`, `p_crowbar.mdl`, `w_crowbar.mdl` | `fw_wrench_weapon/` |
| `models/headcrab.mdl` | `headcrab.mdl` |
| `fw.wad` | `fw/fw.wad` |
| `videos/*.mp4` | `fw_wrench.mp4`, `fw_crawler.mp4`, `fw_pumphall.mp4` (a folder in a video's name crashes the tool) |
| `pictures/fw_props.png` | `fw_props/fw_props-models.png` |
| sounds and sprites | at the brief's paths |

**Maps** (all pass the compile, walk and entity checks; each arrives where the last one left, through matching landmarks)
- **fw_yard:** a 1472 × 1472 yard at dusk, open to the sky, with a high brick wall, a barred gate, and a gatehouse with a door that opens and a console inside. It has stacked rusted drums, a broken 210-long concrete pipe on cradles, and sodium lamps. You start by the gate and leave through the pump house's green double doors.
- **fw_pumphall:** a 2496-long hall:
  - The water is 136 deep, with three riveted pumps (one signed "PUMP 3").
  - Railed catwalks run down both sides, joined by a bridge, with four ladders and a stair down into the water.
  - The wrench lies on the north catwalk and three crawlers are in the water.
  - You leave by a stair up to a corridor.
- **fw_control:** four consoles under four glass windows looking down on a copy of the flooded hall. A platform lift with a ladder beside it goes down to the valve room and its two crawlers. Using the main valve wheel fades to black and ends the game (`trigger_endsection`).

**Textures:** fw.wad holds 18 textures: the 12 the brief asks for (including the lit sodium face, the water and the PUMP 3 sign) plus ceiling, asphalt, brick, pump body, metal wall and glass.

**Props:** the valve wheel is 32 across, red worn to steel at the rim. The 55-gallon drum is rusted with a hazard band. The console is waist high with three dials, two lit screens and six switches. The pipe junction has a flanged elbow and 16 bolts. The caged wall lamp has a sodium-orange glass. Most are within the triangle counts of Half-Life's own props; the wheel (392), lamp (372) and junction (568) run over, because their round parts need the sides.

**Weapon:** a red pipe wrench, 18 long, worn to bare iron, with a toothed hook jaw and knurled nut. It keeps the crowbar's hands, bones and animations in all three files. In first person I lengthened the handle to about 30 so it frames like the crowbar; at 18 the head sat right in front of the camera.

**Crawler:** a low grey-green six-legged body with a pale belly and a red mouth ringed with teeth, on the headcrab's own skeleton. The check confirms it keeps every bone, animation number and body the game asks for. Its middle pair of legs is fixed to the spine and doesn't animate.

**Sprites:** a steam puff that rises and thins (12 frames), a sodium glow, and a green-grey spit splash (10 frames).

**Sounds:** each was measured against the game's own of its kind:

| Sound | Score |
|---|---|
| wrench hit | 21 of 22 |
| swing | 20 of 22 |
| pump loop | 18 of 20 |
| drips loop | 19 of 20 |

The crawler's attack and pain have no class to score against; I shaped them against the headcrab's own recordings. None of this says how they sound in the game, so they need listening to.

**Videos and sheet:** a wrench turntable, a crawler turntable plus six of its animations, and a 20-second flight through the pump hall. The video renderer can't load a custom wad, so the flight shows real geometry and lighting in flat colours; stills of the hall wearing fw.wad look right. The props sheet shows all six props.

**Leftovers you'll want to delete:** test files (`fw_probe*`, `fw_probevid.spec.json`, `maps_fw_probe3/`, `fwcopy/`, `fw_wrench.mdl` with its sheet), a stray `videos/fw_glow.spr`, and old `drum`, `lamp`, `junction`, `bigpipe` and `console` models in the yard and hall folders. There's also a tour copy of the hall in `fw/` beside fw.wad, from an attempt to texture the video. fw.wad itself is intact.

**For the game:** fw.wad goes in the mod's root folder, because the maps load their textures from it by name. Nothing here was run in the game: the lift, the doors and the level changes are only checked as geometry.
