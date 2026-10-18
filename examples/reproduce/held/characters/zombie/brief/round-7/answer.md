The zombie model builds OK: `work:zombie.mdl` (1.1 MB), with the spec at `work:zombie.spec.json`. It passes every check, but the report still has warnings, and I could not compare it with Half-Life's own zombie. That comparison needs the game, so the verdict on "at least as good" is yours.

**What it is**

- A scientist in a torn, bloodied white lab coat, hunched forward, with a dark parasite over the head and a tentacle down the back. The claws are on both hands.
- Built as a character on Gordon's skeleton (`player/gordon/gordon.mdl`), with `floor: 0`. The feet stand at the origin and the height is 68.4 units.
- It keeps Gordon's 77 animations, including walk, run, idle and the death sequences.

**How I made it**

1. **Picture:** zimage-turbo drew a scientist held to Gordon's stance. I used seed 1 because its parasite covers the head.
2. **Shape:** hunyuan3d-mini turned that picture into a 3D mesh. hunyuan3d-paint painted the two side views.
3. **Model:** a spec of kind `character` on Gordon. The mesh is projected with the front picture and the two side views. The spine is tilted forward for the hunch, and the body is bound in that stance. The arms are held out so they do not touch the trunk. Claws are `fingers` parts on each hand. The parasite is a sphere on the head bone, with one tentacle mirrored across.

**Where it still falls short**

- **No slash.** Gordon's skeleton has no melee animation. The game's zombie code plays its slash through a melee activity, so the slash will not play. Adding one needs a new animation, which I have not done because you asked for the skeleton's own animations. Say if you want one.
- **The scientist skeleton would not work.** It was my first choice because it has a melee activity. The kit cannot read it: its `lying_on_back` animation is kept in another file.
- **Parasite is weak.** The head reads as a dark crown on a beige head. The picture's tentacles are mostly lost at this polygon count.
- **Claws were cut back.** Four claws 6 units long broke the outline check: the side silhouette no longer matched the picture. The model has three claws per hand, 4.5 units long.
- **Warnings left:**
  - The front and side outlines are 0.76 against the pictures' (the 0.8 warning line).
  - 36 triangles join arms and the trunk, which may tear in some motions.
  - Some triangles stretch in the run.
- **Triangle budget:** 658 in use. The limit is 724, twice the base's 362 triangles; Half-Life creatures of this size have a median of 740.
- **Replacing the game's zombie.mdl:** the game's zombie code calls animations by number and activity. Gordon's numbering differs, so the mod's code will need checking.

**Licences:** the mesh came from hunyuan3d-mini, whose source headers say non-commercial. You accepted the local generators' licences for this test only.
