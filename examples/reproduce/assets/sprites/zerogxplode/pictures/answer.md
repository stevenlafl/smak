I've built `sprites/zerogxplode.spr` (it's in the work folder, with a `-sheet.png` frame sheet and an `-animated.png` beside it), and the build says OK. It's 64x64, 15 frames, parallel, additive, placed as a temporary entity with render mode 5 (Additive). All 5 of SMAK's measures are within Half-Life's range for explosions: colours, border light, how it starts and ends, and flicker. The border stays dark and it ends on a black frame.

Compared side by side with your original frames, the overall arc matches: a small flash grows into a hot white fireball of about 50–60 px, cools through orange to brown, and is gone by frame 14. Specks of debris fly outward. These differences are still visible:

- **Shape:** the original is a lumpy, lopsided cloud with a lobe at the upper right. Mine is a roughly round ball with ragged edges. The explosion layer has no setting to push it off-centre. I tried offset glow blobs, but they showed up as hard white discs, so I took them out.
- **Colour:** the original's edges and late frames are cream and yellow-brown. Mine have redder orange edges, and the core turns pale grey in frames 9–11.
- **Timing:** the original is fully white by frames 2–3 and starts cooling around frame 6. Mine brightens more slowly and peaks around frames 6–8. Setting the attack near zero didn't move the peak, so the layer seems to fix its own timing.
- **Frame 0:** the original has a small bright dot there. Mine is empty.
- **Debris:** my specks are fainter and fewer than the original's grey-white flecks.

The final spec is one explosion layer (growth 0.8, cool 0.4, turbulence 1.6, gain 1.8) plus a sparks layer (30 sparks, no gravity).
