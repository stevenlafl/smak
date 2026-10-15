I built `sprites/zerogxplode.spr` and the build says OK: every check passed and it's within range on all 5 of the tool's measures against Half-Life's own explosion. There was no picture of the original to compare against, so I matched your description by eye. The tool's side-by-side shape and colour scores need a reference picture, so none were run.

**Facts:** 64x64, 15 frames, played once at 15 frames a second, type parallel, format additive. It's set up as a temporary effect drawn additively (render mode 5). The border stays dark and the last frame is black.

**Where it matches your description:**
- **Frame 0:** a small hot point a little left of centre, about 8 pixels across, with an orange rim.
- **Frames 1 to 4:** it bursts into a lumpy pure-white blob with a dark-orange edge, and grows quickly.
- **Frames 5 to 8:** the white cools to cream and pale yellow, then golden-orange with darker billows. By frame 8 it nearly fills the frame.
- **Frames 9 to 13:** it darkens to amber and brown with mottled holes and a ragged lower edge, then fades into the black.

**Where it falls short:**
- **Frame 0:** the point reads orange rather than white-hot. When I made it brighter, it showed through the cloud in later frames, so I went back to the dimmer version.
- **Frames 9 and 10:** a very faint leftover of that point is still visible inside the cloud.
- **Shape:** the cloud is lumpy but doesn't have the clear mushroom outline, with a narrow top lobe over a wider bottom. The top lobe also doesn't stay the brightest part.
- **Specks:** the flying sparks and debris specks are barely visible.
- **Frame 14:** fully black, so there's no faint brown smudge left near the top. It fades more evenly, not bottom first.

If you have a contact sheet of the real `zerogxplode.spr`, I can add it as a reference. Then the build would score shape and colour frame by frame against the original, and I could fix these properly.

The sprite is at `work:sprites/zerogxplode.spr`, with the `-sheet.png` and `-animated.png` previews next to it.
