`battery.mdl` is built and the build says OK. It's in the server's work folder, with the spec saved next to it as `battery.spec.json`.

**How I made it:** the shape is carved from the outlines in your six side views and four angled views. All ten pictures are then projected onto it as its texture, with the kit's own lighting and dirt turned off so the original's shading isn't painted on twice.

**Results:**
- **Size:** 10.3 front to back, 10.3 side to side, 18.4 high, standing on the floor.
- **Outline:** it matches the original 0.995 to 1.0 from the four sides, the top and the four angled cameras.
- **Below:** this one scores 0.576 because the original's bottom is open: you see the backdrop through it, with the yellow tab and a teal sliver showing inside. I kept the bottom closed, since an open one counts as a hole in the model. Instead I painted the middle of it the backdrop colour, and the projection carries the tab and sliver over, so it looks almost the same as the original from below.
- **Surface markings:** the teal screens, the white corner panels, the red lights, the yellow and grey hazard band and the octagonal top plate all line up when I compare my renders side by side with your angled views.
- **Texture:** I raised it to 512 x 512 because at 256 it looked blocky next to the original.

**What doesn't match fully:**
- The hex nut and the angled striped tab on top are carved, so they're softer-edged than the original's. They're right in outline and colour.
- It's 150 triangles, and the build warns about that, since three quarters of Half-Life's props this size have under 88. I went that high for the outline accuracy. It's still well within the engine's limits.
