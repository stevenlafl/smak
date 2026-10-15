`sprites/glow01.spr` is built and the build says OK, with no warnings left. It is a 64x64, single-frame, parallel, additive sprite: a white glow with a bright core and a soft falloff. I tuned it on the build's own measures against `frames.png`; I did not compare it with the original any other way.

It is a single `glow` layer, white, with a `power` falloff (power 2.2, core 0.36, reach 1.15), placed as an `env_glow`.

How it measures against the original:

| Measure | Original | Mine |
| --- | --- | --- |
| Mean colour difference (delta E) | n/a | 1.3 (15 or under counts as near) |
| Dark share | 0.47 | 0.44 |
| Border brightness | 0 | 0 |
| Frame count | 1 | 1 |
| Shape overlap, mean (judges stop giving full marks under 0.8) | n/a | 0.81 |

The shape overlap is only just over the 0.8 bar. Broken down, it is 0.9 at the faint edge, 0.81 in the body and 0.72 in the core. I stopped there because the build says OK and the shape warning is gone.

The build also wrote `-sheet.png` and `-animated.png` beside the sprite in the work folder.
