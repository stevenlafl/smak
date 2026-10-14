# 12 A hover car (model; a prefab of the city, case 17)

## The prompt (152 words)

> A parked hover car for the cyberpunk streets, about 110 units long. A sleek, rounded body with a pointed
> nose and a squared-off tail, painted near-black with a purple tint. A tinted glass canopy bulges from
> the top, over the middle. Instead of wheels it has four hover pods, two on each side under the body,
> each with a glowing blue ring round it, and a blue under-glow strip under the belly. Bright white
> headlights at the nose, a wide red light bar across the tail, and a magenta neon stripe along each
> side of the body. A low spoiler wing on two struts at the back. The lights glow in the dark. It sits
> just above the ground on its pods, nose to the front (+x), symmetrical left and right, and of course
> no parts floating loose.

## The rubric (written before the spec)

| # | Item | Must | Score |
| --- | --- | --- | --- |
| 1 | About 110 long, nose to +x, resting on its pods on the ground | yes | 2 |
| 2 | A sleek rounded body, pointed nose, squared tail, near-black purple paint | yes | 2 |
| 3 | A tinted glass canopy bulging from the top over the middle | yes | 2 |
| 4 | Four hover pods (two a side) with glowing blue rings; a blue under-glow strip | yes | 2 |
| 5 | White headlights at the nose, a red light bar across the tail | yes | 2 |
| 6 | A magenta neon stripe along each side | no | 2 |
| 7 | A spoiler on two struts at the back | no | 2 |
| 8 | Symmetrical; nothing floating, no holes | yes | 2 |

**Score: 16 of 16 (100%). Passes.**

## How the prompt became the spec

- The body is a `turn` along `x` whose rings are ovals (`[half width, half height]`): narrow at the nose
  (x 55), widest in the middle, a short squared end at the tail (x -52). The canopy is another such
  `turn`, its rings' centres lifted 5 (`off`), so that it bulges out of the body's top over the middle.
- Each pod is a short oval `turn` along `x` beside and under the body, `mirror: "y"` for the other side;
  a `band` round each is the glowing ring. The under-glow is a thin `box` under the belly.
- Headlights (mirrored), the tail bar, the spoiler and its struts are boxes; the glowing ones are in
  `neon` materials. The side stripes are `ridge`s along the body, at 9 and 171 degrees round it.

## Iterations

1. Clean, but the stripes were on the top and the bottom: for a part turned along `x`, angle 90 is up,
   not a side. The spec's slip; `docs/SPEC.md` now says which way an angle points for each axis.
2. On the sides (0 and 180), the stripes had open, crowded and flipped edges near x 35. Followed to the
   workshop's `ridge`: where its end begins to narrow, it put a place 0.03 from the place where it crosses
   one of the body's rings, and the sliver between them folded over where the surface bends at that ring.
   A narrowing point that falls that near an existing place now uses it (`src/workshop.mjs`); a ridge's
   quads are also turned as one, from their diagonals. The workshop's selftest areas pass as before.
3. Clean. The sheet (picture-1) shows the long rounded body, the canopy over the middle, the pods and
   their blue rings, the stripes and the spoiler; the close look (picture-2) the red tail bar, the white
   headlights, and from below the blue under-glow between the four pods.
