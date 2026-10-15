I built the guard as `work:barney.mdl`, with its spec at `work:barney.spec.json`. The final build says OK, and the GoldSrc check reports "fit for goldsrc".

**What it is**

- **Skeleton:** Gordon's, read from the Half-Life install at `steamapps/common/Half-Life/valve/models/player/gordon/gordon.mdl`. The `models` folder the kit uses is empty, so I found the file by its path. It keeps all 77 of Gordon's animations.
- **Height:** 75 units, feet at the origin (`floor: 0`).
- **Triangles:** 664. The limit is 724 (twice the base body's 362), so this is under it.
- **Parts:** a violet-blue helmet with a band and dark ear pads, pale peach skin with painted brows and eyes, dark brown sideburns, a periwinkle shirt with a collar and a dark tie, a black vest with panels, an orange emblem on the wearer's left chest, a grey ID badge on the right, and "SECURITY" in olive-yellow on the back. It also has a belt, a black holster on the right hip, violet-blue trousers, black boots and fists. Arms hang slightly out with the elbows bent.

**Choices I made**

- **Pose:** Gordon's first frame holds a gun forward with one foot ahead. I lowered the right forearm to hang, and made both legs straight and even.
- **Trousers and boots:** the base's hips sit only about 7 units apart, so I slimmed the thighs and boots to keep the legs apart.
- **Shapes:** the vest, boots, fists and ear pads are boxes, to keep the triangle count down.

**Limits**

- **No side-by-side check:** you didn't give me any pictures of the original, so I could only compare against your written description. The colours are my reading of the words.
- **Motion:** the walk and run are Gordon's own. Matching the stride you described would need a strip of pictures to fit, and there were none.
- **Detail:** the emblem reads as a plain orange square at this size. The face is small, and the helmet has six sides.
- **Game test:** I haven't run it in the game.
