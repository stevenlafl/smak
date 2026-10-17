The zombie builds OK, with no faults and no warnings about the parasite. Its file is `work:zombie.mdl`, with its spec at `work:zombie.json` and the sheet at `work:zombie-sheet.png`. The previous version is kept as `work:zombie_v1.mdl` and `work:zombie_v1.json`.

**What I changed, against the person's points**

| Point | Change | Result in the build |
|---|---|---|
| Torso too upright in the side views | Pose keys lean the upper spine (`Bip01 Spine2` 8°, `Spine3` 11°) and the neck (8°) forward. The arms and legs keep their earlier aim. | The side and run views show a forward-leaning torso with the head out in front. |
| Head a smooth pink dome, parasite not its own shape | The parasite is now a separate blob part on the head, in a flat sickly olive, with a rounded hump over the upper back. | In the side and run views it reads as a distinct cap and hump, not part of the head. |
| Parasite colour | The picture's paint is now laid on the body only (`parts: ["body"]`). Before, the picture covered the parasite and made it pink. | The parasite shows its olive tone. |
| Arms and torn hem | Kept as they were. | Unchanged. |

**Other changes I had to make to pass the build**

- **Triangles.** The first revision came to 1,056, over twice the base's 362. The final one is 682, with the body at 340 (it was 500) and the parasite at 150. The body is less detailed than before.
- **Tendrils.** I tried three tendrils down the back. They read as flat dark blades, and the triangle count went over, so I removed them.
- **Lean limit.** A stronger lean (about 36° of spine) pushed the front outline down to 0.647, which is a fault. The current lean keeps the outline at 0.805, above the 0.8 warning line. So the lean is moderate, not a full hunch.

**Final checks**

- Build says OK, every check passed.
- Height 69.8 (asked for about 68).
- Front outline 0.805.
- 682 triangles, under the 724 limit (twice the base's body).
- Warning: 26 triangles still join the arms to the trunk and may tear in some motions. The arms are still fused to the body, as before.

**What is still weak**

- The parasite still shows grey bands in the renders, so it can read as a striped helmet. I did not fix that.
- The parasite cap covers the face the picture gave the head. I did not check the face closely.
- The walk and attacks are still Gordon's own animations. The run reads as a crouched lunge, not a shamble.

The person should look at it in the game beside Half-Life's own zombie to judge whether the cap and lean are enough. The licence position is unchanged from before: the shape model is non-commercial and not allowed in the EU, UK or South Korea, and this should not ship commercially without a different body.
