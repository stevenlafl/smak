I could not build frenzy_copy. The map is not built and nothing has been written to disk.

**What's stuck:** this smak build does not accept the `floorplan` field. Every build reports `floorplan: not a field of a map spec, left out`, whatever the directory (`work:heightplan/`, `heightplan/`, or an absolute path) and whatever the key is spelt. The guide and the command line both describe `floorplan` as the way to carve the space from the height plans, so this build is probably older than its docs. With no floor plan and no rooms, the map has no space to build in. The API document doesn't mention floor-plan carving at all, so I couldn't find another route in the tools I have.

**What I verified:**
- All 93 point entities from `entities.txt` pass the build's FGD checks. Once the `env_glow` sprite key was added, the only remaining error was the missing rooms/floor plan.
- The height plan, the entity list and `plan.png` read fine from the input folder.

**What I left out, and why:**
- The brush entities need brushes, so they are not in the spec yet: 14 `func_wall`, 2 `func_ladder`, 2 `func_door` with their 2 `trigger_multiple`, and 1 `func_healthcharger`. They need the carved walls and openings, which depend on the floor plan.
- Textures and light are unset. The theme words I tried (`concrete`, `metal`, `ceil`) are guesses, and the lights and glows use default brightness and colour.
- The reference `research/map-geometry.md` and the reproduce folder's README and spec are outside the permissions granted to me, so I couldn't read them. They may say how the build should be called.

**Options:**
1. **Recommended:** update the smak MCP server to the version that reads `floorplan` (the one the docs describe). Then I rebuild with the entity list above, add the brush entities once their brushes exist, set the textures and light, and check against the pictures.
2. Run `smak map-compile` from the command line in the smak repo, if that version accepts the spec. I have no shell here, so I haven't tested it.
3. Approximate the map with hand-drawn rooms. I don't recommend it: it won't match the original's layout, and that is what you're judging.

Tell me which you want. If you can grant read access to the reproduce folder's README and `research/map-geometry.md`, I can check the expected build call before the rebuild.
