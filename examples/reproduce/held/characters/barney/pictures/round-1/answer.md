`barney.mdl` is built and the build says **OK**: every check passes, with no faults, warnings or notes. It stays together in the standing pose and through the run, walk, crouch and jump the build tests.

**Skeleton:** I used `player/gordon/gordon.mdl`, so it keeps all 77 of Gordon's animations, including the runs. I tried every other human base the game has before choosing it:

```
base          first frame                               why not
gman          arms tight to the sides, feet together    too narrow, no stride
hgrunt        walking, holding a gun                    pose is wrong
scientist     walking, arms swinging                    different skeleton, shorter
zombie        arms reaching forward                     pose is wrong
hassassin     left hand forward                         pose is wrong
gordon        left arm down, right forearm forward      chosen
```

Gordon matches Barney's arm span, hand height and stride length best. In Gordon's first frame the right forearm points forward to hold a gun. I modelled Barney's right forearm and fist hanging straight down from that elbow, so the standing pose matches the original. In player animations that forearm will stay hanging where Gordon's would hold the weapon.

**Size and shape:**

```
              original   mine
height        75.3       75.7
width         30.2       30.6
length        22.8       21.3
triangles                1,296
```

The parts are the hips, the chest under the vest, neck, head, nose, helmet, shoulders, upper arms, forearms, fists, thighs, knees, the pants with their bloused ends, the boot shafts, soles and insteps, and the holster on the right hip.

**Colours and markings:** all ten of your pictures are projected onto the body: the six sides plus the four close angles. That carries over the lavender shirt, the blue pants, the black vest with the logo and badge on the front and SECURITY on the back, the face, and the grey helmet with its blue band. The projections use outline boxes I measured by hand, because the automatic finder took in the sheet's caption labels.

**Where it still differs**, as a side-by-side judge would see:
- **Which foot is forward:** the original has its right foot forward; Gordon's skeleton has the left forward. The leg bones can't be mirrored, so the left and right side views show the stride the wrong way round. From the front three-quarter angles the stance also looks narrower than the original.
- **Boots:** the boots are plain black boxes and tubes, not projected. Because of the stride mismatch, projecting them painted pants-blue onto them. They're a bit blockier than the original's and have no laces.
- **Run:** the run is Gordon's, carrying a weapon, not Barney's own run with its arm swing in `motion.png`.

Files are in the work folder: `barney.mdl`, `barney.spec.json` and `barney-sheet.png`.
