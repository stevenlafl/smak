Built: `work:barney.mdl`. The build says OK, and `check` says it fits GoldSrc. The spec is at `work:barney.spec.json` and the six-view sheet at `work:barney-sheet.png`.

**What I did**
- **Skeleton:** Gordon's (`player/gordon/gordon.mdl`, read from the Half-Life `valve` folder), with all 77 of his animations kept. `floor: 0`, so the feet stand at the origin.
- **Stance:** Set so the first animation's first frame has the arms hanging slightly out with the right forearm down, and the feet roughly even. Gordon's own stance has the right leg back and the right arm forward, which I corrected.
- **Build:** Shirt and trousers are smooth blobs over the limbs. The vest, helmet, boots, belt, holster and tie are separate parts hung on bones. Helmet, face and hands are turned or superquadric shapes.
- **Colours and markings:** Pale periwinkle shirt, black vest with ribbed plates, straps, orange emblem on the left chest and grey-white badge on the right, deep violet-blue trousers, violet-blue helmet band from the temples round the back, dark pads over the ears, dark brown hair at the sideburns and brows, black belt, holster and boots with lace bars.

**Choices I made that you may want changed**
- "SECURITY" is printed on the back of the vest, since the description puts it on the upper back and doesn't say shirt or vest.
- The helmet band is a painted stripe on the lower helmet, not a separate piece.

**Gaps and things to check**
- **No reference pictures.** I built from the written description only, so I could not compare against the original. Side-by-side judgement is still needed.
- **Depth doesn't match.** The description says 23 units deep. The model is 12 deep (front to back) and 32.7 wide, against the described 30. Height is 76.7 against 75. I kept the human proportions and did not force depth to 23, since that looks like a width figure. Tell me if you want it widened.
- **Triangle count is high.** The model has 1,656 triangles against the 362 of Gordon's body, so the build warns. It is within the GoldSrc limits the check applies, so it is not a fault.
- **Head close-up unavailable.** The tool's focus picture showed the trousers, not the head, so I could only judge the face from the small sheet picture. The helmet and face read correctly there, but the fine detail is unchecked.
- **Not tested in game.** I could not run the model in Half-Life; the checks and pictures are all the verification done.
