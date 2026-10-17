The build says OK with no warnings, and the parts are checked against each other.

**What I changed**

- **Folding stock and hook.** The kit's `stock: "folding"` option did nothing, so I dropped the kit and wrote the gun as explicit parts in `work:shotgun.mdl.json`. The stock now joins the receiver through a visible black metal knuckle (the hinge). At the heel there is a metal butt plate with a curved hook that rises up and back over the end. The hook is clear in the left side, right side and from-below views.
- **Pump.** Still under the barrel, still wood. The first-person attack frames show it working.
- **Black metal.** The receiver, barrel, magazine, trigger, guard and butt plate are black steel, as before.
- **Warnings.** The two-warning build from before is gone: the trigger guard and hinge were too many triangles for their size, so they are now a few boxes. Three near-touch joints were also closed up.

**What I did not change, and what is still open**

- **The stock body is still a straight wooden box.** I did not taper or carve it, so the reviewer's "straight slab" point still stands for the stock body. Only the knuckle, butt plate and hook are new.
- **No fold pose.** The stock is drawn open. The hinge is there, but the model has no folded position or fold animation. I can add one if the modder wants the stock swung to the side or over the receiver.
- **Not seen in the game.** I looked at the build's pictures only. The modder should compare it with Half-Life's own in the game, or I can open the viewer for them to do it.

**Numbers from the build**

| Item | Value |
| --- | --- |
| Length | 31.2 units (asked for 30) |
| Triangles, first person (`v_`) | 264 |
| Triangles, other player's hands (`p_`) and world (`w_`) | 156 |
| Checks | OK, no warnings |

**Files**

- Spec: `work:shotgun.mdl.json` (copy: `work:shotgun.spec.json`)
- Models: `work:shotgun_weapon/v_shotgun.mdl`, `p_shotgun.mdl`, `w_shotgun.mdl`

The modder copies the three files into `<mod>/models`, replacing the game's own.
