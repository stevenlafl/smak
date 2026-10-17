# How Valve lays a model's pictures, and why ours read worse

Steven, 2026-10-17: "please inspect valve's UV maps and how they place them onto the models. I want to replicate
that. It's far cleaner than how we are doing it."

## What Valve does

Barney's file wears 26 textures, not one: a texture for each region of the body and the way it faces.
BX_Front_Top1 is the vest seen from the front, logo and badge and all; BX_Back_Top1 the same seen from behind,
SECURITY across it; BX_Face1 a portrait of the face; BX_Front_Mid1 the trousers from the front; BX_Front_Bot1
both legs' fronts side by side, boots at the bottom; BX_Arm1 one arm, which both arms wear. Each is small (64 x 96,
76 x 93, 91 x 108 ...) and read as a picture of its region. The triangles lie on it as that region projects onto a
plane: the seams fall at the sides, where front meets back. (`smak uv barney.mdl -o dir` draws them, triangles
over pictures; the game's files are not copied anywhere.)

Measured (research/valve-uv/planar.mjs, at the rest pose: each island's u and v fitted as a linear function of
its corners' points; a residual under 1.5 texels is a flat projection):

```
Model          Islands laid by flat projection   Share of triangles
houndeye       9 of 9                            100%
bullsquid      27 of 27                          100%
headcrab       9 of 10                           95%
v_crowbar      4 of 6                            93%
v_9mmhandgun   26 of 34                          92%
v_shotgun      9 of 11                           83%
scientist      17 of 23                          79%
hgrunt         23 of 31                          78%
zombie         22 of 23                          70%
gman           25 of 32                          61%
barney         21 of 28                          54%
```

The rest are mostly round parts wrapped round their length (barney's arms). Measured in the idle stance the
shares fall (barney 36%): the projection was made in the modelling pose, which `{ seq: null }` gives.
research/valve-uv/survey.mjs counts each model's textures (5 to 26) and their sizes.

## What we do

One 512 x 512 atlas for the whole body, cut by the automatic chart-maker (src/charts.mjs) into a front, a side and
a back outline and dozens of loose fragments and slivers, a third of the picture empty. Nothing on it is a picture
of a region; a face, lettering or a vest's detail must survive being cut across fragments, and a generated front
picture is projected onto pieces that do not look like it.

## What to build

A layout that is Valve's: regions by bone; each projected flat from the front and from the back (a limb wrapped
round its length where that is cleaner); each in a texture of its own or a patch of one, sized to the region; a
left and right limb on one picture. A front and a back picture of the character (generated, photographed, or
painted) then are the textures, near enough copied.
