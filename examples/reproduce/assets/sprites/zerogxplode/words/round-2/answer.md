I built `sprites/zerogxplode.spr` and the build says OK. All checks passed, and it scores 5 of 5 in range against Half-Life's own explosion.

**Facts:** 64x64, 15 frames, played once at 15 fps, type parallel, format additive (placed as a temporary effect with render mode 5, additive). The border stays dark and the last frame ends black.

**How it plays, frame by frame:**
- **Frame 0:** a small white-hot blob a little left of centre.
- **Frames 1 to 3:** it bursts into a lumpy white blob with a dark tan edge, sitting upper-centre.
- **Frames 4 to 7:** two billow layers grow into the mushroom shape: a narrower bright lobe on top and a wider mass below. The white cools to cream and pale yellow, and the lower parts go golden-orange.
- **Frames 8 to 11:** a full billowing cloud, nearly filling the frame. The top lobe stays the brightest and the bottom darkens to amber and brown, with dissolving puffs and debris specks low on the left and right.
- **Frames 12 to 14:** the bottom breaks up first and the upper lobe fades last.

**Where it falls short of the description:**
- **Frame 0** is about 12 to 14 pixels wide, not the 8 described. It has no separate orange rim or specks around it. I tried adding a separate glow for the opening flash, but its brightness didn't change over time, so it stayed on through every frame. I dropped it.
- **Frame 14** is fully black, not a faint brown smudge. The last visible bit of the upper lobe is in frame 13. The kit treats a one-shot that doesn't end dark as a fault, so I didn't push past that.
- **The debris specks** are faint and land low on both sides, not mainly to the left and lower left. The early sparks don't stand out much.
- **Measurements:** I had no picture of the original, so the build couldn't compare it directly. The match comes from the written description and Half-Life's own explosion.

The sprite is at `work:sprites/zerogxplode.spr`, with a contact sheet and an animated preview saved next to it.
