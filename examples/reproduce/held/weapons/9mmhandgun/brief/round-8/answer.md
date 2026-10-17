The build says **OK** with no warnings. I rebuilt the pistol from explicit parts, because the modder's complaint was that it read as a blocky dark gun.

**What changed**

- **Shape.** The old gun was made of flat boxes from the firearm kit. The new one is built from its own parts: a rounded grip tilted back at the bottom, a separate magazine base, a curved trigger guard, a trigger, a barrel that sticks out past the slide, and front and rear sights. The kit is no longer used.
- **Finish.** The old build had a brown wood-looking paint. Now the frame, grip, guard and magazine are dark blue-black polymer, and the slide, barrel, trigger and sights are grey steel. The slide has ejection-port panels on both sides.
- **Joints.** The build's warnings about parts that nearly touch are gone. The parts now overlap where they meet.
- **Barrel.** A barrel that was fully buried in the slide was flagged as showing nothing. It now protrudes about a unit past the slide and is 6-sided, within Valve's budget for a piece that size.
- **Size.** The length is 10.5 units, from the magazine's back to the muzzle, so slightly over the brief's 10. The grip is 224 of the 368 triangles.

**The files** (`work:9mmhandgun_weapon/`, same names as before, copy them into `<mod>/models/`):
- `v_9mmhandgun.mdl`: first person, with Valve's arms and animations.
- `p_9mmhandgun.mdl`: in another player's hands.
- `w_9mmhandgun.mdl`: lying in the world.

The spec is `work:9mmhandgun.spec.json`, and `work:9mmhandgun.mdl` is the single-file version.

**Caveats**

- I overwrote the earlier spec and the earlier kit-based files, so the old version is gone from the folder.
- I could not run Half-Life here. The pictures from the build show the new gun in first person, in another player's hands, lying in the world, and during the first shot. The line-up beside Valve's .357 and grenade is still the modder's judgment in the game.
- The first-person model is still smaller in detail than Valve's own, so if they still prefer Valve's, the most useful next step is a closer look at the grip panels and the slide.
