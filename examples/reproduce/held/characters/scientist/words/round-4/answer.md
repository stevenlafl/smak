The model is built and the build says **OK**: `work:scientist.mdl` (the work folder, 1.19 MB), with its spec beside it as `work:scientist.spec.json`. I built it from your written description only. I had no reference pictures, so nothing here has been compared side by side with the original, and I did not run it in the game.

**Checks from the build**

| Check | Result |
| --- | --- |
| Height | 67.9 units against 68 asked |
| Width | 23.6 units across the hands against 21.7 asked (within the 10% tolerance) |
| Length | 17 units front to back. You gave 33.3, but I did not set it (see below) |
| Holes, floating parts, faces turned the wrong way | None |
| Triangles | 1,188, over twice the 362 of Gordon's own body (a warning only) |

**What I built**

- **Base:** Gordon's skeleton and all its animations, found in the Half-Life `valve/models` folder. `floor: 0`, so the feet stand at the origin.
- **Head:** a pale, slightly long skull with a bald top. A grey-white hair band runs from ear to ear over the sides and back. Black-rimmed glasses are painted on, with arms back to the ears. There are a long nose, slightly prominent ears and a thin mouth.
- **Body:** a white lab coat (a soft body with a hem at about mid-thigh to knee, slightly flared), with a blue shirt and a navy tie with red diagonal stripes painted on the front. A black belt with a grey buckle goes all the way round. Trousers are off-white, and the shoes are reddish-brown leather.
- **Arms and hands:** the arms hang at the sides with curled fists, hands at mid-thigh.

**Where I departed from the description or from the skeleton**

- **Stride:** the base's standing stance is narrow, so the figure is 17 units long where you gave 33.3. I did not force a wider stride, because moving the legs means keeping the feet on the floor with no inverse kinematics.
- **Pose:** the base's first animation holds Gordon's right arm forward with a gun. I turned its right forearm down and brought both upper arms in slightly, so the arms hang. This changes the frames of that first animation only, not the others. Say if you want that reverted.
- **Coat front:** the coat is not really open down the front. The shirt, tie and belt are painted onto the closed coat, and the lapels and collar are not modelled.
- **Motion:** the walk and run are Gordon's, not the 19-frame scientist run. Without reference frames the motion could not be fitted to yours.
- **Face at close range:** the glasses and hair band are painted onto the head, but the close-up tool showed the hips rather than the head. I could not confirm the face detail up close, so that is the least verified part.
- **Minor:** the build notes that each ear sits 0.3 units from the neck. That is a note, not a fault.

If you can send a front view and a side view of the original, I can run the fitting tools against them and check the outline and colours directly.
