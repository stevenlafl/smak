The model builds OK and passes the GoldSrc check ("fit for goldsrc", 948 triangles, 1 texture, 21 animations). It is `work:houndeye.mdl`, made from `work:houndeye.spec.json`. The front and side pictures are in `work:houndeye-sheet.png` and `work:houndeye_front.png`. I don't have the original to compare against, so I judged it from the description only.

**Choices I made**

- **Skeleton: `headcrab.mdl`, not Gordon.** Gordon is an upright human and the Houndeye has no matching game skeleton. The headcrab's low, squat, hopping build is closer. The game's files were found at `~/.steam/steam/steamapps/common/Half-Life/valve`. The headcrab's front limb bones (`Bone01` to `Bone08`) are where I put the front legs.
- **Size and floor:** 50 long, 34 wide, 46 high, with `floor: 0`. The body runs from z 16 to 42, the legs from 0 to 16, and the spines go up to about 45.
- **Body:** one turned lump with a teardrop plan, broad at the front and blunt at the rear. It is olive-mustard leather, with cream on the belly and turquoise, brown, golden and cream chevron stripes across the back.
- **Eye:** 12 near-black maroon spheres in a 4 by 3 grid, inside a pink-red ring on the front.
- **Spines:** six, running from behind the eye to the rump, leaning backward.
- **Mouth:** a dark maroon oval under the body behind the eye.
- **Legs:** two front legs splayed out, one rear leg under the tail point, each with small toes.
- **Animations:** all 21 of the headcrab's are kept, as the rules require.

**Known gaps, not fixed**

- **Legs don't step.** I hung them on the spine bone so they can't come apart in a run or jump. The walk and run therefore show the body and legs moving together rigidly, not a bounding gait with the legs swinging.
- **Spines are three-sided pyramids**, not flat triangular plates. The tool has no flat-triangle primitive that fit.
- **Stance is level.** The original hunches forward with the eye tilted down, and I did not add that.
- **Mouth has no pale ridges**, and there are no flank veins or wrinkle lines.
- **Triangle budget:** the spec's count is 948, under the 956 that twice the base body allows. The eye spheres and the body's sides are the parts that had to be kept low to fit.
- **Headcrab events remain:** the "headcrabbed" animations and their sound events come with the skeleton. A mod that relies on them will treat this as a headcrab.
