# Source houses for the blueprint map test

Research for SMAK, 2026-10-14. The test: an agent gets a real house's measured floor plans and photographs of
the same house, and builds it as a playable map (rooms as boxes, doors as door entities, windows as windows,
stairs between storeys; `docs/SPEC.md`, "A map"). This file names three houses from the Historic American
Buildings Survey (HABS) at the Library of Congress (LOC) that fit, the URLs of their sheets and photographs,
and how a script fetches them.

Abbreviations: HABS (Historic American Buildings Survey), LOC (Library of Congress), IIIF (International Image
Interoperability Framework, LOC's image server), JSON (the API's response format), TIFF (the master scans).

No image was saved into the repository. Every URL below was fetched with a HEAD request on 2026-10-14 and
answered 200; sizes are the `Content-Length` served then.

## The three houses

| | Moulton house (WY) | Kaupo teacher's cottage (HI) | Grindle house (ME) |
| --- | --- | --- | --- |
| Survey | HABS WY-152-A | HABS HI-614 | HABS ME-229 |
| Item | https://www.loc.gov/item/wy0573/ | https://www.loc.gov/item/hi1133/ | https://www.loc.gov/item/me0420/ |
| Kind | Homestead farmhouse, 1.5 storeys (bedrooms in the roof) and a basement | Plantation-vernacular cottage, one storey on posts, built 1920 | Town house, two storeys with a kitchen ell, ca. 1850 |
| Storeys planned | Main, second, basement | One | Basement, first, second, attic |
| Overall size (drawing) | 30'-1" wide, 32'-9" deep with the mud room | 28'-0" by 34'-0" main block, shed and lanai outside it | Main block 35'-10" by 28'-8"; 54'-2" deep with the ell |
| Scale | 1/4" = 1'-0" (1:48), bar in feet and metres | 3/8" = 1'-0", bar in feet and metres | 1/4" = 1'-0", bar in feet and metres |
| Dimensions written | Every room (e.g. living room 16'-5" x 12'-5"), strings of wall and opening widths | Every room (living 16' x 18', kitchen 7' x 16', bedrooms 11' x 11', bath 7' x 9', lanai 6' x 16'-6") | Strings of opening and wall widths on all sides, room heights by section sheets |
| Photographs | 8 (4 outside, 4 inside) | 13 (8 outside, 5 inside, most with a scale stick) | 15 (5 outside, 10 inside) |
| Sheets | 3 | 5 | 10 |
| Rights (item page) | No known restrictions on images made by the U.S. Government | same | same |

GoldSrc units are about an inch, so a dimension in feet times 12 is units: the Moulton house is about
361 x 393 units, the Kaupo cottage 336 x 408, the Grindle main block 430 x 344.

### Moulton house, HABS WY-152-A

John Moulton Homestead, House, Mormon Row, Kelly vicinity, Grand Teton National Park, Teton County, WY.
Drawn by Jeff Farnum, photographs by Arnold Thallheimer.

The plan: a near-square block with a mud room added on the west (the sheets are drawn with west at the top; the elevations say west). Main floor: living room 16'-5" x 12'-5",
kitchen 12'-8" x 10'-9", two bedrooms (10'-5" x 11'-9", 10'-8" x 7'-1"), a small room 7'-1" x 5'-0", mud room
14'-8" x 7'-5", a central lobby and closets: 6 rooms. Second floor: two bedrooms (11'-5" x 12'-7",
11'-5" x 11'-7") off a hall, with inaccessible eaves on either side. One straight stair up from the lobby,
one down to the basement. About 11 windows and 3 outside doors (front porch, mud room, side steps) on the main
floor, about 8 inner doors; 2 to 3 windows upstairs. The simplest of the three: box rooms, one stair, all
dimensions written.

