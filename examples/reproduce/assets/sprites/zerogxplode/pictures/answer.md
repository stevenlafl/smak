The sprite builds to OK, but it does not yet meet the guide's bar. The shape overlap with the original is 0.44 against a bar of 0.8, so the warning is still open.

**What the original is:** a 64x64 explosion, 15 frames, drawn parallel to the camera and blended additively, so black is clear. Frame 0 is a small bright core with flecks of debris. Frames 2 to 7 are a white-hot cloud that cools to tan, with a lobed top. Frames 8 to 14 are a brown smoke cloud that fades to nothing.

**What I built** (`work:sprites/zerogxplode.spr`, with the sheet and animated preview beside it):
- **Class and use:** `explosion` held against Half-Life's own explosion, placed as a temporary entity, which renders additive at 15 frames a second.
- **Colour:** the `blast` ramp (white, cream, tan, brown), with a dark tint that fades over the last part of the life.
- **Layers:** an unlit explosion ball that fades, a 24-sphere lit cloud that rises slightly and dissolves, and 14 small sparks.
- **Frames:** the fade-in starts at zero so frame 0 is lit, and the cloud fades out by frame 14.

**Measured against the original:**
- Mean colour difference: 4.3 (15 or under is near).
- Dark share: 0.69 against the original's 0.72.
- Border light: 0.029 against 0.818 for the original's brightest border pixel, which is what the guide means by light at the edge; the sprite has no light at the edge.
- All five Half-Life explosion checks are in range.
- Shape overlap by frame: 0.44 on average. The early frames are the weakest (0.22 at frame 0, 0.52 at frame 1). Frames 2 to 9 sit between 0.6 and 0.65, and the late frames fall away.

**Tried and reverted:** shifting the cloud left and enlarging it dropped overlap to 0.37 and dark share to 0.59, so I put back the previous version.

**Not done:**
- The shape overlap is still short of 0.8. The original's late clouds are larger and reach the left edge, and the cloud's lobed top does not match the original's. Closing that gap needs more shape work than the layer settings I tried.
- I could not save the spec as a file or copy the sprite into `examples/reproduce/assets/sprites/zerogxplode/` because I have no file-writing tool here. The spec I built with is in this conversation: the layers above, `reference` as `{ picture: "pictures/frames.png", cell: 128, cols: 8 }`, and the rest as stated at the top of this message.
