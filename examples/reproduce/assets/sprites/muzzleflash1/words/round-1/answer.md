I built `sprites/muzzleflash1.spr` and the build says OK with every check passed.

**What it is:**

```
size          64x64
frames        2 (no repeated wrap frame, so it has exactly the original's 2)
type          parallel (always faces the viewer)
format        additive (black is transparent), render mode 5
placed as     tempent (temporary effect), 20 fps
colours       254 in the palette, quantising loss 0.0005
border        0 (no light reaches the edge)
```

**Shape:** a soft near-white core about 10 to 11 pixels across, with a faint amber haze around it. Five tapering rays come out of it:

```
ray          frame 0 (angle, length)    frame 1
up           92 deg, ~27.5 px           90 deg, ~26.5 px
left         163 deg, ~25.5 px          166 deg, ~27 px
right        17 deg, ~26.5 px           14 deg, ~25.5 px
down-left    237 deg, ~27 px            240 deg, ~27.5 px
down-right   304 deg, ~26 px            301 deg, ~27 px
```

Angles run counter-clockwise from pointing right. Each ray is about 3 to 4 px wide at the base and fades to a soft tip about 28 to 29 px from the centre, leaving a few pixels of margin. Along each ray the colour goes cream, pale gold, amber-orange, then dim brownish orange at the tip. Between the two frames the core and haze don't change; only the rays move by 2 to 3 degrees and change length by a pixel or so, which gives the shimmer.

**How it's built:** the kit's own `flare` layer can only draw rays that go both ways from the centre, which gives a 10-point star. So I built each ray from a chain of 10 small glows. Each glow is set to show in only one frame, which is how the two frames get different rays. I flattened the top of each glow so the rays look smooth rather than beaded.

**Other things to know:**
- `render` can't draw `.spr` files: it fails with an offset error. The only pictures I had to check against were the build's own frame sheet, and both frames look as described.
- While testing I left a scratch `sprites/test.spr` in the work folder. These tools can't delete files, so you'll need to remove it yourself.

The output is `work:sprites/muzzleflash1.spr`, with `-sheet.png` and `-animated.png` previews next to it.
