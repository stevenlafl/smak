# From a picture or photo to a GoldSrc prop: experiments

Experiments of 2026-10-14, following `local-3d-generators.md` (which set up the local generators). The question:
can a person's text, or a real photo of a specific thing, become a textured prop within GoldSrc's budget,
better than the spec's own primitives where those fall short (case 28's sedan: 24 boxes, 576 triangles)?
The methods and papers behind the next steps are in `3d-fidelity-methods.md` and `improvements-research.md`.

Everything runs under `/media/Data3/Packages/local-3d/` (its README is `local-3d-generators.md`, section 2);
the photos and their sources are in `inputs/car-photo/SOURCES.txt`. Nothing in the kit changed for these.

## The steps tried

| Step | Script (in `local-3d/scripts/`) | What it does |
| --- | --- | --- |
| Picture from text | `sd_turbo_images.py` | SD-Turbo, four pictures a prompt, 1 s each |
| Subject from a photo | inside `hunyuan_mini_shape.py` (rembg's default, which in rembg 2.0.85 is BRIA RMBG-2.0: free for non-commercial use only; BiRefNet, MIT, from here on) | cuts the subject out of a cluttered photo |
| Shape | `hunyuan_mini_shape.py` | Hunyuan3D-2mini, 50 steps: about 16 s, about 300,000 triangles |
| Reduction | `reduce_compare.py` | several ways to the budget, measured against the dense shape |
| Texture from photos, unwrapped | `photo_texture.py` | xatlas unwrap; each texel's point projected into every photo that sees it |
| Texture from photos, photo charts | `photo_charts.py` | each triangle's texture coordinates taken from the photo that sees it best: the photos are the charts |
| Visibility | `visible_faces.py` | which faces can be seen from outside at all |

## Results

### Shape from text and from photos

A text prompt ("a red four door sedan car, 1990s family car") gave four clean pictures; the shape from one is a
real sedan: roofline, glasshouse, bumpers, wheel arches. Two real Wikimedia Commons photos of Volvo 240s, with
other cars and a tree beside them, were cut out cleanly by BRIA RMBG-2.0 (the neighbours and the tree trunk went), and
gave a sedan and an estate of the right shape. The underside comes out as fins and blobs (the photos do not
show it).

### Reduction to the budget (the sedan from text, 296,376 triangles, to 1,500; units at a 116-unit length)

| Method | Mean error | RMS error | Largest | Non-manifold edges |
| --- | --- | --- | --- | --- |
| fast-simplification (what `to_prop.py` uses) | 0.24 | 0.33 | 1.69 | 28 |
| quadric edge collapse, topology kept (pymeshlab) | 0.26 | 0.36 | 2.34 | 0 |
| the same in halves (each pass at most halves) | 0.18 | 0.24 | 2.03 | 0 |
| isotropic remesh, then quadric in halves | 0.17 | 0.25 | 1.86 | 0 |

Errors are Hausdorff distances both ways, 40,000 samples. Reducing in halves cuts the mean error by a quarter
and leaves no edge that SMAK's soundness check faults; at 1,500 triangles its wheels stay round where the
method in use tears them, and it looks better than that method at 3,000. 1,500 triangles of such a shape need
about 800 points: two submodels of GoldSrc (the conversion shares them out by itself).

### Texture from the photos (the estate, two photos of the same car: front left and rear left)

The camera of each photo is found by matching the mesh's silhouette to the photo's cut-out (azimuth,
elevation and field of view searched, the silhouette fitted to the cut-out's box): overlap 0.955 for the sedan
photo, 0.894 and 0.893 for the two estate photos.

| | Unwrapped (`photo_texture.py`) | Photo charts (`photo_charts.py`) |
| --- | --- | --- |
| Charts | hundreds, many of a few texels | 3: one slice of each photo and one square for the unseen |
| Photo pixels | resampled through the unwrap | cut straight from the photo (at 0.43 of its size here) |
| Surface from photos | about 22% of texels seen, 2 to 12% more from the mirror | 35% of the area, a tenth of it through the mirror |
| What reads | the front, plate and lights; side panels broken up | front, back and left side as that car; the right side partly |

The faces' texture coordinates are where their corners fall in the photo, so a photo's region is one
undistorted chart; a face no photo sees squarely goes to an xatlas unwrap in a corner, in the photo's median
colour. A face on the far side of a symmetric thing takes its mirror's place in the photo (pixels shared, as
games of the time did), with a looser hidden-surface test, since a generated shape is never exactly symmetric.

Not the cause of the low coverage, checked: the dense mesh is not hollow (98% of its faces are visible from
outside, 100 directions); the hidden-surface test's tolerance (0.01 to 0.08 of the size changes little); the
mirror's axis (the width, right).

## What is still wrong

1. **The roof and underside**: no photo sees them; one median colour stands in.
2. **Reflections baked in**: trees and sky on the bonnet and glass.
3. **The underside's fins**: the generator's guess where no photo looks.
4. **Small charts in an unwrap**: the generated car has 32 tunnels (genus 32) that topology-kept reduction keeps,
   and 27% of its edges fold over 60 degrees; xatlas's options do not help (`3d-fidelity-methods.md`, 6.1).

## The plan

Decided by a benchmark, not by one car (Steven, 2026-10-14): every method stays until each test object prefers
another. The objects: the car (two photos), a barrel, a lamp post, a chair, a statue, a fire hydrant, a
character and a rock, each from text and, where a free photo exists, from real photos.

| Stage | Options compared | Measure (`3d-fidelity-methods.md`, 7) |
| --- | --- | --- |
| Cut-out | BRIA RMBG-2.0 (as run), BiRefNet (MIT), Grounding DINO or OWLv2 then SAM 2 | mask IoU against hand masks, edge F-score |
| Generator | Hunyuan3D-2mini, TripoSG, Hunyuan3D-2.1 shape, SPAR3D | silhouette IoU from the input view, genus, folds after reduction, time, memory |
| Reduction | fast-simplification, quadric in halves (pymeshlab, GPL-3.0), a quadric reducer in Node with crease and silhouette weights, each with and without closing the tunnels first | two-way Hausdorff, silhouette IoU over 20 views, bad edges, fits one submodel |
| Charts | xatlas, photo charts (this experiment), view-based charts with small ones merged, mirrored charts | chart count, texel use, stretch |
| Texture | per-texel blend, best photo per face with seams levelled, symmetry fill, fill across the surface for the unseen | LPIPS and SSIM of a render from each photo's camera against the photo, inside its cut-out |
| Bake | none, ambient occlusion, plus cavity | image error of the textured low model, unlit, against the dense mesh lit |

What becomes part of the kit (Node, no dependencies) is what wins: by the report's order, the reducer, a normals
codebook (1,500 triangles hit the 2,048-normal limit before the point limit), the bake, the camera fit, the
projection and the charts. The generators and cut-outs stay an optional Python step outside it.
