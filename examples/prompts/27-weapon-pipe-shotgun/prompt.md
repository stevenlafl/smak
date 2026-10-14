# 27 A pipe shotgun in place of the shotgun (weapon; a pump on the game's pump bone)

## The prompt (96 words)

> Replace the shotgun with a homemade pump shotgun: a steel water-pipe barrel, open at the muzzle, with two
> hose clamps holding it to a thinner pipe underneath for the magazine, a boxy steel receiver, a rough
> wooden stock with a black rubber butt pad, a wooden pistol grip, a trigger in a bent steel guard, a
> brass bead sight at the muzzle, and a wooden pump on the lower pipe that slides back and forth when you
> pump it, like the game's. All three models; show it firing.

Built on Half-Life's own `v_shotgun.mdl`, `p_shotgun.mdl` and `w_shotgun.mdl`: the results stay out of the
repository.

## The rubric (written before the spec)

| # | Item | Must | Score |
| --- | --- | --- | --- |
| 1 | Three files with the game's names, hands, bones and animations kept | yes | 2 |
| 2 | A pipe barrel open at the muzzle over a thinner magazine pipe, two clamps, a boxy receiver | yes | 2 |
| 3 | A wooden stock with a black butt pad, a wooden grip, a trigger in a guard, a bead sight | yes | 2 |
| 4 | A wooden pump on the game's pump bone: it slides when the shotgun is pumped | yes | 2 |
| 5 | Held as the shotgun is; nothing open, inside out or apart | yes | 2 |

**Score: 10 of 10 (100%), judged from the pictures built locally. Passes.**

## How the prompt became the spec

- `weapon: { like: "shotgun" }`: the wooden pump names the game's pump bone (`bone: "Bone01"`, which
  carries the shotgun's own `grip.bmp`): measured against the hand it slides 2.1 in `shoot`, 4.9 in
  `shoot_big` and 4.2 in `pump`, exactly as the game's does. The game's arm texture is `HAND_ForeArm1`,
  which the kit did not know for a hand until this case.
- The barrel is a lined turn open at the muzzle (as case 24's pipe), the magazine a thinner turn under
  it, held by two clamps. The stock is one turn along x whose rings drop and widen towards the butt
  (`off`), its front ring inside the receiver; the guard and the trigger rise into the receiver.

## Iterations

1. The barrel's open end, as case 24. And the kit took `HAND_ForeArm1` for part of the gun: the hands
   are now told by `forearm` too (not by `hand`, which the .357's `Pythonhandle` grip would match).
2. The pistol grip was inside the stock, which ran under the receiver: the stock shortened, the grip
   lowered under it.
3. Steven saw that the stock did not meet the receiver cleanly. It was a box pitched 8 degrees ending short
   of the receiver: a step and a gap, with the grip a block under the joint; and the close view showed the
   trigger guard's ends an inch under the receiver. No check said so: each touched something (the grip,
   the trigger), and the floating check asks only that a part touch some other. The stock is now one turn
   that runs into the receiver, the guard and the trigger rise into it; drawn close, they meet.

