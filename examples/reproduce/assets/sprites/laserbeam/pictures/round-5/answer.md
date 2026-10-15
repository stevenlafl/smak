The sprite is built and the build says OK with no warnings: `work:sprites/laserbeam.spr`, with `-sheet.png` and `-animated.png` beside it.

I couldn't open the original pictures myself. The input folder is blocked to my file reads, and `pictures/facts.txt` and `pictures/frames.png` aren't reachable from my side. So the match rests on the build's measurements of `pictures/frames.png` as the reference, not on my own look at it side by side. Please check the result against the original by eye.

**What it is:** a single-frame beam, 32x64, parallel to the camera, additive (black is clear). I set `use` to `beam` because the name and type point that way. Say if the game uses it as an `env_sprite` instead.

**Final spec:**
```json
{"spec":"smak.sprite/1","sprites":[{"name":"sprites/laserbeam.spr","class":"beam","use":"beam","size":[32,64],"frames":1,"type":"parallel","format":"additive","reference":"pictures/frames.png","layers":[{"kind":"beam","core":0.5,"profile":"flat","shoulder":0.4,"noise":0.2,"colour":[0.8,0.93,1]}]}]}
```

**How it matches the reference's measures:**

| Measure | Reference | Mine |
| --- | --- | --- |
| Mean colour (delta E, 15 or under is near) | — | 11.4 |
| Dark share | 0.02 | 0 |
| Border brightest | 0.914 | 0.855 |
| Border mean | 0.251 | 0.319 |
| Shape, mean share of lit pixels both have (bar 0.8) | — | 0.91 |

**What I tried on the way:** a round beam profile left too much of the frame dark (0.49 against 0.02) and the shape overlap at 0.42. A flat profile with a wider core fixed the shape. The colour went from a saturated blue (delta E 40.5) to a pale cyan-white, which brought it to 11.4.

**Not settled:** the colour is tuned to the reference's measured numbers, not a sampled value. I never saw the reference's actual RGB.
