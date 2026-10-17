# How large Valve draws a weapon in each of its files

2026-10-16. Question: what does a weapon's size in a spec mean, its length in the hands or in the world? Steven:
"I don't know how to answer that. Can't you measure both." Measured: each of Half-Life's weapons of known real
length, in each file, against the real one. A unit is about an inch.

```
Weapon (real)            real   v_ first person   p_ another's hands   w_ in the world
.357 (Colt Python 6")    11.5   17.1  1.49         10.4  0.91           27.8  2.42
9mm (Glock 17)            7.3   10.5  1.44          8.0  1.09           14.8  2.02
9mmAR (MP5)              26.8   33.3  1.24         18.8  0.70           34.3  1.28
shotgun (SPAS-12)        41     23.0  0.56         23.1  0.56           40.8  1.00
crossbow                 36     67.6  1.88         27.3  0.76           81.7  2.27
RPG                      47     21.9  0.47         38.3  0.82           75.6  1.61
crowbar                  24     26.0  1.08         26.1  1.09           43.4  1.81
median                          1.24               0.82                 1.81
```

`p_` and `w_` are the length of each model's box; `v_` is the weapon mesh's own length
(research/held-reproduction-failures.md, Table 3a), since the first-person file's first frame holds the hands
and, in some, pieces apart from the weapon (the .357's reload: a box of 63).

So Valve draws a weapon near life size in the hands and larger in the world, most for small things (a pistol two
to two and a half times), so that a pickup reads on the floor. The first person varies most (0.47 to 1.88): the
camera is near and a long weapon reaches out of the picture.

What follows:

- **A spec's `size: "own"` is the real weapon's length.** The kit lays it in each file at that file's median share
  (`HELD_SCALE` in `src/spec/model.mjs`): first person 1.24, in the hands 0.82, in the world 1.81. Before, the built
  length went into the world model as it was, and the first person at 0.56 of that: half Valve's size in every file.
- **A judge reads a weapon's size off `p_`**, divided by 0.82: the file nearest life size and with nothing else in it.
