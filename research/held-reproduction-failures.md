# Weapons and characters, round 1: what the kit lacks, and what to build

Written 2026-10-14 against commit 5ae082a and the held test's round 1 (`examples/reproduce/held/`). Every
number here was measured for this report unless a source is named. The scripts are in
`~/stignored/smak-held-failures/` (they read the game's files in place and the round-1 builds; nothing of
Valve's was copied anywhere).

Abbreviations: IoU (intersection over union: the overlap of two outlines, 1 is identical), PCA (principal
component analysis: a shape's main axes), ICP (iterative closest point: lining up two point sets by repeated
nearest matches), QEM (quadric error metric, Garland and Heckbert's mesh reducer), CMA-ES (covariance matrix
adaptation evolution strategy, a derivative-free optimiser), delta E (CIE76 colour difference, as the
rubric's M4). Items M1 to M8, W1 and C1 are the rubric's (`examples/reproduce/rubric.md`).

## The short version

No leg passed, and the reasons split cleanly between what the agents did and what the kit could not do. Five
findings change the order of work:

1. **The first-person weapon is drawn 1.8 to 4.8 times too large, and the kit causes it.** Valve's `v_`
   weapon meshes are 0.29 to 0.97 of the world model's length (median 0.56, 13 weapons). In the blind test the
   old weapon is hidden, and the build then keeps the piece "at its own size", which is the world size. Built
   outside the test, the same crowbar spec is scaled 0.59. Placing the reproduction by registering Valve's own
   `w_` weapon onto its `v_` weapon (a transform, not a shape) lifts the weapon's first-person outline overlap
   from 0.03-0.41 to 0.60-0.76 on all six legs, with the on-screen size within 0.8 to 1.2 of the original's.
2. **A character built on a player skeleton stands 36 units below the floor.** Gordon's player model has its
   origin at the middle of its hull (feet at z -36); Half-Life's monsters stand on z 0. All six Gordon-based
   reproductions have feet at -36. The judge saw it in three of the eight run strips; in the game the monster
   would be sunk to the hips.
3. **The first frame's pose cannot be set, and it costs M1 and M2.** The rubric judges the first frame of the
   first animation. The base's own (Gordon holding a gun forward) is what the reproduction stands in, while the
   scientist's is mid-stride. Fitting that one frame's joint turns to the original's outlines (outlines only,
   no texels) took the scientist's worst outline from 0.35 to 0.62 and its size from 31% off to within 8%, and
   Barney's worst from 0.62 to 0.78.
4. **Triangle budgets are enforced for props only.** M8 failed on 7 of 14 legs, including every characters
   words leg (1.9 to 6.7 times the original). The build said nothing: the houndeye agent noted "the build didn't
   flag it".
5. **The pictures leg's texture is Valve's texture.** The input pictures carry 1.6 to 3.5 times Valve's own
   texel density on the characters (5 times on the pistol). Projecting them onto the shape, which five of seven
   pictures legs did, returns Valve's texels. By the line `asset-reproduction-failures.md` section 7 drew for
   sprites and textures, that is copying. It is why the pictures legs' M4 passed and the words legs' did not.
   Steven's decision; the measures that are legitimate are listed in section 6.

Ranked by expected gain for the least work:

| Rank | Build | Items it moves | Legs affected | Work | Evidence |
| --- | --- | --- | --- | --- | --- |
| 1 | Place a weapon in `v_` (and `p_`) by the old pair's registration, not by the new piece's own axes at its own size | W1, M6, M3 | 6 of 6 weapon legs | Small to medium (about 150 lines: trimmed ICP with a similarity solve) | Table 4 |
| 2 | Lift a character's root to the floor its kind stands on (`floor: 0` for a monster on a player base) | C1, the game | 6 of 8 character legs | Tiny | Table 6 |
| 3 | A triangle budget for every kind (a character: its base's count unless told; a weapon: per file, `w_` from Valve's table), and fewer sides for the `p_` and `w_` files | M8 | 7 of 14 | Small | Table 3 |
| 4 | Fix the bugs found: the projection's caption finder (off by two dots), `attach.at: "start"` on a bone, `turn: "as drawn"` that does not keep the drawn axes | M4, M7, agent time | 4 legs reported them | Tiny each | Section 7 |
| 5 | Texture layout: pack by height, a per-part weight (faces at 2.5 times), the sheet's size from the body's area | M5, M6 | 8 character legs | Small | Table 8 |
| 6 | Set a character's first-frame pose in the spec (`pose`: turns, as a weapon's animation keys are given), and fit it to the pictures' outlines | M1, M2 | 6 of 8 | Medium | Table 7 |
| 7 | Per-view parts and materials for a weapon: a part only in `p_`/`w_` (a stock behind the camera), chrome in `v_` | M3, M5, M6 | 6 of 6 | Small to medium | Table 5 |
| 8 | Organic primitives: a `superquadric` part (boot, fist, helmet dome, torso block), then a skin over a chain of joints (one closed mesh round limbs, B-Mesh style) | M3, M1, C1 | 8 of 8 character legs named boxy boots, hands or limbs | Medium | Section 4 |
| 9 | Motion: a monster's activities checked against its base, and a run or walk refitted from the motion pictures (the pose fit of rank 6 per frame) | C1 | 8 of 8 | Large | Section 3 |
| 10 | Carved hull for a character (the prior report's `views` part) after the pose fit, its corners hung on the nearest bone | M1, M3 | pictures legs | Medium, after QEM | Section 4 |
| 11 | A creature's own skeleton and gait from a spec (three legs) | C1, M1 | houndeye | Large | Section 5 |

## 1. What failed, tallied

### Table 1: every leg's scores (0, 1, 2; `*` where a measurement capped the judge)

| Leg | M1 | M2 | M3 | M4 | M5 | M6 | M7 | M8 | W1/C1 | Total | Worst outline | delta E | Triangles (orig / repro) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| barney pictures | 1 | 2 | 1 | 2 | 1 | 1 | 2 | 2 | 1 | 13/18 | 0.617 | 8.5 | 785 / 1296 |
| barney words | 0* | 2 | 1 | 1 | 1 | 1 | 2 | 1 | 1 | 10/18 | 0.548 | 16.5 | 785 / 1892 |
| houndeye pictures | 1 | 2 | 1 | 2 | 1 | 1 | 2 | 0 | 1 | 11/18 | 0.792 | 13.0 | 308 / 1380 |
| houndeye words | 1 | 2 | 1 | 0* | 1 | 1 | 2 | 0 | 1 | 9/18 | 0.713 | 29.6 | 308 / 2072 |
| scientist pictures | 0 | 0 | 1 | 1 | 1 | 1 | 2 | 2 | 1 | 9/18 | 0.347 | 17.4 | 740 / 1096 |
| scientist words | 0* | 0* | 1 | 1 | 1 | 1 | 2 | 1 | 1 | 8/18 | 0.360 | 17.5 | 740 / 2036 |
| zombie pictures | 0* | 2 | 1 | 2 | 1 | 1 | 2 | 2 | 1 | 12/18 | 0.517 | 9.2 | 844 / 1124 |
| zombie words | 0 | 2 | 1 | 0 | 1 | 0 | 2 | 0 | 1 | 7/18 | 0.139 | 27.3 | 844 / 2012 |
| 9mmhandgun pictures | 1 | 1 | 1 | 2 | 1 | 1 | 1 | 2 | 1 | 11/18 | 0.783 | 7.3 | 88 / 64 |
| 9mmhandgun words | 1 | 1 | 1 | 1 | 0 | 0 | 2 | 2 | 1 | 9/18 | 0.668 | 11.8 | 88 / 128 |
| crowbar pictures | 0* | 2 | 1 | 2 | 1 | 1 | 2 | 1 | 2 | 12/18 | 0.595 | 12.8 | 60 / 160 |
| crowbar words | 0* | 2 | 1 | 1 | 1 | 0 | 2 | 0* | 1 | 8/18 | 0.414 | 21.9 | 60 / 216 |
| shotgun pictures | 1 | 2 | 1 | 1 | 1 | 0 | 2 | 2 | 0 | 10/18 | 0.774 | 6.1 | 174 / 344 |
| shotgun words | 1 | 1 | 1 | 1 | 1 | 0 | 2 | 2 | 2 | 11/18 | 0.726 | 14.9 | 174 / 280 |

The line-up picked the right original on all 14 legs, so no M6 was capped by it. Every decoy failed (4 or 5
of 18; the players' decoys 5 of 20).

### Table 2: the must-have items, and what the judges' reasons blame

| Item | Under 2 on | What the reasons say, counted over the 14 legs | Kit or agent |
| --- | --- | --- | --- |
| M1 | 14 of 14 | Characters: the base's pose (scientist both, zombie words, barney words: a forearm held forward, no stride); boxy feet sticking out (barney pictures, zombie pictures). Weapons: the top/below outline of a bent hook or a raked grip (crowbar, pistol) | Pose: kit (no way to set it). Shapes: both |
| M3 | 14 of 14 | Boxy boots or shoes (5 legs), block or ball hands (3), flat helmet (1), straight post legs (houndeye 2), the first-person weapon's shape (all 6 weapon legs: a thick bar, a box, a slab) | Kit: one shape for all three weapon files; no rounded primitive |
| M6 | 14 of 14 | Weapons: the first-person view, oversized and turned (all 6). Characters: boxy parts, smeared face, stiff pose | Kit (see 2.1) |
| M8 | 7 of 14 | Over twice the original's triangles: every characters words leg, houndeye pictures, crowbar both | Kit: no budget outside props, one shape in all three weapon files |
| M4 | 9 of 14 | Words legs: colours named wrong (an orange stripe the original lacks, a sky-blue shirt where it is navy); shotgun pictures: highlights lost | Mostly agent; projection on the pictures legs (section 6) |
| M2 | 5 of 14 | Scientist (the stride is the length), pistol and shotgun height | Pose: kit; the rest: agent |
| W1 | 4 of 6 | Too large, too near, turned (pistol both, shotgun pictures, crowbar words) | Kit |
| C1 | 8 of 8 | Moves like Gordon (or the bullsquid, or the G-Man), not like itself; sinks below the ground line (barney pictures, scientist pictures and words, zombie pictures; the houndeye's feet dip) | Kit: no retargeting, the floor |

The agents' own answers confirm the kit gaps in their words: the shotgun pictures agent spent 26 minutes and
tried five ways round the fit ("the build fits one shape into all three files by lining up its main axes,
weighted by surface area"); the crowbar agent: "The kit puts one shape into all three files"; the 9 mm agent:
"the fit sets that angle itself and I couldn't correct it from the spec"; the barney words agent: "Changing
that [pose] would mean changing the base's animations, which the brief says to keep".

## 2. Weapons

### 2.1 Why the first-person weapon is too large and turned

`src/spec/model.mjs` (`weaponViews`) fits the piece into each file with `swapMesh`, which puts the piece into
its own principal axes (`frameOf` in `src/fit.mjs`: PCA weighted by area) and those onto the old weapon's. For a
hidden file (the blind test) the size is forced to `"own"`: "a hidden file's weapon lends nothing of its own
shape: the piece keeps the size it was built at". Two things go wrong:

- **Scale.** Valve does not draw a `v_` weapon at world size.

#### Table 3a: the weapon mesh's length in `v_` against `w_`, Half-Life's 13 weapons with both files

| Weapon | v_ length | w_ length | v_/w_ |
| --- | --- | --- | --- |
| 357 | 17.1 | 30.4 | 0.56 |
| 9mmAR | 33.3 | 34.4 | 0.97 |
| 9mmhandgun | 10.5 | 16.8 | 0.62 |
| crossbow | 67.6 | 81.7 | 0.83 |
| crowbar | 26.0 | 43.8 | 0.59 |
| egon | 17.3 | 42.3 | 0.41 |
| gauss | 25.0 | 73.3 | 0.34 |
| grenade | 5.5 | 14.3 | 0.38 |
| hgun | 39.9 | 71.7 | 0.56 |
| rpg | 21.9 | 75.7 | 0.29 |
| satchel | 11.3 | 25.4 | 0.44 |
| shotgun | 23.0 | 41.5 | 0.56 |
| squeak | 10.9 | 12.8 | 0.85 |

Quartiles 0.41, 0.56, 0.62. Lengths along each mesh's principal axis; a `v_` mesh often leaves out what the
camera never sees (the shotgun's stock, most of the RPG), so a constant would be a poor guess. Built outside the
test, the same crowbar spec reports "scaled 0.59" in `v_`: in normal use the kit is right, and only the hidden
path is wrong.

- **Turn.** The piece's PCA frame moves with its shape: a hooked stock or a deep grip tilts its main axis, and
  `"as drawn"` means "as its own principal axes lie", not "as built along +x". The shotgun pictures agent tried
  every turn; the 9 mm agent could not remove a 2-degree roll the fit adds (M7 scored 1 for it).

### 2.2 The experiment: carry the piece by the old pair's registration

Valve's `w_` and `v_` weapons are two meshes of one object. Registering the old `w_` mesh onto the old `v_`
mesh gives a similarity (scale, turn, shift) that knows nothing of the new piece. The new piece is built and
judged in the `w_` frame (that is what the pictures show), so the same similarity carries it into `v_`.

Method (`wfit.mjs`, `wfit2.mjs`): 1,500 area-weighted samples of each old mesh in its carrying bone's space;
four starts from the two meshes' PCA frames (the proper sign flips) with the scale of their lengths; 25 rounds
of trimmed ICP matching each `v_` sample to its nearest moved `w_` sample, keeping the closest 85% (Chetverikov
et al.'s trimmed ICP, so that a stock missing from `v_` does not pull the fit), each round solved in closed form
for scale, turn and shift (Umeyama 1991). The reproduction's own `w_` weapon (from the round-1 build) was moved
by the result into the original `v_` file with `swapMesh(..., { place: "bone" })` and drawn by the harness's
first-person camera. The weapon's pixels are those the hands do not cover (a render with the weapon's triangles
dropped gives the hands).

#### Table 4: first-person outline of the weapon alone, against Valve's

| Leg | Registration's rest error (share of v_ length) | IoU as built | IoU registered | On-screen area, built / original | Registered / original |
| --- | --- | --- | --- | --- | --- |
| crowbar pictures | 2.9% | 0.400 | 0.758 | 1.81 | 1.00 |
| crowbar words | 2.9% | 0.034 | 0.609 | 2.18 | 0.81 |
| shotgun pictures | 1.6% | 0.145 | 0.617 | 4.84 | 0.97 |
| shotgun words | 1.6% | 0.414 | 0.595 | 2.40 | 1.08 |
| 9mmhandgun pictures | 2.2% | 0.320 | 0.725 | 2.91 | 1.16 |
| 9mmhandgun words | 2.2% | 0.245 | 0.647 | 2.34 | 1.04 |

Looked at (first-person pictures, original beside built beside registered): the crowbar and the pistol now sit
where Valve's do at its size; the shotgun lines up its barrel and receiver, but its hooked stock, which Valve's
`v_` mesh leaves out, pokes up in front of the camera. That is what section 2.3's per-view parts are for. What is
left in each IoU is shape (the crowbar's shaft is still square and twice as thick), which is the agents' to fix
once the placement is right.

**Verdict: build it.** In `weaponViews`, for every view after the first, take the transform from the old `w_` (or
`p_`) weapon to that file's old weapon and apply it to the piece as placed in `w_`; keep the present fit for `w_`
itself, with `"as drawn"` meaning the spec's own axes snapped onto the old one's nearest axis-aligned frame. Report
the registration's rest error, and fall back to today's fit above 5%.

**For Steven:** in the blind test the registration reads the hidden files' meshes, as today's fit already reads
their place and turn. It lends a transform and nothing of the shape. If that is too much, the fallback is the
median ratio 0.56, which would have put five of the six legs within about 1.3 times the original's size but
leaves the turn to PCA.

### 2.3 One shape, one picture, three files

Valve's three files are not one shape:

#### Table 5: the weapons in their three files

| Weapon | v_ weapon triangles | v_ textures (chrome-flagged) | p_ = w_? | w_ triangles | w_ textures |
| --- | --- | --- | --- | --- | --- |
| crowbar | 54 | chrome_red, chrome (both chrome) | yes (32 points, 60 triangles each) | 60 | 1 |
| shotgun | 246, plus a 32-triangle shell | sidemap, sight, bodyback, barrelltop, barrel_chrome (chrome), handle, grip | yes (104 points) | 174 | 4 (side, dark, hole, top) |
| 9mmhandgun | 293, plus the clip's 70 | back, side, chrome (chrome), top | yes (44 points) | 88 | 4 (side, back, top1, front) |

So `p_` and `w_` share one low mesh and one set of textures, and `v_` is a separate, more detailed mesh with
chrome-flagged textures (flags 3: flat shaded and chrome). The kit puts one shape into all three, shrinks one
picture by 1, 2 and 4, and refuses a second picture ("a weapon wears one picture"). The judges named the
missing chrome (crowbar both legs: "glossy red with dark shaded edges and its hook is black") and the crowbar's
`w_` budget (160 and 216 against 60).

Build: a part may say `views: ["p", "w"]` (left out of `v_`: a stock behind the camera) or `["v"]` (a sight seen
only in first person); a material may be `chrome` (a texture of its own with flag 2, in `v_` only, since Valve's
`p_` and `w_` have none); the `p_` and `w_` files are built with fewer sides (a round part's sides halved, down
to 4) and checked against a per-file budget. Valve's `w_` pickups: median 28 triangles, three quarters under 104
(`docs/SPEC.md`, "How many triangles").

## 3. Characters: the floor, the pose, the motion

### 3.1 The floor

#### Table 6: where each model's feet are in its first frame

| Model | First animation | Box z (low to high) |
| --- | --- | --- |
| player/gordon/gordon.mdl | look_idle | -36.2 to 37.9 |
| barney.mdl | idle1 | -0.2 to 75.1 |
| scientist.mdl | walk | 0.0 to 68.0 |
| zombie.mdl | idle1 | -0.8 to 67.5 |
| houndeye.mdl | idle1 | -0.1 to 44.6 |
| gman.mdl | idle01 | 0.1 to 73.3 |
| bullsquid.mdl | walk | -0.2 to 40.2 |
| barney, pictures leg (on Gordon) | look_idle | -36.7 to 38.9 |
| scientist, pictures leg (on Gordon) | look_idle | -36.4 to 36.7 |
| zombie, pictures leg (on Gordon) | look_idle | -36.3 to 32.4 |
| houndeye, pictures leg (on the bullsquid) | walk | 0.0 to 44.7 |

A player's origin is the middle of its 72-high hull; a monster's is its feet. The harness's run strip draws the
ground at z 0, so the judge saw the body cut at the hips (barney, scientist both legs, zombie pictures). M7
scored 2 everywhere because the still pictures are framed by the box, so nothing else catches it. In the game a
`monster_scientist` with this model would stand 36 units into the floor.

Build: `base.floor`: where the base's feet are (found: the lowest point of its first frame, rounded to -36 or 0)
and `floor` of the spec (0 for a monster, -36 for a player); the root bone of every animation moved by the
difference. The report says it ("Gordon's feet are at -36; lifted 36 to stand a monster on the floor"). A
character for a mod's players (The Specialists) keeps -36.

### 3.2 The first frame's pose

The rubric judges the first frame of the first animation and asks the reproduction to stand as the original
stands. The kit keeps the base's animations untouched, so the reproduction stands as Gordon does in
`look_idle`, the right forearm held forward. The agents worked round it by hanging the forearm from the elbow
(barney pictures), which then looks wrong in every other animation.

The experiment (`posefit*.mjs`): the pictures-leg builds as they are; frame 0 of animation 0 changed by turns
about the model's axes (`turnedInPose` of `src/animate.mjs`) on twelve joints (spine, neck, both hips, knees,
ankles, upper arms, forearms); the target is the original's outline in seven views (front, left, top and the
four angles, as the agent's pictures show them); coordinate descent at steps of 24, 12, 6 and 3 degrees; then
written with `replaceSequence` and measured with the judge's own `silhouettes` and `boxOf`.

#### Table 7: one frame refitted to the outlines

| Character | Fit | Worst of the judge's three outlines | Angle views (four) | Size (original 33.3 x 21.7 x 68.0 for the scientist) | Looked at |
| --- | --- | --- | --- | --- | --- |
| scientist | as built | 0.347 | 0.42 to 0.56 | 22.9 x 28.1 x 73.1 (31% and 30% off) | |
| scientist | every axis free, three views | 0.592 | | 37.4 x 20.4 x 68.9 | spine twisted 48 degrees: wrong |
| scientist | walking-plane swings only, arms out 15 at most, seven views | 0.618 | 0.61 to 0.72 | 31.4 x 23.5 x 72.4 (6%, 8%, 6%: M2 passes) | a plausible stride; one arm raised too far |
| barney (original 22.8 x 30.2 x 75.3) | as built | 0.617 | 0.60 to 0.64 | 21.3 x 30.6 x 75.7 | |
| barney | every axis free, seven views | 0.785 | 0.78 to 0.81 | 22.2 x 31.1 x 74.3 | legs crossed at the knee: wrong |
| barney | walking-plane swings only | 0.780 | 0.71 to 0.77 | 20.6 x 30.6 x 75.9 | plausible: the short stride |
| zombie | as built | 0.517 | 0.62 to 0.64 | | |
| zombie | walking-plane swings only | 0.612 | 0.57 to 0.62 | | little gain: its misses are shape (box shoes, arms) |

Readings:

- The pose is worth 0.1 to 0.27 on the worst outline where the base stands otherwise than the original, and it
  is what M2 failed on for the scientist.
- Outlines alone are ambiguous: with every axis free the search twisted a spine and crossed legs to fit them.
  What made the poses plausible was restricting the joints to swings an animator would use (forward and back for
  hips, knees, ankles, spine and arms; a little out for the arms; no twist). SMPLify (Bogo et al. 2016) meets
  the same ambiguity in fitting a body to a picture with a learned pose prior and a penalty on limbs passing
  through each other; for SMAK, joint limits per bone in the walking plane are the cheap form.
- The bodies were built for Gordon's pose, so posing them afterwards leaves odd parts (the scientist's raised
  forearm was built forward). The fit belongs before the body is built: the agent states the pose, the build
  places the parts in it.
- Coordinate descent is greedy and found worse fits for the zombie's front view than it started with. CMA-ES
  (Hansen's tutorial, arXiv 1604.00772) handles a dozen coupled angles better at a few hundred evaluations; each
  evaluation here cost about 20 milliseconds.

Build: `pose` in a character spec, `{ "keys": { "Bip01 L Leg": { "turn": { "y": 24 } }, ... } }` as a weapon's
animation keys are given, written into every frame of the first animation (its number, length and activity
kept: AGENTS.md rules 1 and 3); and `pose: { "fit": "pictures" }`, which runs the restricted fit against the
`project` pictures' outlines and reports the turns it chose. The parts are then placed as the base stands in
that pose (the report's `fact base ...` joints move with it).

### 3.3 Motion and activities (C1)

C1 scored 1 on all eight legs: "moves like Gordon". Two causes the kit can address:

- **The base lacks the monster's activities.** A monster's code asks for animations by activity, not by name.

#### Table 6b: activities each monster uses that Gordon's model has none of

| Monster | Activities it uses | Missing on Gordon | Which (the kit's `ACTIVITY` table) |
| --- | --- | --- | --- |
| barney | 23 | 14 | turns, small flinch, the four limb flinches, the barnacle's four, two numbers the table does not name (33, 34) |
| scientist | 29 | 20 | turns, flinches, melee attack, cower and others |
| zombie | 17 | 10 | turns, small and big flinch, fall, melee attack 1, the four limb flinches |
| houndeye | 19 | 8 | turns, small flinch, combat idle, and others |

  The zombie words agent chose the G-Man, whose 14 animations carry 2 distinct activities. In the game such a
  zombie never attacks or flinches. Build (small): a `contract`-style check for monsters, the activities the
  replaced model's code asks for, warned of when the base lacks them. In real use the person replaces
  `zombie.mdl` on `zombie.mdl` itself (`base: { file: "zombie.mdl" }`), which the kit already supports and which
  solves the floor, the pose and the activities at once; the blind test refuses that, so it measures the harder
  cross-skeleton case.
- **No retargeting.** Making the run look like the original's means new frames for the base's run (its number,
  length and activity kept). The pictures leg's `motion.png` is eight side views of the run: the pose fit of 3.2,
  per frame and against one view, gives eight key poses (outlines are measures; legitimate), joined by
  `animate`'s eased keys and planted with `reach`. One view leaves left and right legs ambiguous; alternate them
  by frame and keep each joint's turn continuous. Gleicher 1998 (retargeting motion between skeletons with space
  and time constraints) is the classic statement of keeping the feet planted while the proportions change; the
  kit's `stride` already measures the slide. Large; after 3.2.

## 4. Shapes: organic parts within a budget

The judges' M3 complaints on the characters were boxy boots or shoes (barney both, zombie both, scientist), block
or ball hands (barney words, scientist both), a flat cap for a domed helmet, straight post legs (houndeye both)
and a stiff barrel body (houndeye). The kit's parts are box, cylinder, sphere, turn, tube and leaf, each placed
on one bone.

### Methods

| Method | What it gives | Implementable detail | Verdict |
| --- | --- | --- | --- |
| Superquadrics (Barr 1981, IEEE Computer Graphics and Applications 1(1)) | One part that is a box, a rounded box, a cylinder or an ellipsoid by two exponents | Points `(a cos^e1 v cos^e2 u, b cos^e1 v sin^e2 u, c sin^e1 v)` over a grid of 8 round by 6 up: 96 triangles; normals from the implicit gradient | **Build first.** A boot is a rounded box (exponents 0.3, 0.5), a fist a rounded box, a helmet dome half an ellipsoid. Recommended already in `repeated-failures.md` section 2, not yet built |
| Skin round a chain of joints: B-Mesh (Ji, Liu and Wang 2010, Computer Graphics Forum 29(7), Pacific Graphics), SQM (Bærentzen et al. 2012, "Converting skeletal structures to quad dominant meshes", Computers and Graphics 36(5)); Blender's Skin modifier is one in common use | One closed low mesh round a skeleton with a radius (or an ellipse) at each joint: arms, legs, a houndeye's legs, a tail, with no gaps at the joints when they bend | Sweep a ring of 6 to 8 sides along each bone, sized by the joint radii; at a branch (pelvis, chest) join the rings by the convex hull of their points (B-Mesh's "stitching"); each ring's corners hang on the bone it was swept along, the branch's on the parent | **Build second.** It replaces a dozen cylinders, spheres and `over` overlaps per body with one part kind, keeps the triangle count by sides and rings, and closes the elbows and knees that boxes open |
| Convolution surfaces (Bloomenthal and Shoemake 1991, SIGGRAPH) and metaballs (Blinn 1982), polygonised by marching cubes (Lorensen and Cline 1987) or surface nets (Gibson 1998), reduced by QEM | Smooth blended shapes from segments with radii: a zombie's torn torso, the houndeye's hunched body | A field summed over bone segments, sampled on a grid of about 64 cells to the body's height, polygonised, reduced to the budget; each corner hangs on the segment that contributes most to its field (for GoldSrc's one bone a corner, the largest contribution is the natural choice) | Later: needs the Node QEM (backlog item 33). The skin method gives most of the look at a fraction of the work |
| Visual hull carved from the pictures (Laurentini 1994; the prior report's section 1 measured it on props) | The outline in every view by construction | As `repeated-failures.md` section 1, after the pose fit (3.2), so the pictures and the skeleton agree; corners hung on the nearest bone segment, or by Pinocchio's heat diffusion weights (Baran and Popović 2007, SIGGRAPH) taking the largest | Pictures leg only, after ranks 6 and the QEM. Between the legs and under the arms the hull keeps extra volume the side views cannot see |
| Sketch inflation: Teddy (Igarashi, Matsuoka and Tanaka 1999, SIGGRAPH), Monster Mash (Dvorožňák et al. 2020, ACM Transactions on Graphics 39(6)) | A rounded solid from one outline, and layered parts | Inflate a side outline by the distance to its middle line | Declined: the hull and the skin cover the same ground with what the kit has |

### First experiments

- Superquadric boots, fists and helmet on the barney pictures spec. Metric: the judge's M3 reason no longer
  naming the boots or hands; the left/right outline (today 0.821) no worse; triangles no more.
- The skin method on the houndeye words spec (legs as chains of three joints with radii from the words). Metric:
  triangles under 616 (2x), and C1's "thin stilt legs" gone.

### Budgets

#### Table 3: where the over-budget characters spent their triangles (round-1 specs rebuilt without projection)

| Leg | Total | Heaviest parts | Original |
| --- | --- | --- | --- |
| houndeye words | 2072 | body 288, eye rim 204, fourteen eye spheres 48 each (672), thigh 128 | 308 |
| scientist words | 2036 | coat skirt 280, head 240, torso 192, shoes 160 each | 740 |
| crowbar pictures | 160 | chisel, hook and claw 32 each | 60 |

The houndeye's fourteen eyeballs are a texture in Valve's (its `eye` picture, 80 x 96); built, they are 672
triangles. The `paint: true` flag and the budget report (commit 7846e1f) exist, but only a prop is warned.
Build: a budget for every kind; a character's default is its base's own body count (Gordon's), or twice the
replaced model's when a `contract` names one; a fault over it, with the heaviest parts and the "could be painted"
list the prop report already gives.

## 5. The houndeye: a creature no base fits

The pictures leg chose the bullsquid (four legs, its tail bone as the third leg) and scored best on outline of
all eight character legs (0.792 worst); the words leg chose Gordon, and its third leg is fixed to his pelvis.
Neither moves as the houndeye does. A spec cannot make a skeleton today, though the library can (`buildMdl`
with `bones`, and `src/animate.mjs` with `reach` and `stride`, as AGENTS.md's "A monster from nothing" shows).
Build (large): `kind: "creature"` with `skeleton` (bones by name, parent and place) and a `gait` generator
(legs, their phase, stride, body pitch), writing idle, walk and run with their activities, the hit boxes `auto`.
Whether the blind test may use it is the rubric's question: "on another model's skeleton" was the rule.

## 6. Texture: density, layout, faces, and the line on copying

#### Table 8: texel density in the first frame (texture area the triangles cover, over their surface)

| Model | Texels a unit | Share of its pictures the triangles use | Face texture's texels a unit |
| --- | --- | --- | --- |
| barney (Valve) | 3.69 | 0.90 | 10.6 (BX_Face1) |
| barney pictures / words | 4.35 / 4.13 | 0.57 / 0.45 | as the body |
| scientist (Valve) | 3.71 | 0.90 | 6.9 (SCI3X_Face1) |
| scientist pictures / words | 2.33 / 4.54 | 0.46 / 0.52 | as the body |
| zombie (Valve) | 2.80 | 0.77 | 5.8 (ZOM2_Face1) |
| zombie pictures / words | 3.81 / 1.80 | 0.38 / 0.35 | as the body |
| houndeye (Valve) | 2.51 | 0.95 | |
| houndeye pictures / words | 1.68 / 1.56 | 0.54 / 0.36 | |
| input pictures (512 dots a view) | 5.8 (barney) to 8.8 (houndeye) dots a unit | | |

Readings:

- **Valve packs 77 to 95% of its pictures; the kit 35 to 57%.** `allot` (`src/workshop.mjs`) lays zones in rows in
  the order the spec lists its parts, so a tall part after short ones wastes the row. Sorting by height first
  (shelf packing, next fit by decreasing height) or MaxRects (Jylänki 2010, "A Thousand Ways to Pack the Bin")
  are the standard fixes. Small.
- **Valve gives a face 2 to 3 times the body's density** (10.6 against 3.7 on Barney). `allot` already takes a
  weight; the spec does not expose it. A part's `texels: 2.5` (or a default for parts on the head bone) would put
  the judges' "smeared face" (barney pictures, scientist both) into the faces' share. Small.
- **The houndeye pictures leg was blocky** because its spec left `texture` at the 256 x 256 default over a
  4,600-square-unit body at 54% use: 1.68 texels a unit. The default could be chosen from the area: Valve's
  characters sit at 2.5 to 3.7, so the sheet's side is about `sqrt(area x 12 / use)`, rounded up to 256 or 512.
- **Valve's character textures are planar region panels**: BX_Front_Mid1, BX_Back_Top1, BX_Front_Bot1 and so on,
  each a front or back view of one stretch of the body. This is the "photo charts" idea of
  `photo-to-model-experiments.md` done by hand: a region's picture is a straight view of it. A face drawn on its own
  front panel by place (eyes at half the head's height, as artists' head proportions put them) is the words leg's
  way to a readable face.

**The line on copying.** The input pictures hold 5.8 to 8.8 dots a unit where Valve's textures hold 2.5 to 3.7
texels (the pistol: 29 dots against 5.9). Projecting them, as five of the seven pictures legs did (barney,
houndeye, zombie, pistol, shotgun), therefore resamples Valve's texels at more than their own resolution wherever
a view sees the surface squarely. Those legs' delta E is 6.1 to 13.0; the two pictures legs that did not project
are at 12.8 and 17.4, and the words legs at 11.8 to 29.6. By the line drawn in
`asset-reproduction-failures.md` section 7 (measures and parametric drafts in, texels out), the projection is
copying in this test, although `project` is a sound feature for a person's own pictures. Legitimate uses of the
same pictures, all measures:

| Use | What it reads | Status |
| --- | --- | --- |
| Outlines as targets: the pose fit (3.2), the carved hull (4), the weapon's placement check | Silhouettes | Legitimate |
| Sizes and proportions (joint heights, limb lengths, a grip's rake) | Measured off the outlines | Legitimate |
| Region colours (a mean per region, smoothed) and where marks lie (a logo's place and size) | A few numbers a region | Legitimate, like naming a colour |
| The motion strip as key poses | Joint angles a frame | Legitimate |
| Projected texels | Valve's texture, resampled | Copying here; Steven's decision whether the pictures leg may use `project` against Valve's models, or whether its pictures should be drawn smaller than Valve's texel density |

## 7. Bugs found on the way

| Bug | Evidence | Fix |
| --- | --- | --- |
| The projection's outline finder takes the sheet's captions in | barney pictures, zombie pictures and pistol pictures agents all hand-entered `rect` for it. `tile` (`src/render.mjs`) draws the caption band from 4 dots in (`NAME_AT` 6 minus its 2-dot margin); `outlineBox` (`src/spec/project.mjs`) treats as a caption only a patch within 2 dots of the corner | Treat a patch starting within `NAME_AT` of the corner, of one dark colour with light letters, as the caption; or test against `BAND_HIGH` |
| `attach: { bone, at: "start" }` fails | Reproduced: a cylinder on `Bip01 Head` with `at: "start"` reports "Cannot read properties of undefined (reading '0')"; `bottom` and `centre` work. The scientist words agent hit it | Resolve `start` and `end` for a part attached to a bone as for one attached to a part |
| `weapon.turn: "as drawn"` does not keep the drawn axes | The shotgun pictures agent: "as drawn doesn't keep the drawn orientation"; the pistol's 2-degree roll (M7 1) | Measure the piece in the spec's own axes, not its principal axes (section 2.2) |
| A hidden weapon file gets the piece at its own size | Table 3a and Table 4 | Section 2.2 |

## 8. Later: the words leg's outline gate against a real body (2026-10-16)

After `pose.from` (7e33658) the scientist's words copy stood in Gordon's walk and came within 2% of the
original's size, yet still failed M1 (worst outline 0.51) and M4 (delta E 16.2); Barney's words copy failed both
too (0.59, 23.7). The question was whether a better body would pass. The control (`research/outline-control.mjs`):
Gordon's own body, as Valve made it, set against the original by the judge's `measureModel`, in every other frame
of his walk.

#### Table 9: Gordon's own body against the originals (the judge's three outlines)

| Against | Gordon in | Front | Side | Above | Worst |
| --- | --- | --- | --- | --- | --- |
| scientist (first animation a walk) | walk, best frame for the worst (12) | 0.693 | 0.586 | 0.557 | 0.557 |
| scientist | walk, frame 14 (nearest the size) | 0.671 | 0.462 | 0.535 | 0.462 |
| scientist | walk, frame 4 (worst) | 0.673 | 0.288 | 0.358 | 0.288 |
| barney (standing) | look_idle, first frame | 0.826 | 0.799 | 0.576 | 0.576 |
| barney | idle, first frame | 0.844 | 0.798 | 0.596 | 0.596 |

Readings:

- **A real human body of the game fails the gate.** M1 gives 2 at a worst outline of 0.8 and 1 at 0.6; Gordon's
  own body scores 0 against both originals in every frame tried. The words copies' 0.51 and 0.59 are already
  about where Valve's own body lands.
- **The worst view is the one from above**, for Barney even standing: where the arms hang and how far the
  shoulders and feet reach, which words seldom say. From the side, the scientist's outline swings from 0.29 to
  0.59 with the phase of the stride alone.
- So in the words leg M1 measures stance, not body. A better body template would not by itself move it; a
  description that gives the stance in numbers (the arms' angle out and forward, the stride's length and which
  foot leads) might, and the gate's thresholds for a words leg are the rubric's question, for Steven.

**The pictures leg's torn coat.** The scientist's pictures copy passes every measured gate and loses C1 (0, a
must-have): in the run its coat tears into slabs from the hips to the trailing foot. The carved hull is one
surface, the coat's hem joined to the trouser legs under it, and a corner has one bone. Measured over Gordon's
`run2` (`stretch.mjs`: the share of triangles whose edges grow past 3x their first frame's):

| Rigging | Past 3x | Worst | Run, looked at |
| --- | --- | --- | --- |
| least stretch (as judged) | 13.0% | 52.6x | slabs from hips to foot |
| plus parents as candidates, torn triangles whole to one bone or the ancestor (09d0cef) | 10.9% | 32.2x | one slab fewer, two left |
| plus every still-torn triangle whole on one bone, its corners its own (a seam) | 0.0% | 2.4x | shards float by the feet, a shoe comes off: rejected |
| the torn triangles dropped | | | holes down the legs, shoes off: rejected |
| the hull cut across at the hem (z 24) and below it down the middle (y 0), each piece rigged alone, with parents as candidates | 16.9% | 64.9x | worse: a leg stub hung whole on the pelvis stretches nothing, so least stretch picks it |
| the same cut, candidates the template's and the nearest limb's only | 15.5% | 54.4x | worse: in the fitted stride the legs part along x, not y, so the middle cut leaves them webbed; some tears are the knee bending (thigh against calf) |
| the carve kept above the hem (z 22) and the legs a `blob` on Gordon's leg bones | 6.5% | 10.2x | the run holds, but the legs follow the base's fitted stride, not the pictures': side outline 0.56 (M1 0), build FAULT under 0.7 |

No choice of one bone a corner mends it, and plane cuts do not either: the legs of a body carved in a stride are
joined by the hull wherever a view sees them overlap, and they part along the stride, not across the body. What
would: legs that are not carved at all. Carve the coat and trunk alone (from pictures cropped above the hem, or a
hull clipped there) and build the legs under it as `blob` pieces spanning the leg bones, as Valve's scientist is
made (`Sci3(C-Tail)` its own texture over the legs'). Tried (last row): the run holds, and the outline is lost, since
the legs are where the base's pose puts them and not where the pictures do. Either way a must-have fails; what
is left is a pose fit good enough that blob legs land on the pictures' legs, or legs carved one at a time, each
from the pictures with the other masked out.

**The stance in words, by a form (2026-10-16, later).** Following the research on structured captions (fixed
fields, a region at a time, positions and angles spelled out), `held.mjs --form` has the describer fill in a form.
The angles came through, and `pose.aim` (03c3107) sets them whatever the base's stance, but the angles themselves
are not the original's: read off 2D views by eye, the scientist's stride came out 27% long and Barney, who stands
nearly still, 31%. Side outlines: scientist 0.51 (prose), 0.27 (form through keys), 0.45 (form with aim); Barney
0.63, 0.54. The words leg stays at 0. What an LLM reads badly off pictures is 3D angle and extent; what it reads
well is what a thing is and its parts. A form that asks for the visible extents (how far the front foot is ahead
of the back one, as a share of height, which facts.txt's size already pins) may serve better than angles.

## Build list

In order. Each: what, where, its first test.

1. Weapon placement by the old pair's registration (`src/fit.mjs`, `weaponViews` in `src/spec/model.mjs`), and
   `"as drawn"` in the spec's axes. Test: Table 4's six legs rebuilt from their specs, weapon-only first-person
   IoU at 0.6 or more and on-screen area within 0.8 to 1.25 of the original's.
2. A character's floor: lift the root by the base's floor to the spec's (`src/spec/model.mjs`). Test: the six
   Gordon-based builds' first frame from z 0; the run strip's feet on the line.
3. Budgets for every kind, per weapon file, with fewer sides in `p_` and `w_`. Test: the seven over-budget legs
   rebuilt fault; the crowbar's `w_` at or under 120.
4. The three small bugs of section 7. Test: the barney pictures spec with no `rect` finds the figure; the
   `at: "start"` spec builds.
5. Texture layout: sorted packing, a part's `texels` weight, a default size from the area. Test: Table 8's "share
   used" over 0.75 on the eight character builds, and the face's density at least twice the body's.
6. `pose` for a character, keys and `fit`, restricted to walking-plane swings with joint limits, solved by CMA-ES;
   the parts placed in it. Test: Table 7 rebuilt with the pose first and the body after: scientist worst outline
   over 0.7, every size within 10%.
7. Per-view parts and a `chrome` material for weapons. Test: the shotgun with its stock `views: ["p", "w"]`, its
   first-person outline over 0.7; the crowbar's `v_` with a chrome shaft.
8. `superquadric` part kind, then a joint-chain skin part. Test: section 4's two experiments.
9. Monster activities checked against the base; motion refitted from the motion strip. Test: zombie on the G-Man
   warned; barney's run frames from `motion.png`, the judge's C1 reason.
10. Carved hull for characters (after 6 and the Node QEM). Test: the prior report's metric, on barney and the
    zombie pictures legs.
11. A creature's own skeleton and gait in a spec. Test: the houndeye from words with three legs that run.

## What I could not verify

- **Citations are from memory.** Web search was unavailable for this session (a session limit), so no venue,
  volume or year here was checked today: Barr 1981, Ji, Liu and Wang 2010, Bærentzen et al. 2012, Bloomenthal
  and Shoemake 1991, Blinn 1982, Lorensen and Cline 1987, Gibson 1998, Laurentini 1994, Baran and Popović 2007,
  Igarashi et al. 1999, Dvorožňák et al. 2020, Bogo et al. 2016, Gleicher 1998, Umeyama 1991, Chetverikov et al.
  (trimmed ICP, 2002), Jylänki 2010 and Hansen's CMA-ES tutorial (arXiv 1604.00772). Each should be checked
  before any is quoted outside this folder.
- **The pose fit used outlines drawn from the original model**, the same information as the input pictures but
  without finding the outline in a PNG and scaling it (as the prior report's carving did). It held the fitted
  pose in every frame of animation 0, which changes nothing the judge measures but is not how the build would
  write it. The joint limits are my choice, not measured from human ranges.
- **The weapon registration was run on the round-1 builds' `w_` meshes**, outside the build; nothing was rebuilt
  through the spec, and no judge scored the result. Its outline measure counts the weapon's pixels in the still
  first-person frame only, not through the attack.
- **The 36-unit sink in the game** is inferred from the engine's convention (a monster's origin at its feet, a
  player's at its hull's middle) and the boxes measured; I did not place the model in a map.
- **Activity names** come from the kit's `ACTIVITY` table; 33 and 34 (Barney's) are not in it, and what Barney's
  code does without them is not checked.
- **Texel density** counts the triangles' texture area in the first frame; mirrored or shared pixels count twice,
  which overstates Valve's figures a little where its meshes share panels.
- Nothing was run in the game.
