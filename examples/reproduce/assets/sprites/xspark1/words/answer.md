`sprites/xspark1.spr` is built and the build says **OK**, with every check passed. It's in the work folder, with a `-sheet.png` contact sheet and an `-animated.png` beside it.

**What it is:** a 32x32 sprite, 11 frames, type parallel, format additive. The build places it as an `env_sprite` in render mode 5 (Additive) at framerate 10.

**How it looks:**
- **Core:** a near-white ball about 10 to 12 px across in the middle of the frame.
- **Inner glow:** a cyan halo around the core (RGB 60,220,255).
- **Outer lobes:** six soft teal-blue blobs (RGB 20,90,130) placed afresh every frame around the core. They reach roughly 26 to 30 px across and give the lumpy cloverleaf outline. They fade to black well before the edge: the border's light measured 0.001, against an allowed 0 to 0.005.
- **Motion:** overall size and brightness stay steady (the first and last frames sit at 0.89 of the peak), and only the lobes shift from frame to frame. The flicker measured 1.77, and the loop's wrap measured 1.3, below the 2.5 that counts as a jump.

**Where it differs from the description:**
- **Frame count:** the tool writes a loop's first frame again at the end, so I asked for a 10-frame loop to get 11 frames in the file. That means frame 10 is a copy of frame 0, so only 10 frames are different.
- **No dark specks in the core:** none of the effect types here can draw that crackle, so the core is plain white in every frame.
- **The core doesn't drift or wobble:** it stays centred. Only the lobes move.
- **Teal reads a bit cyan:** where the lobes overlap the cyan halo, the teal comes out lighter than RGB 20,90,130.
- **Framerate 10:** I picked the bottom of your 10 to 15 range because an `env_sprite` can't change frame more than 10 times a second.
- **Not compared to the original:** I had no picture of it to give the build as a reference. The only comparison was to Half-Life's own glow sprites, and it fell within their range.
