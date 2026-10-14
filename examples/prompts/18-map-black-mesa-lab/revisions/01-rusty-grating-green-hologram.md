# 18 / 01 "The rusty grating, and a green hologram" (a change request on textures)

## The prompt (24 words)

> The grating in the corridor looks too clean: use the game's rusty grating instead. And make the hologram
> green, not cyan. Nothing else.

## The rubric (written before the spec)

| # | Item | Must | Score |
| --- | --- | --- | --- |
| 1 | The corridor's floor the game's GRATE_RUST, named, from halflife.wad | yes | 2 |
| 2 | The hologram made again, green, still the gap told | yes | 2 |
| 3 | Only those two materials changed: no room or thing moved (the change report) | yes | 2 |

**Score: 6 of 6 (100%), judged from the pictures built locally. Passes.**

## How the request became the change

- `grating` from a pick to the texture named: `{ texture: "GRATE_RUST" }`; the hologram's `else` given a
  green tone. Report: `grating: GRATE_RUST of halflife.wad, as named`; the hologram still the gap, made;
  `materials changed: grating ...; hologram ...`; `13 rooms and things are where they were`. The views showed
  the corridor's rusty grating and the green hologram on its pedestal.
