The crowbar is built and the build says **OK**: every check passed. I made one spec, `crowbar.mdl`, and it writes `work:crowbar_weapon/v_crowbar.mdl`, `p_crowbar.mdl` and `w_crowbar.mdl` under the game's own names. They keep the game's hands, bones and all 11 first-person animations; only the crowbar mesh is new.

**Size against the original (43.4 × 9.8 × 2.7):** the last build measures 43.2 long, 9.6 wide and 2.7 high. The build also stretches it to the old crowbar's length in each file.

**Shape and colours:**
- **Shaft:** red, six-sided, with a slight bow and a crease at the middle. That makes its two halves catch the light differently, as the original's do.
- **Collars:** a light grey collar at each end of the red.
- **Chisel end (the grip end):** a grey wedge that flattens and widens to the full 2.7 height and bends a little to one side.
- **Hook end:** a grey hook curving round in the flat plane, ending in a claw that flares in height.

**Fit in the three views:**
- The world model lies the same way round as the original in all six side views: hook on the same side, chisel bending the opposite way.
- The in-hand model hangs hook-down, as in in-hand.png.
- In first person, the hook sits at the top and points left, through the whole attack.

**Approximations to look at in the side-by-side:**
- **Darker hook in first person only.** The original's hook is dark in the hands view but light grey in the world and in-hand views. I couldn't give one part a different colour per file, so the hook, its collar and the claw are each built twice: a dark copy for first person and a grey copy for the other two. Each file gets one copy, about 228 triangles. Only the master `crowbar.mdl` carries both (360).
- **No engine chrome.** I tried it, but it turned the red shaft silver. The original's first-person view keeps a red shaft with dark streaks along its edges, so I left chrome off. Ours shows flat red there, without the streaks.
- **Claw tip.** In the world view, ours reads a little knobbier than the original's thin, tapered end.
