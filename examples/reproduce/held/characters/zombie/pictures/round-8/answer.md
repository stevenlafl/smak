The zombie is built and the build says **OK**, but the claws are shorter than the original's, so it will not match the original's silhouette as closely as I'd like.

Output: `work:zombie.mdl`, with its spec at `work:zombie.spec.json` and the six-view check sheet at `work:zombie-sheet.png`.

**What I built**
- **Base:** Gordon's skeleton (`player/gordon/gordon.mdl`), with `floor: 0`. Its own animations are kept, and I did not refit them to `motion.png`.
- **Body:** one carved shape from the six-side sheet and the four angle pictures, at the stated 38.5 × 53.8 × 68.4 size. Its stance is the pose the build fitted to the outlines: small turns on both legs, both upper arms, and both forearms.
- **Claws:** eight four-sided tubes, four per hand, hung on the hand bones so they follow the animation. The body alone could not hold the fingers; the carve drops anything thinner than its cells.
- **Colour and markings:** the pictures are projected onto the surface, so the white coat, the red and dark blood marks, the cream head and the chest and back openings come from the original's own pictures.
- **Budget:** 712 triangles, under the 724 cap (twice the base body's 362).

**Outline match, per view (the bar is 0.8; under 0.7 is a fault)**

```
view          overlap
front         0.778
left          0.795
back          0.785
right         0.796
top           0.765
below         0.765
yaw 35        0.750
yaw -35       0.804
yaw 145       0.845
yaw 215       0.793
```

**What's short of the original**
- The claws reach about 8 to 10 units out, where the original's reach about 18 to 20. I shortened them because longer claws dropped the back-angle outline under 0.7, which fails the build. Without claws, every view clears 0.8. Longer claws would look closer, but the build would fail. Say if you'd rather have the longer claws and fix the back angles another way.
- The finer fingers and the long reaching forearm are lost in the carve; the build reports 57 lost thin pieces.
- The body's colour and marks are only as good as the single 512-pixel sheet.

I could not run the model in the game, so the walk and the look under game lighting are untested. The side-by-side with the original is the check that matters.
