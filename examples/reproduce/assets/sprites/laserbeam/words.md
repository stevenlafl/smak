A beam texture: one 32x64 additive frame, meant to be tiled along a laser or energy beam. It shows a bright vertical stripe running the full 64-pixel height, so the top and bottom edges join seamlessly when repeated.

Shape: a solid white core about 8 to 10 pixels wide sits at the horizontal centre (roughly columns 11 to 21). It doesn't move along the length. On each side the brightness falls off smoothly over about 6 to 8 pixels into a soft grey glow. The outer 3 to 5 pixels at each edge are nearly black. The glow isn't perfectly even: faint, blotchy, vertically streaked darker and lighter patches run down the flanks, a bit like smeared noise. This makes the edges look slightly ragged and alive, while the core stays clean and flat.

Colour: the texture has no hue and is fully greyscale, so the game tints it with the beam's colour. From core to rim, it goes from pure white (RGB 1.0, 1.0, 1.0) through a mid grey with a very faint cool cast (about 0.55, 0.56, 0.60) to a dim grey edge (about 0.12, 0.12, 0.14), then black. The core is fully saturated white for about a third of the width. Because the sprite is additive, the black adds nothing and only the stripe glows.

Animation: none. It's a single static frame. Any flicker or motion comes from the engine scrolling or stretching it along the beam. It's drawn parallel to the view, so it always faces the camera.
