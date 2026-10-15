The sprite builds with no warnings: `sprites/flare1.spr` is written to the work folder, with its `-sheet.png` and `-animated.png` beside it.

**What it is:** a soft, round glow. A bright white-pink core sits in the middle, fading through a lavender-pink halo to black at the edge.

**Spec as built:**
- **Name:** `sprites/flare1.spr`, `use: env_sprite`, `class: flare`
- **Size and frames:** 64x64, 1 frame, origin centred
- **Type and format:** `parallel`, `additive` (matches the original's facts line)
- **Layers:**
  - A broad halo: radius 0.95, smooth falloff, colour `[1, 0.62, 0.85]`, gain 0.7, with `finish: edge`
  - A hot core: radius 0.6, power falloff, colour `[1, 0.92, 0.97]`, gain 1.0

**Measured against the original (from the report):**

| Measure | Original | Mine |
|---|---|---|
| Mean colour (delta E, 15 or under is near) | reference | 9.8 |
| Share that is dark | 0.39 | 0.35 |
| Shape overlap, faint edge / body / core | reference | 0.94 / 0.95 / 0.90 (mean 0.93) |
| Frames | 1 | 1 |
| Brightest / pixels over 0.7 | 0.91 / 530 | 0.91 / 408 |

**Where it still differs:**
- The original's hot middle is larger (530 pixels over 0.7, against my 408), so its core reads slightly bigger. The report gave no warning for this, but it is the most visible gap.
- The original has faint radial rays across the halo. I tried a flare layer with rays, but it drew a hard horizontal and vertical cross that the original does not have, so I dropped it. The halo is smoother than the original as a result.
- The original's contact sheet has a small "0" index marker in its corner. That is part of the sheet, not the sprite, and I did not copy it.

Iterations: I tried four variants before this one. The first two gave a strong cross streak. A third was too diffuse. The fourth was close, and tuning the halo's radius and adding `finish: edge` brought the last warnings to zero.
