# 33 A park with courts and a playground (map module; open ground laid out with slabs, lines and props)

## The prompt (150 words)

> A park for the east end of the neighbourhood: a big lawn with dirt paths crossing it, a basketball court
> of dark asphalt with white lines and a hoop at each end facing each other, a green tennis court with its
> white lines and the net across the middle, a playground with a swing set, four benches along the paths,
> eight trees and a few bushes. The entrance is a wide gap from the street on its west side. A player has to
> be able to walk onto both courts and to every bench. Show me the courts and the playground.

## The rubric (written before the spec)

| # | Item | Must | Score |
| --- | --- | --- | --- |
| 1 | A lawn with dirt paths, entered from the street on the west | yes | 2 |
| 2 | A dark basketball court with white lines and two hoops facing each other | yes | 2 |
| 3 | A green tennis court with white lines and the net across its middle | yes | 2 |
| 4 | A swing set, four benches by the paths, eight trees, bushes | no | 2 |
| 5 | Compiles, lit by the sun, the courts and benches reached on foot | yes | 2 |

**Score: 10 of 10 (100%), judged from the pictures. Passes.**

## How the prompt became the spec

- One open room of lawn. The courts and the paths are brush furniture laid on the ground: slabs 2 high (the
  courts) and 1 high (the paths), and the lines slabs half a unit high on the courts. The hoops, the net,
  the swings, the benches, the trees and the bushes are case 28's models.
- Entered from a stretch of street on its west side (`test`), where the neighbourhood's street will meet it.

## Iterations

1. Clean on the first build.
