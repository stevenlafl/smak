I built `sprites/muzzleflash1.spr` and the build says OK, with every check passed. It's 64x64 with 2 frames, type parallel, format additive. It gets placed as a tempent with render mode 5 (Additive) at 20 frames per second, so the two frames flicker as a loop. I set it to be placed as a tempent because the guide lists a muzzle flash under that use.

**What it looks like:**
- **Core:** a near-white, warm core about 11 px across in the centre, with a faint haze around it.
- **Rays:** five thin, soft rays. One points up (about 90°), two point sideways a little above horizontal (about 12° and 167°), and two point down at roughly 7 and 5 o'clock (about 240° and 300°). Each ray is about 3–4 px wide at the base and tapers to a soft point 27–29 px from the centre. The edge of the frame stays dark.
- **Colour:** it uses the kit's `muzzle` colour ramp, which is the average colour of Half-Life's own muzzle flash at each brightness level. That gives white in the middle, then peach, then tan at the ends of the rays. Measured against Half-Life's own flare sprite, it falls within range.
- **The two frames:** the core is the same size and brightness in both. Only the rays change: each one moves by about 3° and gets longer or shorter by 1–2 px.

The spec format has no setting for making one frame different from the next. To get two different frames, I drew two stars and gave each a brightness envelope (the `env` setting, which sets how bright a layer is over time) so that each star shows in only one frame. I tested this first with two single-ray stars, and the frames came out cleanly separate.

That test left a file, `sprites/test.spr`, in the work folder. These tools can't delete it, so you can remove it by hand.
