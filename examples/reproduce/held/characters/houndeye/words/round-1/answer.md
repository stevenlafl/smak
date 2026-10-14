I built `houndeye.mdl` and the build says **OK**: every check passed, including the run, walk, crouch and jump poses. It's on Gordon's skeleton (`player/gordon/gordon.mdl`), so it keeps all 77 of Gordon's animations, and it stands in the pose of frame 0 of Gordon's first animation. The files are `work:houndeye.mdl`, `work:houndeye.spec.json` and `work:houndeye-sheet.png`.

**How it compares to the description**

```
Measure   Asked   Built
Length    49      51
Width     34      35.2
Height    45      46
```

All three are within the 10% the build allows. The sizes include the eye spheres sticking out the front, the splayed toes and the spines on the back.

- **Body:** one rounded lump with no neck or head, leaning about 8 degrees forward so the eye tilts down. The back is highest at the shoulders. Seen from above it's a teardrop, broad at the front and narrowing to a blunt point at the rear. The body fills the top two-thirds of the height and the legs the bottom third (about 15 units).
- **Eye:** an oval dark socket with a thin pinkish-red rim, holding 14 glossy dark-maroon spheres in rows of 3, 4, 4 and 3. Each sphere has a white highlight.
- **Mouth:** a dark-red oval on the underside just behind the eye, with pale ridges across it.
- **Skin:** mottled olive-mustard leather with thin brown wrinkle lines and cyan veins. The belly and lower sides go to pale cream with faint blue-green veins, and there's a small dark spot on each side.
- **Back:** seven low spines leaning backward, from just behind the eye to the rump. Across them run bands of turquoise, chocolate brown, gold and cream, angled into chevrons pointing forward down the upper sides.
- **Legs:** two front legs and one rear leg under the tail point. Each has a bulging wrinkled thigh, a shin bending backward like a hind leg, pale knobbly knee and hock joints, and three pale cream toes splayed out.

**Where it falls short of the original**

- **Movement:** this is the biggest gap. The skeleton is Gordon's, so it moves with his two-legged animations. The two front legs swing with his legs. The rear leg is fixed to his pelvis, so it never kicks back the way the description says. The bounding gallop with the rear leg straight out behind can't be done without the houndeye's own skeleton and animations.
- **Spines:** they're small four-sided pyramids, not flat triangular plates.
- **Triangle count:** it's 2,072 triangles. That's over the 500 to 1,000 typical of a large Half-Life monster, but the build didn't flag it. The 14 eye spheres (48 each) and the eye rim (204) account for most of the excess.
