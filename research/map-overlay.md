# A map against pictures of it: overlay, PnP, structure from motion

Steven, 2026-10-17: "for a map, do you ever overlay the geometry wireframe onto the image, to get alignment? and
can that be done for multiple images of a room from different angles?", then "You'd find an angle with a camera,
build against that camera, then every shot becomes trying to match it", and "Is there any way to use actual
photogrammetry? We don't have to start from scratch". Built: `src/maps/overlay.mjs` (the edges over a picture, a
camera fitted by them, a face's offset by them), `src/maps/photo.mjs` with `generators/photogrammetry.py` (SIFT
matches to a render of the map, PnP with RANSAC, per-plane shifts, leave-one-plane-out, structure from motion with
pycolmap), and the commands `map-overlay`, `map-shots`, `map-sfm`. docs/MAPS.md, "A map against pictures of it",
is the reference; this page keeps the measurements and what failed.

## How it is measured

Screenshots stand in as views drawn by `drawMap` at known cameras: of Valve's maps (read-only, pictures out of git)
and of rooms of the kit's own (carved, drawn by `drawSource`, or compiled with SDHLT wearing halflife.wad's
textures). Each shot is located from a guess 48 units and 12 degrees off (34 units in x and y). Scripts:
`research/map-overlay/room.mjs` (the kit's carved room, edges only), `valve.mjs` (Valve's maps: edges, PnP, a wall
moved in the edges' reading, structure from motion over a room), `compiled-room.mjs` (a room compiled twice, one
wall 32 off, located shot by shot), `edges.mjs` and `debug-leaveout.mjs` (what the edge detector keeps; one
shot's leave-one-plane-out answer).

## The camera

```
Located from a guess 48 units and 12 degrees off       c1a0 (lab)            c2a5 (canyon)
edges alone (fitCamera), within 2 units                0 of 6 (8 to 115 off) 0 of 6 (78 to 146 off)
PnP, then refined by the edges (first version)         3 of 6
PnP kept as it is                                      5 of 6 (worst 19.5)
  + each leave-one-plane-out camera on its own render  5 of 6 (worst 2.7, one to edges)
  + matched again from the edges' fit when few agree   6 of 6 within 2.7     3 of 6 exact, 3 to edges
```

- On a textured view the edges discriminate weakly: the texture's own lines are edges too. On tworooms' own view a
  step of 45 units cost a third of a pixel of score. On the kit's room drawn in flat colours the edges alone came
  within 24 units and 4 degrees (the box room's step-and-turn trade), with the truth at 1.11 pixels.
- Refining PnP by the edges made it worse (three of six moved off): PnP's camera is kept as it is.
- A score of edges is truncated (6 pixels): a picture leaves out the edge between two faces lit alike, and an
  untruncated score pulled a nudged guess 70 units to where such edges hid.

## A wall built off

- **By the edges** (overlayOf's `faces`): on the kit's flat room a west wall built 32 off was the most off of all
  faces, told as -36. On c1a0 (textured) a wall moved 32 was told with the right move, -32, but ranked ninth of 50:
  texture lines put moves of 54 to 64 on faces that were right. Edges are a weak witness on textured walls.
- **By the features** (featureShifts): on the compiled room, the north wall built 32 off was told as -32 on all
  four shots, the camera exact (0 units), and the room as built told no plane off. Two traps found on the way:
  - most features on the wrong wall draw RANSAC's camera with it (a camera 32 off for a wall 32 off), and a render
    from that camera matches the rest worse, which keeps it there: each camera found without one plane is now
    rendered and matched on its own, and the camera most matches agree with is kept;
  - a wall whose texture is laid from its brush's edge slides its texture with it (the kit's carved rooms lay
    the ceiling and side walls so), so a west wall moved along the way the shots look is the true room seen from
    32 further east: no picture can tell them apart. The test moves the north wall instead.

## Structure from motion

```
Six overlapping shots of one room (stepped 40 units, turned 10 to 15 degrees)
c1a0     6 of 6 placed, ~810 points, eye heights 63.9 to 64.1, camera spacing 7.5 to 13.7% off, 17-18 planes
c2a5     6 of 6 placed, 459 points, eye heights 58.6 to 69.1, spacing 31% off, 6 upright planes
Four shots of one wall (the compiled room)    no floor found to scale by
Six views spread over c1a0 (viewsOf)          no reconstruction: the views do not overlap
```

## Where photogrammetry fails on game pictures

- Few views, and views that do not overlap: structure from motion places nothing.
- Repeated textures: matches agree on a camera a tile off (12 and 18 inliers, 63 and 71 units off); under 30
  inliers PnP is not trusted.
- Flat-lit plain walls: no features; such a wall says nothing of where it is, and the edges are its only witness.
- Textures laid from a brush's edge: a moved wall and a moved camera look alike.

## Learned matching and reconstruction (2026-10-17)

Steven approved them ("sure"). Installed by `generators/install-learned-match.sh` under local-3d: a venv of its
own (PyTorch 2.9.1 on ROCm 6.4, about 15 GB), DISK and LightGlue's weights (50 MB, Apache-2.0), VGGT-1B (5.0 GB
safetensors, CC-BY-NC-4.0: non-commercial; its code under the VGGT Licence). MASt3R was not downloaded.
`research/map-overlay/learned.mjs` measures it; every method stays (SIFT and pycolmap are still the defaults).

```
Located, within 2 units of the true camera     c1a0 (lab)    c2a5 (canyon)   kit room, one repeating texture
near guess (48 units, 12 deg off), SIFT        5 of 6        3 of 6          4 of 4
near guess, LightGlue                          6 of 6        5 of 6          4 of 4
far guess (150 units, 40 deg off), SIFT        2 of 6        3 of 6          3 of 4 (one a tile off: 256)
far guess, LightGlue                           3 of 6        4 of 6          4 of 4
VGGT start (one anchor by PnP) + LightGlue     6 of 6        6 of 6
  VGGT's guesses, before PnP                   0.1 to 5.6    0.5 to 19 units off
```

- LightGlue wins on every set; SIFT never beats it. The repeated texture's tile-off camera is SIFT's.
- VGGT as the start of the shot-by-shot fit, over shots that overlap (six about one room), puts every guess
  within 19 units, and PnP then each within 0.9. Over six views spread across a map that barely overlap, its
  frame meant nothing (guesses 1000 units off): it wants overlapping shots, as structure from motion does.
- A wall built 32 off in the kit's room: told as -32 by all four shots, by either matcher.
- A first run had three of c1a0's shots fall to the edges with LightGlue: out of the card's memory (its
  attention asked 5.9 GB in one block) while another of the measuring runs held VGGT there. It falls to the
  CPU now; the numbers above are with the card free.

```
Structure                     c1a0 room (6)        c2a5 room (6)        four shots of one wall
SfM (pycolmap)                eye 63.9-64.1,       eye 58.6-69.1,       no floor to scale by (once the
                              spacing 7.2-13.7%    spacing 27-31%       process died with no answer)
VGGT-1B                       eye 63.8-64.2,       eye 59.7-68.1,       4 of 4 placed, eye 62-68.5,
                              spacing 12.4%        spacing 40.6%        spacing 5.7%
```

VGGT places the four shots of one wall that structure from motion cannot, and finds more planes (27 against 17
on c1a0, 36 against 5 on c2a5); on c2a5's canyon its spacing is the worse. Its pass takes 1.8 to 15 seconds
(30 with its first load) and peaks at 8.9 GB on the card.

**Slow as built**: each locate starts the learned venv's python and loads its models again, three to five times a
shot (the match again from PnP's camera, each camera found without one plane): 65 to 100 seconds a shot with
LightGlue, against 3 to 5 with SIFT. A worker that keeps them loaded, as the generators' does, is the next step.

## Next

- A kept learned worker (above).
- The maker's loop: `map-shots` after each build, the OFF lines as the critique (measured, as the dressing
  report is), the overlay pictures beside them.
