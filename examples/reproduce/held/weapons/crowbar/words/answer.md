The crowbar is built and the build says OK. All three game files were made from the game's own v_crowbar.mdl, p_crowbar.mdl and w_crowbar.mdl, and they keep the game's hands, bones and animations.

**Shape** (the build's measurements):
- **Size:** 43.1 long, 10 wide and 2.7 thick, against the described 43.4 × 9.8 × 2.7. The game files are stretched to the old crowbar's length anyway.
- **Shaft:** a round red bar 1.4 across, with a darker red band just past the middle and faint patches near the ends. A short bare-steel collar sits at each end.
- **Hook:** a gooseneck bent through 150° in one flat plane, made of five straight facets. Its tip ends about 8 to 9 units out to the side. The claw is a flattened fishtail 2.5 wide with a dark edge.
- **Chisel:** angled 8° away from the hook. Edge-on, it widens from shaft width to a square blade 2.7 across, and it darkens toward the tip.
- **Count:** 376 triangles in total, but each file holds less, because the hook and claw are built twice and each file gets only one copy.

**The three views:**
- **First person:** the red shaft rises from the lower right and the hook curls over to the left. The attack swings up and out to the right, stands straight up, drives down to the lower left and comes back.
- **Another player's hands:** held at the chisel end, with the hook hanging at the far end and its curve turned down.
- **Lying in the world:** flat colours, grey steel ends and a red middle.

**Where it differs from the description:**
- **No chrome in first person.** I turned off the engine's chrome reflection because it made the red shaft look mostly grey. Instead, the shaft has painted light shading and a pale highlight stripe. That stripe hardly shows in the preview, so the "glossy with near-black edges" look is weaker than described.
- **Hook colour by view.** To get a dark gunmetal hook in first person but a mid-grey one in the other two views, the hook and claw are built twice. The first-person copy sits 0.02 units off the other so the build's checks pass.
- **Width.** It comes out 10 rather than 9.8.

I only looked at the build's preview pictures. I didn't load the files in the game.

Files are in the work folder:
- crowbar.spec.json
- crowbar.mdl
- crowbar_weapon/v_crowbar.mdl
- crowbar_weapon/p_crowbar.mdl
- crowbar_weapon/w_crowbar.mdl
