I built `filecabinet.mdl` and the build says OK, with every check passed. It's in the server's work folder (`work:filecabinet.mdl`), and the spec is next to it as `work:filecabinet.spec.json`.

**What it is:** one box, 28.8 long × 22.6 wide × 62.4 high, standing on the floor. That's 12 triangles. Every view of the original shows a plain box outline, so the drawers, pulls, base plinth and side seams are all painted on, not modelled. Half-Life's own filing cabinet is built the same way, and the outlines match from all six sides.

**Surfaces:** the six straight views from `sides.png` are projected onto the box as its texture. The three drawers with their frames and pulls, the plinth line at the bottom, the darker blotches on the sides and back, and the step in the left side's pattern all come straight from the original. I turned off the kit's painted finish (wear, grime, light) because it put light patches on the edges that the original doesn't have.

**What I tried and dropped:** I also projected the four angled pictures. They smeared the side faces into vertical noise, so the final build uses only the six straight views.

**Where it still differs:**
- **Blotchier texture:** the grey mottling is harder-edged and higher in contrast than the original's soft mottling. Lowering the texture from 512 to 256 dots didn't change it, and I found no setting in the kit to soften it. From the cameras the judge uses, this is the most visible difference.
- **Wasted texture space:** the 512×256 texture leaves about half its width unused.
