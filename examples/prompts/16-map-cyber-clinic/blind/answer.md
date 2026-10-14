I built the clinic and the build says **OK**: every check passed. That means no leaks, everything you need to reach can be reached on foot, nothing is stuck in solid, nothing is too dark, and it compiled.

**File:** `work:cyberclinic/cyberclinic.bsp`. The spec builds it as map `cyberclinic`. The `.map` source and the clinic's own `.wad` are next to it.

What I made of each thing you asked for:

- **Street (night, faint):** a 640 × 256 strip of asphalt open to the sky, with dark brick walls and dim blue-ish moonlight. Its floor light is 57 out of 255, which is faint but not black. It's marked as a test room, so it gets left out when you drop the clinic into the city. You start on it facing the clinic's front door.
- **Front door into the waiting room:** a steel door that slides up, 64 wide and 96 high, in the waiting room's south wall. The waiting room is the module's first room, so that south side is where your city street meets it.
- **Waiting room (320 × 256, 128 high):** dirty off-white tile on the floor and walls. It's lit flat by two pale-green lamps (floor light 168). Inside:
  - a rusty metal bench with a backrest along the west wall
  - a reception desk with the doctor behind it, facing the room (a scientist character, the base game's own model)
  - a vending machine against the north wall with a glowing magenta front. The front gives off light itself, plus a small pink light in front of it.
- **Second door, at the back:** a sliding steel door in the middle of the north wall.
- **Surgery (384 × 320, 160 high, so 32 taller):** clean white tile on the floor, walls and ceiling. It's the brightest room in this map (floor light 209). Inside:
  - an operating chair in the middle (pedestal, seat, sloped back and leg rest)
  - a ceiling-hung surgical lamp over the chair with a glowing white disc and a downward spotlight. The plan shows a brighter pool of light on and around the chair.
  - a cart beside the chair with two glowing cyan monitors on top
  - along the back wall, a three-board shelf of 12 glowing green jars
  - a small steel table by the chair with a health kit on it

What I couldn't do or check:

- **Brightest in the city:** the surgery is the brightest room in this map. I can't compare it with your other shops because I don't have them here.
- **Jars and tools:** the "jars of cybernetic parts" are glowing green cylinders. The tool tray is the standard health kit item. There are no real modelled parts or instruments.
- **Sky picture:** the sky is set to the stock `desert`, and the preview drew it as a flat dark colour because that picture wasn't in the folders the kit looks in. Pick a night sky name when you put this into the city.
- **Remaining warnings:**
  - Some round pieces (the lamp disc, the chair base, the jars) have points that aren't on whole-unit positions. The compile didn't complain.
  - The middle of the surgery isn't walkable because the chair is there.
- **Lighting:** the brightness numbers come from the compiler. The kit's pictures only stand in for the engine's lighting, so check how it actually looks in the game.
