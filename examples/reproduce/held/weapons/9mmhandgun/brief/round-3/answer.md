The model builds OK. It is a first-person, third-person and world version of a 9mm pistol that replaces the game's three weapon files.

**What's in it**
- Dark grey steel slide and barrel, with a dark grey polymer frame and trigger guard, and a black polymer grip. A front and rear sight sit on the slide. A small magazine base shows at the bottom of the grip.
- Built 10 units long along the barrel, with the grip at the back end, as the weapon section asks. The model is 132 triangles, and the barrel is at 24, which is Valve's limit for a piece that small.
- The three weapon files keep Valve's hands, bones, animations and events. Only the weapon's meshes change.
- The build checked the model against each of the game's three files, and it found no faults.

**Files to put in the mod** (copy the folder's three files into `<mod>/models/`, and they replace the game's):
- `work:9mmhandgun_weapon/v_9mmhandgun.mdl`: first person, with the hands
- `work:9mmhandgun_weapon/p_9mmhandgun.mdl`: in another player's hands
- `work:9mmhandgun_weapon/w_9mmhandgun.mdl`: lying in the world

`work:9mmhandgun.mdl` is the stand-alone model, for a viewer. The spec that makes all of it is `work:9mmhandgun.json`, so it can be rebuilt.

**Choices I made**
- Size: I used the weapon's default, which stretches the pistol to the game's own length, so it sits at the same size as Half-Life's in game. If they want it at its own 10-unit length, the size needs changing to `"own"`.
- Sounds: none are given, so the game's own sounds play.
- Build fixes: I changed the grip, trigger, sights and guard post so the parts meet, and the last rebuild dropped the one fault it reported.

I haven't run it in the game, so whether it is at least as good as Half-Life's is for the modder to judge there. It's a simple box-built pistol, with a flat-coloured look rather than the game's detail.
