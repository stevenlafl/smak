The hover car is built and passes every check (no holes, nothing floating loose). It's saved as **`work:hovercar.mdl`**, with its spec at `work:hovercar.spec.json` and the six-side picture at `work:hovercar-sheet.png`.

It measures 111.4 long, 44.8 wide and 29.7 high, so it's within 2% of the 110 you asked for.

How I made each thing you asked for:

```
Request                 Made as
----------------------  -----------------------------------------------------------------
Body                    A smooth rounded shape lying along x, a flattened oval in cross
                        section. It narrows to a point at the nose (+x) and ends in a
                        flat tail with a hard edge. Near-black paint with a purple tint.
Canopy                  A tinted purple glass bubble over the middle, rising about 5.5
                        units above the roof line.
Hover pods              Four rounded pods, two on each side under the body, at the front
                        and the rear. Dark metal.
Blue rings              A glowing blue band round the middle of each pod.
Under-glow              A glowing blue strip, 60 long, under the belly.
Headlights              Two bright white glowing lamps either side of the nose.
Tail light              A glowing red bar, 30 wide, across the flat tail.
Magenta stripes         A glowing magenta stripe along each side, from tail to near the
                        nose.
Spoiler                 A low wing on two struts above the tail, in the body paint.
Glows in the dark       Every light uses the neon material, which glows in the dark.
Symmetry                Pods, struts and headlights are mirrored copies; the stripes sit
                        at matching angles on each side.
```

Two notes:
- **Ground contact:** the pods are the lowest part and rest on the ground (z 0). The body's underside is about 5 units up, so the car sits up on its pods with a gap under the belly. If you want the pods floating clear of the ground, that would fail the "floating loose" check unless I allowed it on purpose.
- **Headlights:** my first headlights were studs set into the nose, but one of them kept coming out with a small hole. I switched to glowing white spheres set into the nose, which build cleanly.

Nothing you asked for was left out.
