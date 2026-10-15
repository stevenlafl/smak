I haven't built the character yet. The build needs Gordon's skeleton file, and this SMAK server has no game models folder set, so `player/gordon/gordon.mdl` can't be found.

**What's blocking it:** The server was started without a models folder (`--models <dir>`). I tried the usual Steam install paths for Half-Life (`valve/models`, and `gearbox/models` under `~/.local/share/Steam` and `~/.steam/steam`), but reading them needs permission I haven't been given, so I stopped there rather than search the disk.

**What I need from you:** the path to the Half-Life models folder, the one that contains `player/gordon/gordon.mdl`. Then I can restart the server with it or pass it in, and the build can start.

**What I've established from the pictures so far:**
- Four legs: two front, two back. The front legs are the ones under the big face.
- A large round, dark, pitted mouth on the front, a little below the top.
- A ridge of about six spiky plates along the top of the back, banded in teal, brown and yellow.
- The body is a bulbous barrel, about 49 long, 33 wide and 44.7 high.
- Colours: olive-yellow body, teal and dark-brown stripes, cream underside, pale hooves.

**Choices I'd make once the base loads:**
- Build it on Gordon's skeleton with `"floor": 0` and `"kind": "character"`, named `houndeye.mdl`.
- Use the arm bones for the front legs and the thigh bones for the back legs.
- Check the first frame against the front, side and back views first, then look at the run.
- Leave the base's animations unfitted to the run. Fitting `motion.png` would make a human walk cycle drive a four-legged body, which may look worse. Say if you want it fitted anyway.
