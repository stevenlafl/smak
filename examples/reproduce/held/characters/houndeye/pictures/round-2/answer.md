I built `houndeye.mdl`, and the last build says **OK**: every check passed, including parts staying attached through Gordon's run, walk, crouch and jump.

**Size against the original:**

```
            original   built
length      49.3       49.6
width       33.5       33.9
height      44.7       44.7
```

**Skeleton:** It sits on Gordon (`player/gordon/gordon.mdl`) and keeps all 42 bones and 77 animations. `"floor": 0` lifts every animation 36 units so the feet stand at the origin.

**Parts, all hung on Gordon's bones:**
- **Body:** a tall oval that tapers to the rear. It's wide at the head end (24 across), rises to a rounded back and ends in a haunch at the back.
- **Eye:** a domed front face where the compound eye is painted.
- **Back plates:** five of them. Each rises gently from behind to a sharp front edge and gets smaller toward the rear. The peaks are at 44.7, 43.6, 41.6, 38 and 33.5 units, as in the side views.
- **Front legs:** a big shoulder muscle, a thigh, a shin that tapers, and a flared foot. They're on Gordon's left and right leg bones, posed outward and forward so the feet land where the original's do (about 9 units forward, 12.5 out to each side).
- **Rear leg:** one leg slightly left of centre (y +2), as the original's is, below the haunch.

**Colours and markings:** These come from all seven reference views projected onto the shape (the six sides plus the four angled shots), on a 512×512 texture. That covers the yellow-olive skin, the blue, brown and cream stripes on the plates, the white belly with its blue veins, the mouth on the underside, the dark eye with its pink rim, and the white feet. In the first frame it matches the originals closely from every camera.

**What to know before it's judged:**
- **Rear leg doesn't animate.** Gordon has only two legs that reach the floor, and they carry the front legs. The rear leg is fixed to the pelvis, so it stays still in every animation.
- **It moves like Gordon.** Keeping Gordon's animations means a two-legged run on a three-legged body. The parts stay attached, but the motion won't look like the original's gallop in `motion.png`.
- **Plates are a bit simpler.** The original's plates are slightly sharper at the top centre. Mine are rounded rings, so from straight ahead the top of the head reads a little rounder.
- **Triangle count is high.** It's 1,214 triangles, more than three times Gordon's 362 for his own body. The build gives this as a warning, not a fault. If the judging counts triangles, I can cut it to under 800 by giving the round parts fewer sides.

The files are in the work folder: `houndeye.mdl` and `houndeye.spec.json`, the spec to rebuild it from.
