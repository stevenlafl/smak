The sprite builds OK: `work:sprites/zerogxplode.spr`, with a contact sheet and an animated preview beside it. The build reports 64x64, 15 frames, additive, placed as a tempent (render mode 5, framerate 15), with 254 colours.

**What I made**
- **Type and format:** parallel, additive (black is clear), played once (`loop: false`), not looping. The last frame ends dark.
- **Frame 0:** a small white point about 8 to 11 px, a little left of centre, with a thin orange rim.
- **Frames 1 to 3:** a white-hot lumpy blob with an orange edge, growing and sitting upper-centre.
- **Frames 4 to 7:** the blob fills most of the frame, with a lobed top and a wider lower mass, like a rising mushroom.
- **Frames 8 to 11:** a billowing cloud with a pale yellow top lobe and amber-to-brown lower parts. Its lower-left edge is ragged.
- **Frames 12 to 14:** it dims into dark brown and then black, bottom first.
- **Specks:** a few short debris and spark flecks, mostly drifting down and out.

**Choices I made**
- The original's description was the only input. There was no reference picture, so the build could not measure my sprite against the original. Its shape, colour and timing are matched by eye to your description, not measured.
- I used the `blast` colour ramp (white, cream, tan, brown), which fits the white-to-brown progression.
- I set the fps to 15 (the framerate the build reported). The original's timing is not given, so that is a guess.

**Known gaps**
- Frame 14 is close to black. The original keeps a faint brown smudge near the top, and mine does not, so that is the most visible difference. I did not chase it further because the build passed and the frame is already nearly dark.
- Frames 8 to 9 keep a brighter white-yellow core low in the frame, where the original's bottom is more amber. I toned it down twice, and it is close but not exact.
