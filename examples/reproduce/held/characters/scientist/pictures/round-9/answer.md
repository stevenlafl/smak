The scientist model builds and passes the check: `work:scientist.mdl`, with its spec at `work:scientist.spec.json`. I haven't seen it side by side with the original at the same cameras, so the match is judged from my own renders, not a comparison set.

**What it is**
- **Base:** Gordon's skeleton (`player/gordon/gordon.mdl`), with all 77 of its animations kept. `floor: 0`, so the feet stand at the origin.
- **Size:** 32.8 long, 21.5 wide, 68 high, against the original's 33.3, 21.7, 68.
- **Body:** one carved shape built from the six-sided sheet plus the four quarter views, 640 triangles. Its outline matches each picture at 0.98 or better, though the check doesn't measure that against the original.
- **Colours and markings:** painted from the pictures onto a 512 by 512 texture. That covers the white coat, blue shirt, red-striped tie, belt, brown shoes, pale skin, grey hair at the sides and back, and the black-framed glasses.
- **Stance:** the first frame of the first animation, fitted to the pictures. Only the spine and upper arms moved, by about 3 degrees.

**Known gaps**
- **Running looks broken.** The body hangs from the skeleton's bones, so the shoes stretch into flat slabs during the run. Standing is fine. Fixing it means building the feet as separate rigid parts, which I didn't do.
- **Fitted run dropped.** I first fitted the run to `motion.png`, but the check flagged that its loop didn't close (a 43 degree jerk in the right upper arm). I removed it, so the run is Gordon's own.
- **Glasses, tie and fingers aren't built as parts.** They come only from the painted texture. The hands have no fingers.
- **One warning remains.** The build notes that a strap's colour comes from a neighbouring part in the below view. It is cosmetic, and the build still says OK.

Renders from my checks are in the work folder: `fl-ours.png`, `fr-ours.png` and `bl-ours.png`.
