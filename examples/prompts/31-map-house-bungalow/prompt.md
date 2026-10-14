# 31 A bungalow with a garage (map module; one open-plan room, a garage door that opens, a car)

## The prompt (190 words)

> The third house: a low yellow bungalow with a shallow red roof and wide eaves, a garage on its right with
> a big door that lifts, and the driveway from the street to it. The front door opens into one big room, a
> living room and kitchen together: a sofa facing a TV, a coffee table, an armchair, a plant by the door,
> and along the right wall the fridge, stove and sink, with a table in front. Behind it a bedroom (bed,
> dresser, two windows) and a beige bathroom with a toilet and a tub. A door from the big room into the
> garage, where a red car is parked, and behind the garage a workshop with a concrete floor, a shelf and a
> table, a side window and a back door. Front windows either side of the door. Two trees, two bushes by the
> door and a swing set at the back. Lit, every room walkable from the street, and the garage door must open
> when you walk up to it. Show it from the street and the car in the garage.

## The rubric (written before the spec)

| # | Item | Must | Score |
| --- | --- | --- | --- |
| 1 | A low yellow bungalow, a shallow red roof with wide eaves; unlike cases 29 and 30 | yes | 2 |
| 2 | A garage with a wide door that lifts (a door entity), the driveway to it, a car inside | yes | 2 |
| 3 | One big living room and kitchen as asked, front windows either side of the door | yes | 2 |
| 4 | A bedroom with two windows, a beige bathroom; a workshop with a shelf, a table, a window and a back door | yes | 2 |
| 5 | Two trees, two bushes by the door, a swing set | no | 2 |
| 6 | Compiles, lit, every room reached on foot from the street, nothing in a wall | yes | 2 |

**Score: 12 of 12 (100%), judged from the pictures. Passes.**

## How the prompt became the spec

- One storey, the big room standing in the lot, the garage against it with concrete inside, the bedroom,
  the bath and a workshop in a row behind. The garage door is a link of kind `door` 192 wide to the lot: a
  door entity that lifts when walked up to (`door: { speed, wait }`).
- Yellow siding, a 22 degree red roof with 20 of eaves. The car is case 28's sedan.

## Iterations

1. A tree and the swing set stood inside the house: caught by the check case 29 brought, moved out behind it.
