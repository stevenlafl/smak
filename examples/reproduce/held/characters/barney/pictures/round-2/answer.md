The build passes: **`work:barney.mdl`**, with every check OK. The spec it was built from is `work:barney.spec.json`.

**How it's built.** It sits on Half-Life's `player/gordon/gordon.mdl` skeleton and keeps all 77 of its animations. The spec has `"floor": 0`, so every animation is raised 36 units and the feet stand at the origin. All four checked animations stay closed with no gaps between parts: standing, running, walking and jumping.

**Size compared with the original:**

```
           built   original
height     75.3    75.3
width      30.1    30.2
length     24.1    22.8   (about 6% long: the rear boot sits a bit far back)
```

**Parts:**
- A grey helmet dome with a blue band round the back and sides.
- Head, nose and neck.
- The black vest on the torso, with the shirt at the shoulders.
- Hips and baggy pants.
- Shoulders, upper arms, forearms and fists.
- Thighs and shins, the shins ending in boot shafts.
- Chunky black boots, and the holster on the right hip.

**Colours and markings.** All ten of your pictures (the six sides and the four close angles) are projected onto the shape. That carries over the face, the orange logo and the badge on the front of the vest, the "SECURITY" lettering on the back, the vest's panels, the black belt line and the creases in the pants. Base materials matching the pictures' colours fill anything no picture sees.

**Stance.** It stands the way the original's first frame does:
- The right foot is forward and the left back, which is the opposite of Gordon's stance, so I swung both hips and leveled the feet.
- The right leg is splayed out slightly.
- Gordon's right forearm points forward holding a gun; here it hangs at the side like the left.
- The arms are angled a little out from the body.

I started from the tool's automatic fit to your outlines, then set the angles by hand.

**Where it still falls short:**
- **Size warning:** it has 1,340 triangles, against 362 in Gordon's own body. That's a warning, not a fault, and the build still passes.
- **Face:** the face is a projection on a simple rounded block, so up close it reads softer than the original's sculpted face.
- **Close-up views didn't work:** the build's close-up option pointed at the wrong spot on this character, so I couldn't zoom on the head. I compared it in the full-size six-side renders instead.
