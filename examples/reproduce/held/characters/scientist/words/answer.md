I built `scientist.mdl` on Gordon's skeleton. The build says **OK**: every check passed, with only three harmless "nearly touching" notes at the arm joints. The model is in the work folder as `work:scientist.mdl`, with its spec beside it (`work:scientist.spec.json`) and a six-view sheet (`work:scientist-sheet.png`). It keeps all 77 of the base's animations, and the feet sit at the origin (`floor: 0`).

I checked the main render sheet, the close-ups of the chest and head, and the run cycle. The model has 420 triangles.

**Measured against your description**

| Measure | Original | Built | Note |
| --- | --- | --- | --- |
| Height | 68 | 70.4 | Within the 10% the build allows |
| Head | 8.5 (one eighth) | 8.5 | Matches |
| Width across the hands | 21.7 | 22.3 | Close |
| Hip line | about 32 | about 39 | Skeleton limit (see below) |
| Hands | mid-thigh, about 22 | about 37 | Skeleton limit (see below) |
| Length | 33.3 mid-stride | 22.6 standing | The run cycle is longer; the stride is in the animation |

**Where it differs, and why**
- **Hips and hands sit higher than the original.** Gordon's legs are longer, and his arms with the elbows straight already reach his hips. The skeleton can't be changed, so the arms hang to hip level, not mid-thigh. Fixing this would mean a different base skeleton, or a stance with bent knees, which would change the pose you asked for.
- **Pose I chose:** the torso leans forward by about 4 to 5 degrees, and the arms come in about 8 degrees, so the hands sit at the sides rather than out wide. That is a judgement call; say if you want it stiffer or looser.
- **Simplifications:** the coat tails are one box, the hands are fists (spheres), the hair is three small boxes, and the glasses are painted onto the head. The tie and its red stripes are painted onto the chest, and the shirt shows as a blue panel in the open front.
- **Colours** are plain cloth tones (white coat and trousers, blue shirt, navy tie with red stripes, reddish-brown shoes, black belt and glasses, pale skin, grey hair). I toned the white down to clear the build's "too white" warning, so it reads as a used white rather than a bright one.

The run cycle still looks like a loping run from the side. Its anxious, forward-leaning look is partly down to the base's own motion, so the judge may see it differently from the original.
