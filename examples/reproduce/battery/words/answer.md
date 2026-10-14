I built `battery.mdl` in the work folder. The build passed every check and the engine check says it fits GoldSrc. It's 10.5 × 10.5 × 18.4 units, 556 triangles on one bone, with two textures, one of them the glowing parts.

**What matches the description, checked in the six views and the close-ups:**
- **Body:** an octagonal column with long faces and short diagonal corners, in grimy grey-beige metal with brown rust streaks and darker grime toward the bottom.
- **Skirt:** a dark charcoal skirt 1.8 units tall that tapers inward to the floor. Underneath, the bottom is open and hollow, with a dark rim.
- **Top:** a light grey bevel slopes inward to a recessed pale deck, and the bevel's top edge forms the raised frame round the deck.
- **On each long face:**
  - a teal-green glowing window framed in light grey metal, darker at the edges and nearly white in the middle, about half the face wide and 6 units tall
  - an orange-red lamp with a yellow centre and a white surround, just under the rim
  - a hazard band just above the skirt
- **Corners:** each diagonal corner has an off-white panel with a dark outline, level with the upper part of the windows.
- **Top fittings:** a grey hex cap with notched sides and a dark round socket sits on the right of the deck in the front view. On the left, a grey hinged base holds a gold tab with grey stripes, tilted 45° outward. The back view shows them mirrored, and from either side the tab is seen end-on above the cap.

**Where it differs from the description:**
- **Hazard stripes:** they're yellow and black, not yellow and grey. The kit's hazard material only makes stripes of one colour and black, and I couldn't find a way to set the second colour.
- **Window texture:** the glow is in layers from dark to bright, but the mottled, crystalline look barely shows at this size.
- **Size:** it's 10.5 wide rather than 10.3, because the lamps and windows stand about 0.1 unit off each face. That's within the size check's limits.
- **Triangle count:** the build warns that 556 is high for a prop this small. Half-Life's own props of this size are about 51 at the median. That's because I built the tapered skirt and the sloped bevel as separate tilted plates. It's still within the engine's limits.

The spec is saved as `battery.spec.json` next to the model, so you can rebuild or change it.
