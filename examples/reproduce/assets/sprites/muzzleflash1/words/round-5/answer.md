The sprite is built and the build says OK: `work:sprites/muzzleflash1.spr`, 64x64, 2 frames, additive, type parallel, placed as a `tempent` at render mode 5 (Additive), 20 fps.

The build's facts line also reports the border light is 0 and the frame count is 2, with the envelope the same at both ends. Its colour report reads "1 of 1 in range" against Half-Life's flare. I did not have the original to measure against, so the match to the original is by description, not by measurement.

What it is now:
- **Core:** a near-white centre about 12 pixels across, with a cream-to-gold falloff (muzzle ramp).
- **Rays:** five thin, tapering rays at 90° (straight up), 20° and 160° (a little above horizontal, left and right), and 240° and 300° (down, at about 7 and 5 o'clock). They run 0.82 to 0.9 of the half-frame, about 26 to 29 pixels.
- **Edges:** soft, with no haze and no light reaching the border.

Two things differ from the brief:
- **Frame variation.** The two frames are almost identical. The spec has no way to set different ray lengths per frame, so the shimmer the brief describes is not there. Changing it would need a per-frame option the kit does not offer.
- **Colour of the rays.** I did not measure the rays' colour against the brief's amber-to-brown tips. The ramp is the kit's muzzle ramp, not a hand-tuned gradient.

Also, `sprites/test_rays.spr` is a scratch file from my tests. I have no delete tool, so it is still in the work folder and can be removed by hand.
