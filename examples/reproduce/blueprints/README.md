# Houses from their drawings: inputs and keys

The inputs and answer keys of the test in `../rubric.md`, "Houses from their drawings": three houses of the
Historic American Buildings Survey (HABS) at the Library of Congress (LOC), chosen in
`research/blueprint-sources.md`.

| Folder | House | Storeys in the key |
| --- | --- | --- |
| `moulton/` | John Moulton Homestead, House, HABS WY-152-A (https://www.loc.gov/item/wy0573/) | basement, main, second |
| `kaupo/` | Kaupo School Teacher's Cottage, HABS HI-614 (https://www.loc.gov/item/hi1133/) | main, shed |
| `grindle/` | Samuel P. Grindle House, HABS ME-229 (https://www.loc.gov/item/me0420/) | basement, first, second, attic |

## What is here

- `fetch.mjs` downloads each house's plan, elevation and section sheets (TIFF) and six photographs (the
  1024 px JPEG) into `<house>/input/`, and makes of them what the maker and the judge are given:
  `sheet-<n>.png` (each sheet 4000 px wide), `plan-<storey>.png` (each floor plan cut from its sheet,
  about 2000 px on its long side), `photo-<id>.png`, and `manifest.json` (each file's caption, URL and size).
- `tiff.mjs` reads the TIFFs (strips; uncompressed, PackBits or LZW; 1 bit, 8 bit grey, 8 bit RGB) and
  writes grey or RGB PNGs that the kit's `unpng` reads. The HABS sheets are uncompressed, single strip:
  1 bit for Moulton and Grindle, 8 bit grey for Kaupo.
- `<house>/key.json` is the answer key, written from the drawings before anything was built: storeys with
  floor and ceiling heights, every room's outline, every door, opening without a door, window and stair,
  in feet (`foot`: 12 units) from the house's south-west corner, x east and y north (each key's `origin`
  and `compass` say exactly where that is on its sheets). `plans` gives, for each storey, the TIFF it is
  drawn on, the pixel of the origin, pixels a foot and which way x and y run, so a harness can lay a map's
  plan on the drawing. `notes` says what is written on the sheets, what was measured off them and what was
  estimated; doors and openings marked `uncertain` are readings a judge may leave out.
- `draw-key.mjs` draws a key over its sheets, one storey beside the next (`<house>/input/key.png`): rooms
  tinted and named, doors red (orange when uncertain), openings green, windows blue, stairs as arrows.
  That picture is how each key was checked against the drawings.

## Running it

```
node examples/reproduce/blueprints/fetch.mjs                 # all three houses
node examples/reproduce/blueprints/fetch.mjs kaupo           # one
node examples/reproduce/blueprints/fetch.mjs --refresh       # read the item JSON again
node examples/reproduce/blueprints/fetch.mjs --remake        # make the PNGs again
node examples/reproduce/blueprints/draw-key.mjs grindle/key.json [--scale 24] [-o out.png]
```

Node 18 or later, nothing else. A first run fetches about 0.8 GB (the Kaupo sheets are 138 MB each) and took
about 2 minutes here; a second run sends only HEAD requests and skips every file whose size matches the
server's `Content-Length`. It keeps to LOC's limits (20 JSON requests a minute, 150 file requests a minute:
https://www.loc.gov/apis/json-and-yaml/working-within-limits/), sends a curl user agent, times out a stalled
transfer after a minute and tries again, and pauses (one minute, doubling) on a 429 or a CAPTCHA page. Going
over the limits blocks the address for an hour.

## Credit and rights

The drawings and photographs are public domain, made by or for the National Park Service ("No known
restrictions on images made by the U.S. Government"). LOC asks for a credit line:

> Historic American Buildings Survey, National Park Service; Library of Congress, Prints & Photographs
> Division, HABS WY-152-A (Moulton), HABS HI-614 (Kaupo), HABS ME-229 (Grindle).

The fetched files and everything made from them are kept out of the repository: `<house>/input/` is
git-ignored. Run `fetch.mjs` to get them.
