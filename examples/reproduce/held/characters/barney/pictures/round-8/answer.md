The guard is built as `barney.mdl` in the work folder, on Gordon's skeleton with `"floor": 0`. The build reports OK, and the engine check says "fit for goldsrc" at 700 triangles for the body.

**How it's made:** the body is carved from the ten reference views (the six sheet sides and the four angles), so its outline is the original's. It is then painted from those same pictures, which carries over the blue uniform, the black vest, the "SECURITY" lettering, the emblem, the face and the helmet's blue band. Parts the pictures don't see are cloth in the uniform's blue. The carve is placed on the skeleton as Gordon stands in frame 0, so frame 0 is the original's pose. The spec is saved as `work:barney.spec.json`.

**Size against the original:**

```
            original      model
length (x)  22.8         22.7
width (y)   30.2         30.2
height (z)  75.3         75.4
```

**Choices I made that you might want to change:**
- I did not use `pose: { fit: true }`. It turned the legs and arms and made the outlines worse (left view 0.595), and the carve already holds the stance.
- I did not use `symmetric`. Mirroring across y copied the forward foot onto the back foot and removed the stride.
- I did not fit the run to `motion.png`. The skeleton's own run animations are kept, so the run is Gordon's stride with the carved body on top, not the guard's actual run.

**Checks I ran:** the build report and the engine check, plus renders at front-left and from below, set beside the originals. The front-left view matches closely. The remaining gaps:
- One cell in the view from below reads 46, just over the 45 limit, around the boot soles (the mean is 8.3, under the limit of 10). The build still says OK.
- The face is small at this scale and is the least faithful area; I did not compare the head at close range.
- Thin details (fingers and the thinnest parts of the boots) are lost in the carve, and the outline match to the pictures is 0.85 to 0.91 per view.
