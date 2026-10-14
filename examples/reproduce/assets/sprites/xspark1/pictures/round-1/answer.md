I built `sprites/xspark1.spr` and the build says OK with every check passing. It's in the work folder with a frame sheet and an animated preview next to it.

**What matches the original:**
- 32x32, 11 frames, type parallel, format additive, centred origin.
- It's a cyan spark glow: a white-hot core inside a saturated cyan body, with soft lobes reaching most of the way to the edges of the frame.
- The edges stay dark, so the square doesn't show in game. It's set up as an `env_sprite` with additive render mode at 10 frames per second.

**Where it differs:**
- **Shape doesn't move enough:** in the original the lobes shift a lot from frame to frame, so it looks like a different blob each time. The sprite spec doesn't let me move layers per frame. I built the lobes from four fixed off-centre cyan glows and laid a faint cyan smoke layer over them for some frame-to-frame wobble. So the outline is a steadier four-lobed cross than the original's.
- **Too even:** my lobes are more symmetric and a bit sharper. When I tried softening them and making them uneven, the sprite turned square, so I went back to the version shown.

**Layers I tried and dropped:**
- **Sparks:** a slow sparks layer drew nothing visible.
- **Heavy smoke:** the first build used heavy smoke and blew the whole frame out to white.

**Frame count:** I turned looping off. With looping on, the tool appends a copy of the first frame, which gives 12 frames instead of the original's 11.
