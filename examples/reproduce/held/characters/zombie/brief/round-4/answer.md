The zombie is built and the build says **OK**: `work:zombie.mdl`, with its spec at `work:zombie.json`. It is 68 tall, stands on its feet at its origin (`floor: 0`), and uses 692 triangles. Half-Life's own creatures and people of this size have a median of 740.

**How I made it**

1. **Pictures.** I drew four views of the character with the picture model (Z-Image-Turbo), held to Gordon's stance. The prompt was a zombified bald scientist, torn bloodied lab coat, a parasite over its head, long clawed hands, hunched. I picked the take with the torn, bloodied hem and the clawed hands.
2. **Body.** The shape model (Hunyuan3D-mini) turned that picture into a 3D body. I reduced it to 500 triangles and fitted it to 21 × 46 × 68. Its paint is projected from the picture's cut-out, so the coat, the hem blood and the head come from the picture.
3. **Skeleton.** The body is laid on Gordon's skeleton (`player/gordon/gordon.mdl`), with its arms out and legs apart as in the picture (`pose.aim`, `bind: true`). That keeps Gordon's animations.
4. **Claws.** Each hand has four 10-unit curled claws in a dark bone-coloured material.

**What I checked**

- The build passed every check. There are no faults.
- The front, side, back, top and three-quarter views of the sheet show a coat-wearing figure with claws and a dome-shaped head.
- The run frames read as a hunched, crouched lunge, not as a walk.

**Where it falls short**

- **Walk and attacks.** The animations are Gordon's own, so there is no shambling walk and no slashing attack. The run looks like a crouched sprint. A proper shamble would need animations fitted to new motion, or a separate walk.
- **Parasite.** The head reads as a pink-red dome, not clearly a parasite body. The white coat is mostly clean; the blood is only at the hem.
- **Warning.** 35 triangles join arms to the trunk and will tear in some motions. This comes from the generated body, and fixing it means building the arms as separate parts.
- **Game comparison.** Half-Life's own zombie (rendered beside this one) is grislier, with exposed flesh and bright blood, and its arms reach out with long claws. Ours is cleaner and whiter, with shorter-looking arms. My judgment: comparable in shape and clearly not worse in silhouette, but **not better** on gore, the parasite or motion. The person should decide on that by looking in the game.

**Licences.** The shape model's licence is non-commercial and not allowed in the EU, UK or South Korea. The picture and sound generators are not commercial. You said the person accepts these for this test, so I did not stop; this model should not ship commercially without a different body.

**Next steps if the person wants a stronger one:** a picture with more blood and an exposed parasite body, a fitted shamble walk, and arms built as their own parts to remove the tearing warning. I can do those next.
