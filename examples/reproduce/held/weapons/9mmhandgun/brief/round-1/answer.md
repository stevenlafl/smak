The pistol model builds **OK**, with every check passed. I haven't run it in the game, since I can't launch Half-Life here. The pictures are the only look I've had at it.

**What I made**

- **Spec:** `9mmhandgun.mdl`, kind `held`, with `weapon: { like: "9mmhandgun" }`. Its spec is at `work:9mmhandgun.spec.json`.
- **Model:** 116 triangles in eight parts, all built from boxes plus one short barrel cylinder:
  - Slide: dark grey steel, with an ejection-port panel on each side.
  - Barrel: steel, out the front of the slide.
  - Frame: black polymer, under the slide.
  - Grip: black polymer, with a steel magazine base below it.
  - Trigger guard: black polymer, a solid block under the frame.
  - Front and rear sights: steel.
- **Materials:** the slide and small parts use the steel base, and the polymer parts use a black paint.
- **Size:** I gave no size, so the default applies and the weapon is stretched to the length of Valve's own.

**What's in the mod folder**

Three files are written to `work:9mmhandgun_weapon/`, named as the game names its own:

- `v_9mmhandgun.mdl` (first person, with the game's hands and animations)
- `p_9mmhandgun.mdl` (in another player's hands)
- `w_9mmhandgun.mdl` (lying in the world)

To use them, copy the three into the mod's `models` folder so they replace the game's files of the same names. The game loads them with no code changes. The texture is inside each `.mdl`.

**Whether it is at least as good**

I don't think it is, yet. The fit is right: the hands and animations are the game's, and the proportions read as a pistol from the side and the back. But it is blocky. It has no trigger, hammer or slide serrations, the grip is a plain box, and the paint is flat, so it will look cruder than Valve's detailed model up close.

If they want it to match, the next step is a more detailed pass: a trigger, a hammer, slide serrations and a grip texture. That will raise the triangle count, which is still well inside Valve's range for a held weapon. I can make that change if you want it.

**Other notes**

- The second build's report said "nothing changed" and "8 parts are where they were", but I had moved the barrel down so it sits on the frame. The report's wording was wrong there; the geometry is what the build reports above.
- The build also noted that the trigger guard, front sight and rear sight are thin boxes that could be paint instead. I left them as boxes.
