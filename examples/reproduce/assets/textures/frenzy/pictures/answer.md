The `frenzy_new.wad` build says OK, but it covers 25 textures, not all 37 the map uses. The 12 I left out have no pictures, so I had nothing to match them to.

**Built:** `work:frenzy_new/frenzy_new.wad`, plus a sheet at `work:frenzy_new/frenzy_new-textures.png`. Each of the 25 has its original name and size, and sides are multiples of 16. The preview of `models:frenzy.bsp` wearing them, and each texture on its own place at brightness 4.5, both render.

**What I did for each texture:**
- The pictures are in-game views with the texture visible, not flat textures. I read each one by eye and built a procedural material from it: base kind, tone, wear, and relief (louvres, bars, seams, pipes, rivets, lamp faces). I did not feed the pictures in as material sources, because the kit forbids using a game's own texture that way.
- Kinds kept: `{` holes (none among these 25), `+0~` lamp faces as neon or lamp relief, and the `+a~` frame as the dark off-state.
- I tuned tones by comparing each rendered tile against its picture. Lighter walls (`c3a1b_w1`, `c3a1b_w1a`, `c3a1b_w7`) came down, and `c3a1_w2` came up from too dark.

**Not matched exactly:** the tile spacing and the louvre and bar arrangements are estimates from the pictures. I guessed the `bars` `axis` values (`"x"`/`"y"`) and the build did not reject them, but I did not confirm what they mean. The preview's texture-wear check flags a few flat originals (`black`, `crete2_flr01`, `yellow`, `c3a2_bth1`, `c3a2a_tnk1b`). I left them flat because their pictures are flat too.

**Missing (the map uses them, no picture given):**
```
+0medkit      c2a3rustdoor1   medkitedge1
{grate4a      {ladder1        {rail1b
```
The map also names `+amedkit`, `-1genpipe1`, `-2genpipe1`, `aaatrigger`, `+a~fifts_lght01` and `+a~generic86`, which the preview does not report as worn. I need pictures for these 12 (or for the 6 the preview does report) to build them. Until then the preview draws them flat.

The spec was passed inline and is not saved as a file in the work folder. Say if you want it saved next to the .wad so a rebuild is one command.
