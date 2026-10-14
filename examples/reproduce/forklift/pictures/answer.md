I've built `forklift.mdl` in the work folder. The build says OK, and the engine check says "fit for goldsrc".

**What it is:** 916 triangles on one bone, with one 512×512 texture. It measures 186.6 long, 60 wide and 113.4 high, standing on the floor. Every part is built to measurements taken from the reference views:
- **Body:** a white counterweight with the raised grille block, red side skirts with the HAIHAN lettering, the front fenders, a white cowl with a sloped nose, and the black steering shroud and dash.
- **Wheels:** large front wheels on the outside. The rear wheels sit inboard, as they do in the original (the view from below shows this).
- **Mast and forks:** the mast with its top cap and crossbar, the black carriage plate, and the two forks tilted slightly upward.
- **Overhead guard:** a narrow roof grate on vertical rear posts and slanted front posts.
- **Driver:** green overalls, arms reaching to the steering wheel, legs down to the boots on the floor, and a yellow hard hat.

**Colours and markings:** all ten reference pictures are painted onto the shape, so the "2.2" decal, the HAIHAN lettering, the vents, the rear lights and plate, the mast chain and the roof grate come from the original. The hard hat is the one exception. It's plain yellow paint, because the pictures smeared background colour onto its top.

**How the outline matches the pictures** (1.0 would be a perfect overlap):

```
front 0.91   left 0.77   back 0.95   right 0.76   top 0.92   below 0.85
yaw 35: 0.82   yaw -35: 0.80   yaw 145: 0.84   yaw 215: 0.83
```

**What could still be called out:**
- **Left and right side scores:** these are the lowest and come from the thin parts (forks, posts, mast), where being one cell off counts heavily. When I compared the side views at full size they line up closely.
- **The view from below:** the original's underside is open, so you can see the driver from below. Mine is solid, with that view painted on, so it looks right but the outline differs a little.
- **Triangle count:** the build warns that 916 is above most Half-Life props this size (half have under 288). That's a warning, not a fault, and well within the engine's limits. Most of it goes on the wheels and the driver's limbs.

To measure the references more closely, I built four throwaway flat models that just carry the pictures: `refleft.mdl`, `reffront.mdl`, `refback.mdl`, `reftop.mdl` and `refbelow.mdl`. They're still in the work folder, because none of my tools can delete files, so you can remove them by hand.
