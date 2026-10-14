`sprites/zerogxplode.spr` is built and the build says OK. It matches most of the description, but it doesn't have the narrower top lobe you described: the cloud comes out round, not mushroom-shaped.

**What it is:** 64x64, 15 frames, played once at 15 fps. Type is parallel (always faces the camera), format is additive, origin at the centre, placed as a temporary effect with render mode 5 (Additive). The build measured it against Half-Life's own explosions and all 5 of its checks are in range, with no light at the border. It quantised to 254 colours.

**Frame by frame:**
- **Frame 0:** a small white-hot dot with an orange rim.
- **Frames 1 to 3:** it bursts into a white blob with an orange-red edge. By frame 3 it's about 40 to 45 px across.
- **Frames 4 to 7:** it grows into a lumpy cloud almost filling the frame. The white cools to cream and yellow and the edges turn golden-orange.
- **Frames 8 to 11:** a turbulent amber cloud, mottled and browner at the rim, with faint specks.
- **Frames 12 and 13:** it fades to dark brown.
- **Frame 14:** fully black.

**Where it falls short:**
- **No mushroom shape:** I tested whether a layer's position setting can move an explosion off-centre, using a throwaway sprite. It can't, so I couldn't stack a smaller, brighter lobe on top. Because of that the brightness is centred instead of brightest in the upper lobe, and there's no ragged lower-left edge.
- **Frame 14 is black, not a faint brown smudge:** I kept the default that a one-shot sprite ends dark, since the build flags a one-shot that doesn't end dark as a fault.
- **The sparks barely show:** the debris specks are faint and spread all around instead of flying to the left and lower left.

That throwaway test sprite, `sprites/attest.spr`, is still in the work folder and none of the tools here can delete it, so please remove it yourself. The finished sprite is at `work:sprites/zerogxplode.spr`, with `-sheet.png` (all frames) and `-animated.png` beside it.
