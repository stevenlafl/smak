I built `sprites/laserbeam.spr` as a beam sprite, and the build says OK with every check passed. There was no reference picture to measure against. The comparison with Half-Life's own beam came back "0 of 0 in range", so it checked nothing, and I judged the result by eye from the rendered sheet.

- **Facts:** 32x64, 1 frame, type parallel, format additive, placed as a beam (render mode 5, additive).
- **Core:** a bright, near-white band about 9 pixels wide, as bright at the top as at the bottom (envelope first 1, last 1).
- **Halo:** a flat core with soft shoulders and mottled streaks that run along the beam, tinted slightly cool and bluish grey (`[0.9, 0.93, 1.0]`).
- **Tiling:** the build does not report a seam, and I did not check it separately. The streaks are meant to tile end to end.
- **Palette:** 139 colours, with 0.0025 lost in quantising.

I did not do the off-centre lean to the left or the wider, brighter right halo from the description. The layer has no offset, so the beam comes out centred and the halo is symmetric.

The border light is 0.123 and the dark share is 0.37. I only compared the second render with the first by eye, not against the original's figures.
