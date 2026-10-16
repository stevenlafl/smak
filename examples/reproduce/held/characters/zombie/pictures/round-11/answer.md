The zombie is **not OK** yet. The current `zombie.mdl` in the work folder fails one check, and it has visible flaws the check does not catch.

**What the last build says**

| Check | Result |
| --- | --- |
| Triangles | 704 of a 724 limit (two times Gordon's 362-triangle body) |
| Outline, yaw -35 pitch 20 | **FAULT**, 0.679 (needs 0.7) |
| Outline, front / top / below / yaw 35 / yaw 145 / yaw 215 | WARN, 0.707 to 0.771 (needs 0.8) |
| Carve lost thin pieces | WARN, 12 pieces (the claws and thin arms) |

**What I tried**

- Carving from all six sheet views, and from the four angled pictures as well. Adding the angled pictures or dropping the top and below views lost the width (48 to 45 units against 53.8), and the front outline fell to 0.58 to 0.60.
- Finger length 9, 10, 12 and 14, the spread and curl, and cell counts from 160 to 256. Each change moved the outline in a different view, so the faults kept trading places.
- Pose fitting, no pose, and hand-set spine and arm keys. The keys I set moved the hands the wrong way.

**Base**

- The kit refuses `zombie.mdl` as a base ("a blind test's original"), so the original zombie's skeleton is out.
- I used `player/gordon/gordon.mdl`, because it keeps all 77 animations in one file.
- The scientist (`scientist.mdl`) is the closer build, but its 87 extra animations sit in separate files, and the kit cannot carry those over.

**Visible problems the check does not catch**

- The original has long, thin claws reaching forward. Mine are short and stubby, and the right hand sits higher than the left.
- Thin carve fragments float near the arms and claws. Removing loose pieces needs the `pieces` command, which I cannot run here (no shell).
- The torso is boxy in places, and the lean is less than in the original.

**Decision for you**

To reach OK I need one of these:
1. Allow the scientist base and accept that its 87 animations are not kept in the file. This also makes the triangle budget much bigger, which would let the carve be finer.
2. Accept the one outline fault for now. The model is then fine to look at, but it will not pass the check.
3. Let me keep iterating on the arm and claw placement, which is slow and may not converge.

Files:
- `work:zombie.mdl`: the current build, NOT OK.
- `work:zombie.spec.json`: its spec.
- `work:zombie_probe.mdl`: a scratch build from the scientist test. Delete it when convenient; I have no tool to delete files.
