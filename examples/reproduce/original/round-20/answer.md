The revision is built and copied into place. Every build returns OK, but nothing has been run in the game. Several items still miss their targets, listed below.

## What I changed

```
Asset                      Before                         Now
models/headcrab.mdl        26.6 x 33.6 x 17.3             25.1 x 21.9 x 17.2 (25.9 asked)
                           mid legs reached +/-16.8       mid legs shortened, back pulled in
models/v_,p_,w_crowbar     20.2 long, closed block head   18.0 long, two jaws with a gap,
                           short handle                   4 + 3 teeth, bare-iron bands
                           wrong first-person placement   first-person: head up, hand on handle
fw.wad (fw_pipes)          dark bands on a panel          rust-grey pipes crossing, rivets
fw.wad (fw_panel)          squares, no dials              3 lit dials, louvre grille, rivets
sprites/fw_spit.spr        soft puff, one drip frame      glob in frames 0-2, splash with
                                                          falling drips frames 3-5, class sparks
sound/weapons/cbar_hit1    bands off by 33-45 points      22/22 class features, T20 0.40 s,
                                                          one onset, bands within 4 points
sound/headcrab/hc_attack1  whoosh, 33% short decay        six bites, length 0.90 s, T20 0.45 s
sound/headcrab/hc_pain1    bursts of hits                 dense continuous chitter, no warnings
sound/ambience/fw_pump     decaying burst, 5 onsets       steady loop, 20/20 class features
sound/ambience/fw_drips    flat tones, 150-600 too low    falling plinks over grains, 19/20
maps/fw_control.bsp        control beside hall, no        control raised 176 above hall, five
                           consoles, wheel missing        consoles under windows, lift pit to
                                                          valve room, wheel and end trigger
maps/fw_yard.bsp           drums hidden, no pipe          six drums by the gate (two stacked),
                                                          broken pipe section in the yard,
                                                          pump house with two 48-wide doors,
                                                          warmer sodium lamps
maps/fw_pumphall.bsp       unchanged geometry; rebuilt    (see note below)
                           to take the new textures
videos/fw_wrench, fw_crawler, fw_pumphall  re-rendered
pictures/fw_props.png      unchanged (none of its five props changed)
```

Two steps went beyond your list. I rebuilt the pump hall because it embeds the old pipe and panel textures. I also added `models/fw_pipesection.mdl`, a model for the yard's pipe section.

## Still short of the brief

- **Wrench in hand**: the first-person view now has the head up and the hand on the handle. It sits higher and more centred than the game's crowbar, and I could not move the placement with the fit options.
- **Crawler**: the six legs are short stubs.
- **Attack sound**: 3 of the 5 bites are counted as onsets, and T20 is 16% long. The 600 to 2k band is 10 points high (29% against 19%).
- **Drip loop**: 19 of 20 class features in range. The centroid is 1023 Hz against a 1007 Hz ceiling, and 7 of 8 drips are counted.
- **Sludge spit**: the judge reads it as too smooth (jitter 0.94 against 1.72 to 2). The frames show the splash, but not the flicker.
- **Lift pit**: eight edges let a player step off and fall 264 units. I did not add rails.
- **End of the mod**: it fires when a player walks into a trigger beside the wheel. The wheel is not a use button. Say if you want it to be one.
- **Yard**: the walls are still flat tan. I changed the lamp colour but did not check that it reads as dusk.

## Licences

The final sounds are built from layers only, with no generator takes, so no non-commercial generated audio remains. The textures use the library's CC0 photographs.

## Housekeeping

I accidentally wrote a note file into the work folder as `memory:smak-placement-rules.md`. It is not part of the mod, and I have no tool here to delete it, so please remove it.