| Sheet | TIFF (bytes) | 1024 px JPEG (bytes) |
| --- | --- | --- |
| 1. Main and second floor plans | [00001a.tif](https://tile.loc.gov/storage-services/master/pnp/habshaer/wy/wy0500/wy0573/sheet/00001a.tif) 17,597,886 | [00001v.jpg](https://tile.loc.gov/storage-services/service/pnp/habshaer/wy/wy0500/wy0573/sheet/00001v.jpg) 92,723 |
| 2. Elevations | [00002a.tif](https://tile.loc.gov/storage-services/master/pnp/habshaer/wy/wy0500/wy0573/sheet/00002a.tif) 17,559,358 | [00002v.jpg](https://tile.loc.gov/storage-services/service/pnp/habshaer/wy/wy0500/wy0573/sheet/00002v.jpg) 133,563 |
| 3. Basement plan and section | [00003a.tif](https://tile.loc.gov/storage-services/master/pnp/habshaer/wy/wy0500/wy0573/sheet/00003a.tif) 17,588,254 | [00003v.jpg](https://tile.loc.gov/storage-services/service/pnp/habshaer/wy/wy0500/wy0573/sheet/00003v.jpg) 66,915 |

The sheet TIFFs are 1-bit scans of 14610 x 9632 pixels.

| Photograph | TIFF (bytes) | 1024 px JPEG (bytes) |
| --- | --- | --- |
| 1. North side, looking south | [580694pu.tif](https://tile.loc.gov/storage-services/master/pnp/habshaer/wy/wy0500/wy0573/photos/580694pu.tif) 40,928,104 | [580694pv.jpg](https://tile.loc.gov/storage-services/service/pnp/habshaer/wy/wy0500/wy0573/photos/580694pv.jpg) 388,039 |
| 2. West side, looking east | [580695pu.tif](https://tile.loc.gov/storage-services/master/pnp/habshaer/wy/wy0500/wy0573/photos/580695pu.tif) 41,193,284 | [580695pv.jpg](https://tile.loc.gov/storage-services/service/pnp/habshaer/wy/wy0500/wy0573/photos/580695pv.jpg) 379,008 |
| 3. South side, looking north | [580696pu.tif](https://tile.loc.gov/storage-services/master/pnp/habshaer/wy/wy0500/wy0573/photos/580696pu.tif) 40,206,178 | [580696pv.jpg](https://tile.loc.gov/storage-services/service/pnp/habshaer/wy/wy0500/wy0573/photos/580696pv.jpg) 389,601 |
| 5. Interior, kitchen | [580698pu.tif](https://tile.loc.gov/storage-services/master/pnp/habshaer/wy/wy0500/wy0573/photos/580698pu.tif) 40,579,060 | [580698pv.jpg](https://tile.loc.gov/storage-services/service/pnp/habshaer/wy/wy0500/wy0573/photos/580698pv.jpg) 238,717 |
| 7. Interior, front bedroom | [580700pu.tif](https://tile.loc.gov/storage-services/master/pnp/habshaer/wy/wy0500/wy0573/photos/580700pu.tif) 40,275,712 | [580700pv.jpg](https://tile.loc.gov/storage-services/service/pnp/habshaer/wy/wy0500/wy0573/photos/580700pv.jpg) 249,624 |
| 8. Second floor hallway, stairwell, bedroom | [580701pu.tif](https://tile.loc.gov/storage-services/master/pnp/habshaer/wy/wy0500/wy0573/photos/580701pu.tif) 40,466,822 | [580701pv.jpg](https://tile.loc.gov/storage-services/service/pnp/habshaer/wy/wy0500/wy0573/photos/580701pv.jpg) 242,424 |

Not listed: photo 4 (east side) and photo 6 (interior, unnamed room). Data pages:
https://tile.loc.gov/storage-services/master/pnp/habshaer/wy/wy0500/wy0573/data/wy0573data.pdf

### Kaupo School Teacher's Cottage, HABS HI-614

244 Piilani Highway, Kaupo, Maui County, HI. Drawn by Katharine Stephens, Sarah West and Rafael Lee.

The plan: one storey, a rectangle with a lanai (porch) cut into the front corner and a shed added at the back.
Living room 16' x 18', kitchen 7' x 16', two bedrooms 11' x 11', bathroom 7' x 9', two closets, lanai
6' x 16'-6", shed: 7 rooms plus closets, no hall (rooms open into each other). About 20 double-hung windows,
2 outside doors with steps (lanai, kitchen), about 7 inner doors. No inner stair; the house stands on posts,
so steps lead up to both outside doors. The photographs carry a scale stick, which gives the agent a second
check of size. The plan is the one storey test of the three.

| Sheet | TIFF (bytes) | 1024 px JPEG (bytes) |
| --- | --- | --- |
| 2. Floor plan | [00002a.tif](https://tile.loc.gov/storage-services/master/pnp/habshaer/hi/hi1100/hi1133/sheet/00002a.tif) 138,246,929 | [00002v.jpg](https://tile.loc.gov/storage-services/service/pnp/habshaer/hi/hi1100/hi1133/sheet/00002v.jpg) 96,900 |
| 3. East and south elevations | [00003a.tif](https://tile.loc.gov/storage-services/master/pnp/habshaer/hi/hi1100/hi1133/sheet/00003a.tif) 138,246,929 | [00003v.jpg](https://tile.loc.gov/storage-services/service/pnp/habshaer/hi/hi1100/hi1133/sheet/00003v.jpg) 101,412 |
| 4. West and north elevations | [00004a.tif](https://tile.loc.gov/storage-services/master/pnp/habshaer/hi/hi1100/hi1133/sheet/00004a.tif) 138,246,929 | [00004v.jpg](https://tile.loc.gov/storage-services/service/pnp/habshaer/hi/hi1100/hi1133/sheet/00004v.jpg) 97,626 |
| 5. Sections | [00005a.tif](https://tile.loc.gov/storage-services/master/pnp/habshaer/hi/hi1100/hi1133/sheet/00005a.tif) 138,246,929 | [00005v.jpg](https://tile.loc.gov/storage-services/service/pnp/habshaer/hi/hi1100/hi1133/sheet/00005v.jpg) 100,845 |

The sheet TIFFs are 8-bit grey, 14400 x 9600 pixels, 138 MB each: a fetch took 23 s. Sheet 1 is the title
and site plan.

| Photograph | TIFF (bytes) | 1024 px JPEG (bytes) |
| --- | --- | --- |
| 1. Northeast (front) facade | [392486pu.tif](https://tile.loc.gov/storage-services/master/pnp/habshaer/hi/hi1100/hi1133/photos/392486pu.tif) 84,285,406 | [392486pv.jpg](https://tile.loc.gov/storage-services/service/pnp/habshaer/hi/hi1100/hi1133/photos/392486pv.jpg) 328,368 |
| 5. Southwest (rear) facade | [392490pu.tif](https://tile.loc.gov/storage-services/master/pnp/habshaer/hi/hi1100/hi1133/photos/392490pu.tif) 84,285,406 | [392490pv.jpg](https://tile.loc.gov/storage-services/service/pnp/habshaer/hi/hi1100/hi1133/photos/392490pv.jpg) 417,752 |
| 9. Living room, looking east | [392494pu.tif](https://tile.loc.gov/storage-services/master/pnp/habshaer/hi/hi1100/hi1133/photos/392494pu.tif) 84,285,406 | [392494pv.jpg](https://tile.loc.gov/storage-services/service/pnp/habshaer/hi/hi1100/hi1133/photos/392494pv.jpg) 297,566 |
| 10. Front bedroom, looking north | [392495pu.tif](https://tile.loc.gov/storage-services/master/pnp/habshaer/hi/hi1100/hi1133/photos/392495pu.tif) 84,285,406 | [392495pv.jpg](https://tile.loc.gov/storage-services/service/pnp/habshaer/hi/hi1100/hi1133/photos/392495pv.jpg) 276,393 |
| 11. Kitchen, looking south | [392496pu.tif](https://tile.loc.gov/storage-services/master/pnp/habshaer/hi/hi1100/hi1133/photos/392496pu.tif) 84,285,406 | [392496pv.jpg](https://tile.loc.gov/storage-services/service/pnp/habshaer/hi/hi1100/hi1133/photos/392496pv.jpg) 273,003 |
| 12. Rear bedroom, looking east | [392497pu.tif](https://tile.loc.gov/storage-services/master/pnp/habshaer/hi/hi1100/hi1133/photos/392497pu.tif) 84,285,406 | [392497pv.jpg](https://tile.loc.gov/storage-services/service/pnp/habshaer/hi/hi1100/hi1133/photos/392497pv.jpg) 252,631 |

Not listed: photos 2 to 4 and 6 to 8 (the other facades and corners) and 13 (bathroom). Data pages:
https://tile.loc.gov/storage-services/master/pnp/habshaer/hi/hi1100/hi1133/data/hi1133data.pdf

### Samuel P. Grindle House, HABS ME-229

13 School Street, Castine, Hancock County, ME. Drawn by Melanie T. Smith, Sutherland Conservation and
Consulting.

The plan: a five-bay centre-hall house with a one-storey kitchen ell behind and a deck beside the ell. First
floor: west parlor, east parlor (with a canted bay window), back parlor, dining room, kitchen, two pantries,
a back entry, the front hall and a closet: 9 rooms and the hall. Second floor: four chambers and a bath round a
centre hall; the ell's roof is an attic (206). Main stair in the front hall, a back stair (110) from the hall
to the second floor and the basement. About 16 windows and 4 outside doors on the first floor, about
12 inner doors; about 12 windows upstairs. Two full storeys, 12 principal rooms counting the bath and
pantries: at the top of the asked range, and the only one with two stairs and a non-rectangular room (the
bay). It has the most interior photographs.

| Sheet | TIFF (bytes) | 1024 px JPEG (bytes) |
| --- | --- | --- |
| 2. First floor plan and basement plan | [00002a.tif](https://tile.loc.gov/storage-services/master/pnp/habshaer/me/me0400/me0420/sheet/00002a.tif) 17,318,622 | [00002v.jpg](https://tile.loc.gov/storage-services/service/pnp/habshaer/me/me0400/me0420/sheet/00002v.jpg) 165,601 |
| 3. Attic floor plan and second floor plan | [00003a.tif](https://tile.loc.gov/storage-services/master/pnp/habshaer/me/me0400/me0420/sheet/00003a.tif) 17,145,438 | [00003v.jpg](https://tile.loc.gov/storage-services/service/pnp/habshaer/me/me0400/me0420/sheet/00003v.jpg) 112,449 |
| 4. South and west elevations | [00004a.tif](https://tile.loc.gov/storage-services/master/pnp/habshaer/me/me0400/me0420/sheet/00004a.tif) 16,856,798 | [00004v.jpg](https://tile.loc.gov/storage-services/service/pnp/habshaer/me/me0400/me0420/sheet/00004v.jpg) 105,467 |
| 5. North and east elevations | [00005a.tif](https://tile.loc.gov/storage-services/master/pnp/habshaer/me/me0400/me0420/sheet/00005a.tif) 16,914,526 | [00005v.jpg](https://tile.loc.gov/storage-services/service/pnp/habshaer/me/me0400/me0420/sheet/00005v.jpg) 112,364 |

The sheet TIFFs are 1-bit, 14427 x 9600 pixels. Sheet 1 is the site plan; sheets 6 to 10 are wall elevations
of the rooms with moulding profiles, useful for ceiling heights and door and window sizes.

| Photograph | TIFF (bytes) | 1024 px JPEG (bytes) |
| --- | --- | --- |
| Front elevation, five bays | [578527pu.tif](https://tile.loc.gov/storage-services/master/pnp/habshaer/me/me0400/me0420/photos/578527pu.tif) 39,724,592 | [578527pv.jpg](https://tile.loc.gov/storage-services/service/pnp/habshaer/me/me0400/me0420/photos/578527pv.jpg) 367,054 |
| Overall from the north, kitchen ell | [578529pu.tif](https://tile.loc.gov/storage-services/master/pnp/habshaer/me/me0400/me0420/photos/578529pu.tif) 39,873,356 | [578529pv.jpg](https://tile.loc.gov/storage-services/service/pnp/habshaer/me/me0400/me0420/photos/578529pv.jpg) 328,525 |
| Main stair from the entry door | [578532pu.tif](https://tile.loc.gov/storage-services/master/pnp/habshaer/me/me0400/me0420/photos/578532pu.tif) 39,845,916 | [578532pv.jpg](https://tile.loc.gov/storage-services/service/pnp/habshaer/me/me0400/me0420/photos/578532pv.jpg) 258,755 |
| Right parlor, looking east | [578534pu.tif](https://tile.loc.gov/storage-services/master/pnp/habshaer/me/me0400/me0420/photos/578534pu.tif) 39,989,980 | [578534pv.jpg](https://tile.loc.gov/storage-services/service/pnp/habshaer/me/me0400/me0420/photos/578534pv.jpg) 270,418 |
| From the house into the ell | [578537pu.tif](https://tile.loc.gov/storage-services/master/pnp/habshaer/me/me0400/me0420/photos/578537pu.tif) 39,847,476 | [578537pv.jpg](https://tile.loc.gov/storage-services/service/pnp/habshaer/me/me0400/me0420/photos/578537pv.jpg) 248,965 |
| Typical bedroom, looking east | [578540pu.tif](https://tile.loc.gov/storage-services/master/pnp/habshaer/me/me0400/me0420/photos/578540pu.tif) 40,056,752 | [578540pv.jpg](https://tile.loc.gov/storage-services/service/pnp/habshaer/me/me0400/me0420/photos/578540pv.jpg) 203,771 |

Not listed: 9 more photographs (other views, the entry door, left parlor, back stair, second floor landing,
attic). Data pages: https://tile.loc.gov/storage-services/master/pnp/habshaer/me/me0400/me0420/data/me0420data.pdf
### Others looked at and passed over

| Item | Why not |
| --- | --- |
| Thomas Murphy Homestead house, WY-153-A (wy0579) | Fits, but only 4 photographs; a fallback for the Moulton house |
| Rabi Cottage, LA-197 (la0674) | Good plans of a 1.5 storey Creole cottage, no photographs |
| Fred A. Bemis Farmhouse, CO-88 (co0238) | One storey plan, no photographs |
| William Hoelscher Farmstead house, OH-2343-A (oh1850) | 10 photographs, no drawings |
| George Judy Farm house, WV-282-A (wv0503) | 9 photographs, no drawings |
| Kuntz Shotgun House, KY (ky0015) | 7 photographs and 4 sheets, but a shotgun house is a single row of 3 to 4 rooms; plans not checked |

## Fetching them by script

**The item JSON.** `https://www.loc.gov/item/<id>/?fo=json` returns the item. `item.rights_advisory` holds the
rights line; `item.notes` holds the survey number. `resources` is a list of groups, each with a `caption`
("Photos from Survey HABS ...", "Drawings from Survey ...", "Data Pages ...", "Photo Captions ..."). Each group's
`files` is a list, one entry per image, and each entry is a list of variants:

| Variant | `mimetype` | URL ends | Size |
| --- | --- | --- | --- |
| Master scan | `image/tiff` | `.../master/.../<n>a.tif` (sheet), `<n>pu.tif` (photo) | full resolution; `width` 0 in the JSON |
| Thumbnail | `image/jpg` | `_150px.jpg` | 150 px wide |
| Reference | `image/jpeg` | `r.jpg` | 640 px |
| View | `image/jpeg` | `v.jpg` | 1024 px on the long side |
| Caption | `application/json` | `use: "caption"`, `title` = the caption | |

So for each entry: the caption is the variant with `use == "caption"`, the master is the TIFF, and the largest
JPEG is the one of greatest `width`. Search the collection with
`https://www.loc.gov/collections/historic-american-buildings-landscapes-and-engineering-records/?q=<words>&fo=json&c=<n>`.

What to know, found while doing it:

- **There is no JPEG larger than 1024 px.** At 1024 px a plan's written dimensions cannot be read. The TIFF is
  the only full-size file: 17 MB for a 1-bit sheet, 138 MB for an 8-bit one, 40 to 84 MB for a photograph.
  Fetch the TIFF and scale it locally (ImageMagick: `magick 00002a.tif -resize 4000x plan.png`); a 4000 px
  version keeps every figure legible.
- **The IIIF server is not reliable for these.** `https://tile.loc.gov/image-services/iiif/service:pnp:habshaer:wy:wy0500:wy0573:sheet:00001a/full/full/0/default.jpg`
  gave the full sheet as a 5.5 MB JPEG, but every scaled request (`pct:25`, `2048,`) answered 500, and the
  Kaupo sheets and all the photographs answered 404. Do not depend on it.
- **The JSON's `size` is stale for the 1-bit sheets**: it says 976,152 bytes for the Moulton plan, the server
  sends 17,597,886. Trust `Content-Length`, not the JSON.
- **The API refuses Python's default user agent** (403 with `urllib`); `curl` and any ordinary user agent are
  answered. A search request once hung for minutes with no reply: give every request a timeout and retry.
- **Rate limits** (https://www.loc.gov/apis/json-and-yaml/working-within-limits/, read 2026-10-14): the JSON API
  takes 20 requests a minute; the image services and `/storage-services/` files 150 a minute. Going over blocks
  the address for an hour, and any request during the block restarts the hour. Under heavy load the limits
  drop and the site answers 429 or a CAPTCHA page; the page asks scripts to pause on either. No key is needed.
  A fetch of one house is 1 JSON request and 6 to 12 file requests, well within this; sleep 3 s between JSON
  calls and back off on 429.
- **Terms.** Each item says "No known restrictions on images made by the U.S. Government; images copied from
  other sources may be restricted", pointing to https://www.loc.gov/rr/print/res/114_habs.html. HABS drawings
  and photographs are made by or for the National Park Service, so they are public domain; LOC asks for a
  credit line ("Historic American Buildings Survey, National Park Service" is printed on each sheet). A test
  harness can fetch them at run time and keep them out of the repository, as it does now.

A fetch, for a harness: read the item JSON, pick the entries by caption (`/floor plan/i` among the drawings,
and a chosen list of photograph numbers), download each TIFF to a cache folder outside the repository with a
stored `Content-Length` to skip it the next time, and scale it to the size the agent is given.
