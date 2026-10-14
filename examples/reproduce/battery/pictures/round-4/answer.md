`battery.mdl` is built, the build says OK, and it matches the originals closely from all ten cameras.

**How I made it:** it's one shape carved from the outlines in all ten of your pictures. Then those same pictures are laid onto it as its texture, so the colours, materials and markings come straight from the original. The texture is one 512 x 512 picture.

**How it compares:**
- **Size:** 10.3 long, 10.3 wide and 18.4 high, standing on the floor.
- **Outline:** it scores 0.998 to 1.0 against the original in every view except from below (more on that in the last point).
- **Detail:** I put the four close angles next to the originals. These all match: the eight-sided body, the green screens, the white corner panels, the orange lights on top, the yellow stripe band, the dark bottom bevel, the round cap and the tilted lever.
- **Triangles:** 260. I started at 600 and stepped down; 260 looked the same. The build still warns about it, because Half-Life's props this size have about 51 at the median, but the angled lever and the round cap need more.

**Where it falls short:**
- **The lever's yellow spreads a little.** It's a thin tilted plate, and carving from outlines makes it slightly thicker than the original. Some of its stripes spill onto the cap block behind it. You can see this in the close angles.
- **The bottom is closed, but the original's is open.** In your "below" picture you see through the original into its inside. Mine has a solid bottom, painted from that picture: background grey inside the dark rim, plus the gold and green bits. From that camera it looks the same. Seen from below at any other angle, it will show as a grey floor, not a hole.

Files are in the work folder: `battery.mdl`, `battery.spec.json` (the spec, to rebuild it) and `battery-sheet.png` (the six sides).
