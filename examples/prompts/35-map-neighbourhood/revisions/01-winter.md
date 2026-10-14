# 35 / 01 "Now make it winter" (a change request)

## The prompt (46 words)

> Love it. Now give me the same neighbourhood in winter: snow on all the lawns, the park and the building site, snow on the roofs, the trees bare with snow on their branches, and a low cold winter sun. Keep everything else exactly where it is.

## The rubric (written before the spec)

| # | Item | Must | Score |
| --- | --- | --- | --- |
| 1 | Snow on every lawn, the park's grass and the site's dirt; snow on every pitched roof | yes | 2 |
| 2 | Every tree bare with snow on its branches | yes | 2 |
| 3 | A low, cold sun | no | 2 |
| 4 | Nothing moved, added or taken away (the change report) | yes | 2 |
| 5 | Still compiles, lit, every place reached | yes | 2 |

**Score: 10 of 10 (100%), judged from the pictures and the change report. Passes.**

## How the request became the change

- `replace: { textures: { lawn, roof, site_dirt }, models: { tree_summer: "tree_winter" } }`, a thing the
  kit learnt for this request: every texture and theme word of that name, in the map and in every module
  it takes in (`ranch_lawn`, `park_lawn`, the six roofs), and every prop of that model, swapped; the sun
  lowered and cooled. The report: `replaced lawn: ranch_lawn, colonial_lawn, bungalow_lawn, park_lawn`,
  the model swapped for 15 props, and `things swapped where they stood` with the other 214 rooms and things
  where they were (the kit learnt to tell a swap in place from a thing taken away and another added).
