I've stopped before compiling. The decompiled source looks right, but none of the tools I have can turn it into a .bsp.

**Done so far**
- Decompiled `frenzy.bsp` to `work/frenzy_copy/frenzy_copy.map`: 546 brushes, all 94 entities, 33 texture names, all from `halflife.wad`, `decals.wad` and `liquids.wad`.
- The plan check finds no leak and no errors. It warns that 252 brushes have points off the 1-unit grid, and that one env_glow (entity 22) sits inside a wall, which is probably the same in the original.
- I drew a plan of the source beside the original's. The layout, the 14 deathmatch starts and the 19 brush entities (doors, ladders, the health charger, the triggers) all line up. The only differences are in how a few marks are placed, nothing in the shape of the map.

**What's blocking the compile**
1. The decompile tool's compile step can't find VHLT, the GoldSrc map compilers. It only looks on the PATH. The build tool does have compilers: a small test room built OK.
2. The build tool only compiles specs, and won't take the decompiled source:
   - The decompile writes `frenzy_copy.spec.json` with a `source` key. The build rejects it: `source: not a field of a map spec`, then `rooms: a list of one room at least`.
   - Loading the .map as a prefab fails because a prefab's textures must be renamed to SM_ names, and this one uses real names like NULL.
   - A .map can't be built directly.

So the decompile writes a spec that the build can't read, which looks like a bug between the two tools. I have no tool that edits files, so I can't rename the textures in the .map myself.

**Options**
- **A (my pick):** you point the server at the compilers, by setting `VHLT_DIR` to the folder build uses or putting it on the PATH, then restart it. I rerun the decompile, which then compiles itself. The tool's own docs measure this round trip on frenzy as a 100% texture match, with the light at 0.91 of the original. After that I check the result against the original with plans, views, sections and the walk test.
- **B:** you, or a shell tool you give me, rename the textures in the .map to SM_ names so it loads as a prefab. That's a workaround, and the big carved room it sits in may affect how the map is lit and how visibility is worked out.
- **C:** I rebuild frenzy by hand as a spec of rooms. This builds today, but it will clearly lose against the original when the pictures are compared side by side, so I'd only do it if A and B are out.

Which do you want? If it's A, tell me the compiler folder if you know it.
