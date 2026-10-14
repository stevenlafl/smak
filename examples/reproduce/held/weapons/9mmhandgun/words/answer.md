The pistol is built and the build says **OK**: every check passed.

**What it is:** a squared-off pistol 14.8 units long, 2.8 wide and 9.5 high, matching your description. It has 128 triangles in one texture.

- **Slide:** a square-section box with the dark bore high in the muzzle face and a recessed panel with a rim along both flanks. It has five dark cross grooves in the last 1.5 units, a notched rear sight and a small front post.
- **Frame and trigger guard:** the frame starts about 5 units back from the muzzle. The trigger guard is an open square loop 2.5 units deep with its front edge raked, and the curved trigger sits near its back.
- **Grip:** a 5.5-unit slab flush with the back of the slide, reaching 6.7 below it and raked back 5 degrees. The butt is cut square, with a lighter magazine-base strip on its rear edge.
- **Colours:** the slide is dark polished steel with a slight blue tint and lighter worn edges. The frame and grip are flatter charcoal. There are no markings.

**The three views:** the build fitted the gun into the game's own `v_`, `p_` and `w_9mmhandgun.mdl` from your Half-Life install. They keep the game's hands, bones and all 10 first-person animations, so the attack kick is the game's own.
- **First person:** it sits in the lower right in the orange-sleeved, black-gloved hand, angled up and to the left, with the rear of the slide facing you.
- **Lying in the world:** it lies on its side.
- **In another player's hands (`p_`):** in that file's own pose it points steeply down and away. In the game the player's hand sets the angle you actually see.

**Caveats:**
- **The originals weren't compared:** the tools won't open files outside the work folder, so I couldn't draw the original `p_` and `w_` models. The build placed the new gun along the old one's outline in each file, but I haven't set the two side by side by eye. The first-person comparison picture also showed only the new model.
- **The serrations are painted on,** not cut into the shape.

**Files:**
- The installable models, under the game's own names: `work:9mmhandgun_weapon/v_9mmhandgun.mdl`, `p_9mmhandgun.mdl` and `w_9mmhandgun.mdl`. Put them in `<mod>/models` and they replace the originals.
- The model and its spec: `work:9mmhandgun.mdl` and `work:9mmhandgun.spec.json`.
