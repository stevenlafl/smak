A soft, round glow: one blurred light spot with no edges. It is an additive sprite, 64x64, a single frame, always facing the viewer.

Shape and size: a perfect circle centred in the frame. A small hot core about 4 to 6 pixels across sits at the exact centre. Around it, brightness falls off smoothly in a broad Gaussian-like haze. The haze is visible out to a radius of about 26 to 28 pixels and fades fully to black before the frame edge, so the corners and borders are pure black with no hard rim or clipping. There are no rings, rays, streaks or noise, just a clean radial gradient.

Colours: entirely neutral, with no tint at all.
- Core: near pure white, RGB about (1.0, 1.0, 1.0), only at the centre.
- Middle (radius about 10 pixels): soft mid grey, about (0.45, 0.45, 0.45).
- Outer haze (radius about 20 pixels): dim grey, about (0.15, 0.15, 0.15).
- Rim: down to black (0, 0, 0).

Red, green and blue stay equal at every radius. Because the sprite is additive, it takes on whatever colour the engine tints it, so author it as pure greyscale. The falloff is steep near the core and long and gentle in the tail. Most of the disc reads as a faint grey bloom, with only a small bright point.

Animation: none. It is one static frame. Any pulsing or fading comes from the engine's scale and alpha, not from the image.
