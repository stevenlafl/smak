The build says **OK** and every check passed. The pistol is built as `9mmhandgun.mdl` and fitted into the game's three files, which keep their hands, bones and animations:

- `work:9mmhandgun_weapon/v_9mmhandgun.mdl` (first person)
- `work:9mmhandgun_weapon/p_9mmhandgun.mdl` (in another player's hands)
- `work:9mmhandgun_weapon/w_9mmhandgun.mdl` (lying in the world)

The spec is saved as `work:9mmhandgun.spec.json`. To use the files, copy them into `<mod>/models`; they replace the game's own under the same names.

**What's in it** (120 triangles):

| Part | How it's made |
| --- | --- |
| Slide | A square box 14.8 × 2.8 × 2.8. Each side has a recessed panel with a raised rim. Five dark grooves sit near the rear, a dark round bore about 1 unit across sits high on the muzzle face, and the rear face is dark |
| Sights | A square notch at the rear made of two small blocks, and a small post at the front |
| Frame and trigger guard | A thin frame under the slide. The guard is an open loop starting about 5 units back from the muzzle and hanging about 2.5 units, with its front edge raked. A small curved trigger sits near the back of it |
| Grip | A 5.5-unit slab flush with the back of the slide that rakes 5° backward. It has stippled side panels and a lighter strip at the bottom of the rear edge where the magazine base sits |
| Finish | Polished gunmetal slide with lighter rubbed edges, a darker charcoal frame and grip, no rust and no coloured markings. In first person the engine's chrome is on, as on Valve's own first-person weapons |

The model measures 14.8 long, 2.8 thick and 9.5 from the top of the slide to the bottom of the grip, as described. Counting the sight tops and the 0.24 that the raked grip's corner dips below its base, it is 10.1 high.

**Two things I couldn't check:**
- **The original models.** The game's files are outside the folders the tool will draw from, so I never saw the originals side by side with mine. The tool chose how the gun is turned in the in-hand and world files by matching the old gun's outline. The world one lies flat on its side as described. The in-hand file on its own shows the gun at an angle, because it only takes its pose from the player's hand bones in the game, so I couldn't confirm "upright, muzzle straight ahead" there.
- **The rear of the slide in first person.** The tool's first-person picture still draws it lighter than "nearly black". It's dark on the texture (the six-side sheet shows that), so I think it's the tool's flat stand-in for the chrome effect, which it can't show the way the game does. Check it in the game.

The game's animations are kept as they are, so the shot's kick, rise and settle are the original's. The fitted gun follows them in the drawn frames.
