Every file on the brief's list is now at its exact path and every build says OK. I haven't run anything in the game, so the transitions, the lift, the wrench in hand and the sound levels are still unverified.

## What I changed

**Sprites**
- `fw_steam`: set to `parallel oriented`, to match the game's steam1.
- `fw_spit`: the first frame dropped from 0.66 to 0.02, so the envelope now starts quiet and peaks at 0.43. Its flicker is still 1.22, against the game's 1.72 to 2. I raised the blob count and it barely moved, so I left that warning in place.

**Textures (`fw.wad`, 12 textures)**
- The wall is now `concrete_layers_02`, a weathered poured concrete, in place of the streaked one that read as planks.
- The pipes are rust-grey with bigger pipes, not cyan.
- The hazard stripe is 8 texels wide, so it reads as a bold band.
- The control panel has three lamp-faced dials and a screen grille.

**Sounds**
- `cbar_hit1`: rebuilt. The attack is 60 ms and the crest is 10 dB, both close to range. The spectrum is still too bright, with 58% of the power at 2 to 5 kHz against the game's 14%. I couldn't filter that out, so this one is a compromise.
- `hc_attack1`: rebuilt to 0.80 s, from 0.56 s, with a second bite and a click train.
- `hc_pain1`: rebuilt as a train of pulses across 0.86 s, matching the game's shape. The crest is high (about 25 dB).
- `fw_pump`: loop of 2.4 s, classed as a loop machine. It passes all 20 checks, with 89% of its power in 150 to 600 Hz.
- `fw_drips`: loop of 6.7 s, with its top end cut back. It passes 19 of 20; 150 to 600 Hz is a little low.

**Props**
- `fw_drum`: rust-brown body (rust 0.75), with the hazard band kept.
- `fw_pipejunction`: rust-brown pipes and flanges in place of the green.
- `fw_console`: rebuilt in muted olive-grey, with dim glass screens, bezels and switch blocks. The saturated green and cartoon detail are gone.
- `fw_valvewheel` and `fw_walllamp`: unchanged.

**Wrench (`v_`, `p_`, `w_` crowbar files)**
- New pipe-wrench head: a fixed jaw with four teeth, a movable jaw with three, and a bare-iron band on the grip. It's 260 triangles, with the handle red and the pommel bare.
- The first-person view sits diagonally, where the crowbar's sits.

**Crawler (`headcrab.mdl`)**
- Lower and wider: about 17 units high (was 22), 33 across.
- Six legs: the four limbs plus two longer mid-body legs.
- A ring of twelve teeth round the mouth.
- The pale belly sits 1.2 units under the body and is bound to the spine bone, so it stays with the body in the jump.

**Yard (`fw_yard`)**
- A hazard trim runs along all four inside walls.
- A PUMP 3 sign stands free in front of the pump-house doors.
- A darker dusk sky with a low orange sun.
- I did not cut a gate into the outer wall. That would open the map onto the void outside. The gatehouse door is the gate, and the start faces it. The exit trigger sits inside the pump house, beyond its double doors.

**Pump hall (`fw_pumphall`)**
- The start and the yard landmark moved from water level (z 0) to a dry landing at the west end (top at z 112). The first view was black because the start sat under the 110-unit water.

**Control room (`fw_control`)**
- The lift shaft was the main fault: the lift couldn't travel because the valve room sat partly under solid rock, and a ceiling was 64 units above the lift's top.
- I rebuilt the valve room under the lift, extending it east past the wall. The lift now rides 240 units, from z 112 down to the valve floor at -128.
- The valve wheel, the end trigger and `game_end` are now in the valve room.
- The ramp is gone; the lift is the way down.

## Files and checks
- Maps copied to `maps/`, models to `models/`, `fw.wad` to the root. Each map folder has its own copy of `fw.wad`, because the build needs the wad beside the spec.
- The wrench video's spec was overwritten when I rebuilt the wrench model, so it's now `fw_wrench_video.spec.json`.
- Videos: `fw_wrench`, `fw_crawler` and `fw_pumphall` were rebuilt and copied to `videos/`. The props sheet is `pictures/fw_props.png`.

## Still open
- The lift well is an open edge: the sweep reports 8 places where a player can step off and fall 224 units. I left it unrailed.
- The pump-hall and control landmarks are aligned by their positions, but the changelevel arrivals haven't been walked in the game.
- The yard's wall reads as concrete now, but it still isn't a dusk sodium look from inside.

## Licences
- Several sounds come from the non-commercial Creative Commons generator (CC-BY-NC): `cbar_hit1`, `hc_attack1`, `hc_pain1` and part of `fw_drips`.
- The rest come from the Stability community licence: part of `fw_drips`, and `fw_pump`.
