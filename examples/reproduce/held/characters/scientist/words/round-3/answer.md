I built `scientist.mdl` on Gordon's skeleton with `"floor": 0`. The build says OK and the engine-limit check reports "fit for goldsrc". I had no picture of the original, only your description, so every colour, marking and proportion is my reading of that text, and nothing was checked against the original's pictures.

**Files (in the work folder)**
- `work:scientist.mdl`: the model
- `work:scientist.spec.json`: the spec it was built from
- `work:scientist-sheet.png`: six-view sheet
- `headcheck.mdl`, `headcheck.spec.json`, `headcheck-sheet.png`: a scratch model I used to look at the head alone. I have no delete tool here, so please remove them.

**Checked against your numbers**

| Thing | Your description | Model |
| --- | --- | --- |
| Height | about 68 | 67.9 |
| Width across the hands | 21.7 | 22.0 |
| Length front to back | 33.3 (from a stride) | 18.3 standing |
| Head, all three sides | about 8.5 tall | 8.6 long, 8.2 wide, 9.5 tall |
| Hip line | just under 34 | hip joint at about 39 |

**What's in it**
- Bald, elongated head with pale pinkish skin, a grey-white band of hair at ear level, black-framed glasses, a long straight nose, a thin mouth and slightly prominent ears.
- White lab coat to mid-thigh with a slight flare, and a blue shirt and red-and-black tie down the centre. Black belt with a grey buckle, off-white trousers, dark reddish-brown shoes.
- Arms hang straight with fists at mid-thigh, about 22 units apart at the fists.
- Skeleton's own animations kept. Its run, walk, crouch and jump passed the report's checks for parts coming apart.

**Where it differs from the original**
- **Hip line and leg length:** Gordon's hip joint sits higher than your hip line. I can't move bones, so the legs are his and the hip line is set by the coat and trousers.
- **Coat front:** the coat is closed. Painted lapel edges and the shirt suggest the open front, but a real open front needs a split coat.
- **Stoop:** the spine is Gordon's and nearly upright. Only the head juts forward.
- **Tie:** the hazard pattern gives red and black, not navy and red.
- **Running:** the coat tails don't flap as described. I didn't fit the run to pictures, since I had none.
- **Eyes:** no sunken eye sockets are modelled.
- **Triangles:** 1,026, which the report flags as more than twice Gordon's body (362). It is a warning, not a failure.

**Choices I made**
- Used `C:\...\Half-Life\valve\models\player\gordon\gordon.mdl`, found through the Steam install, since the models folder is not set up.
- Coat, trousers and shirt use matte paint, not cloth, to avoid the blotchy look the cloth gave.
