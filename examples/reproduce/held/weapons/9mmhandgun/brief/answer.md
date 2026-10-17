The build says OK, with one warning: the pistol is 8 units long, not the 10 you asked for. I could not get the length to change.

**What I made**

- The spec is `work:9mmhandgun.json`, named `9mmhandgun.mdl`. It is a held weapon, built as a pistol from the game's own kit (`kit:firearm`, preset `pistol`). It has 192 triangles, under the 254 cap for a weapon's world and player models.
- It replaces the game's weapon in three files, written to `work:9mmhandgun_weapon/`:
  - `v_9mmhandgun.mdl`, the first-person view with Half-Life's own hands and animations (10 animations, 48 bones, all the game's).
  - `p_9mmhandgun.mdl`, the pistol in another player's hands.
  - `w_9mmhandgun.mdl`, the pistol lying on the floor. The build sizes it so it reads on the floor, as Valve's pickup is drawn large.
- To test it, copy the three files into the mod's `models` folder under the game's names. They replace Half-Life's own with no code changes.

**What to look at before they decide**

- **Length:** 8 units, not 10. The build warns (20% off, not a fault). I tried two ways of setting the length on the kit and neither changed the result. I did not change the length by hand. Say if you want it stretched to 10 (a longer barrel is the likely way) or accept 8.
- **Colour:** it reads as one dark gunmetal with a little grey wear. The black polymer and the grey steel are not clearly separate, so a steel slide against a black grip would need a second material. I have not done that yet.
- **Joins:** the build notes five pairs of small parts (grip, trigger, guard, barrel and frame) that nearly touch but do not meet. They are slivers and do not show at normal distance. Sinking them into each other would close the gaps if the modder sees them up close.

I have not run it in the game itself. The pictures are the build's own renders, and the modder's side-by-side in-game check against Half-Life's pistol is the real test.
