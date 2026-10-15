I built `sprites/xspark1.spr` and the last build says **OK** with every check passing. I didn't have a picture of the original to measure against, so it's only been checked against Half-Life's own glow sprites. How close it is to the original was judged by eye from your description.

```
size       32x32
frames     11
type       parallel (faces the viewer)
format     additive (render mode 5)
fps        10
border     0 (dark at the edge)
dark share 0.66
```

**How it's made:**
- **Core:** a soft glow, white in the middle (about 10 to 12 px across) going to cyan (60,220,255), then teal (20,90,130), then black.
- **Lobes:** six soft blobs placed fresh around the core every frame, coloured with the same ramp. They give the lumpy cloverleaf outline, about 26 to 30 px across. They swell on one side and pull in on another from frame to frame. The core moves very little and brightness stays steady (frame-to-frame jitter is 1.81).

**Where it differs from the original:**
- **No dark specks in the core.** None of the layer kinds can cut dark flecks into the white, so the "crackling" frames you describe aren't there.
- **It's set as one-shot, not loop.** With `loop: true` the tool writes the first frame again at the end, which gives 12 frames instead of 11. The lobes are placed at random every frame, so there's still no visible start or end. It loops fine with an `env_sprite` set to repeat.
- **10 fps instead of 12.** Your description says 10 to 15 fps, but the tool warns that an `env_sprite` changes frame at most 10 times a second and skips frames above that.

The file is at `work:sprites/xspark1.spr`, with `xspark1-sheet.png` and `xspark1-animated.png` next to it.
