The model is built as `forklift.mdl` in the SMAK work folder. The build says OK and every check passes, but it does not yet match the reference closely in every view.

The build's own outline check measures how much of the model's silhouette overlaps each reference picture. Under 0.8 is flagged as off.

```
View                  Overlap  Flagged
front                 0.83     no
back                  0.88     no
left (yaw 90)         0.77     yes
right (yaw -90)       0.75     yes
top                   0.77     yes
below                 0.72     yes
yaw 35, pitch 20      0.71     yes
yaw -35, pitch 20     0.68     yes
yaw 145, pitch 20     0.76     yes
yaw 215, pitch 20     0.68     yes
```

**How it's built**

- **Shape:** 28 boxes, tubes, spheres and cylinders, placed from measurements taken off the sheet's left and front views. The body, mast, forks, carriage, overhead guard, wheels, seat, steering column and driver are separate parts.
- **Size:** 186.3 long, 59.5 wide and 113.4 high, against the asked 186.6, 60 and 113.4.
- **Texture:** one 512 by 512 picture, painted by projecting the six sheet views and the four angle pictures onto the shape. From those cameras the surfaces take the original's colours and markings directly.
- **Triangles:** 772. This is above the 576 median the report gives for props of this size, which is a warning only.

**Why not the carved route:** I tried carving the whole machine from its silhouettes first. It lost the forks and mast (length 110 instead of 186.6) and matched the left view at only 0.32, so I dropped it.

**Where it still falls short**

- The body is a plain box, where the original has a rounded hood and a taller rear counterweight. That accounts for most of the side and top shortfall.
- The driver is a simple figure of boxes, tubes and spheres. Its outline is less accurate than the rest.
- The overhead guard is a solid roof and four posts, without the original's mesh and detail.

The projected picture covers most of that visually, but the silhouettes at the oblique angles still differ. To get the outlines over 0.8, the next step is to round the body and refine the guard and driver against the reference.

The spec is saved beside the model as `work:forklift.spec.json`, so the build can be rerun.
