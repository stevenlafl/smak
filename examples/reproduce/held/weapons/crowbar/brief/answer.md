The crowbar builds OK. It is a red-painted steel crowbar about 24 units long, fitted over Half-Life's own `v_crowbar.mdl`, `p_crowbar.mdl` and `w_crowbar.mdl`. The spec is `work:crowbar.json`.

The three files for the mod are in `work:crowbar_weapon/`:

```
v_crowbar.mdl   first person, with the game's hands and animations
p_crowbar.mdl   in another player's hands
w_crowbar.mdl   lying in the world (pickup)
```

To use them, copy the three files into the mod's `models` folder, where they replace the game's files of the same names.

**What it is**

- **Shape:** a straight bar with a bent claw at the far end, and a blunt butt at the grip end.
- **Paint:** red paint on the shaft and the hook, with a steel ferrule-style grip section and a steel claw tip.
- **Wear:** a wear and grime finish over everything, so the paint chips and the metal reads as worn.
- **Size:** built at the real crowbar length, 23.8 units, and laid into each file at the size Valve draws a weapon there. Its grip sits where the old grip was.
- **Triangles:** 128. That is above the typical Valve pickup in the world file (three quarters of Valve's pickups have under 104), so it is heavier than most pickups but well within the first-person and held-weapon norms. The build gave no warning about it.

**How I made it**

I wrote a `held` spec with `weapon: { like: "crowbar", size: "own" }`. The build fits the new weapon into the game's three files, keeping their hands, bones, animations and events, and replacing only the weapon's meshes.

The first two builds failed with the same fault: two faces were given twice where parts met. Each part's closed end was a flat cap sitting on the next part's cap. The fix was to let each joint overlap by a little, so the caps sit inside the neighbouring part instead of on it. The final build passed every check.

**What I did not check**

I only looked at the build's own pictures: the six sides, the three files, and the first attack frames. I have not opened the mod in the game, so the in-game judgment of whether it is at least as good as Half-Life's is yours to make. The build does not include sounds, so the game's own crowbar sounds still play. Say if you want the sounds replaced too.
