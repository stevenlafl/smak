A soft round glow: a single still image, 64 by 64 pixels, drawn additively so black counts as fully transparent and brighter pixels add light.

Shape and size: a perfectly circular blob centred in the frame. It has a small bright hot spot at the centre, about 4 to 6 pixels across, close to pure white. Around it the brightness falls off smoothly and evenly in every direction, roughly like a Gaussian or inverse-square curve. At about 10 pixels from the centre it is at mid grey. By 20 pixels it is a dim grey, and a very faint haze carries on almost to the frame edges, reaching black at a radius of about 30 to 32 pixels. The corners and edges must be pure black so no square outline shows. There are no rays, rings, spikes, streaks or noise, only a clean radial gradient.

Colour: neutral white to grey with no tint, so the game can tint it by render colour. The core is white and the falloff runs through even greys to black.

Animation: none. It is one frame that never changes, with no flicker, pulse, growth or fade of its own. Any fading or scaling comes from the engine.

Special notes: it is a parallel sprite, so it always faces the viewer flat. It is meant as a general light halo or soft glow placed over lamps, projectiles or effects. Keep the falloff very gradual so overlapping copies blend smoothly when added together.
