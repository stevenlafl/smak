I've built `sprites/glow01.spr` and it passes with OK on every check.

**What it is:** a single 64×64 still image, type parallel, format additive, with its origin at the centre. Its only content is one soft round white glow with no tint, so render colour can tint it.

**How it falls off:** brightness at distance r from the centre is `1 / (1 + (r/10px)²)`, which is an inverse-square-like curve. Measured against your description:

```
distance from centre   brightness   description asked for
0 px                   1.00         pure white
3 px                   ~0.92        hot spot ~4-6 px across
10 px                  0.50         mid grey
20 px                  0.20         dim grey
31 px                  0            black (cut off smoothly here)
```

**Edges:** the curve is eased to zero at 31 pixels from the centre (`reach` 0.97 on the -1 to 1 scale). The build measured the border's brightest pixel at exactly 0, so no square outline shows. It has no rays, rings or noise. The palette quantising used 50 colours and changed the image very little (loss 0.0037).

**Placement:** the spec sets it up as an `env_glow`, which the build places with render mode 3 (Glow). If it goes on an `env_sprite` instead, use the additive render mode.

My first build passed `colour` on a 0–255 scale, but the tool reads colours as 0–1. That built a solid white disc, even though the build still said OK. I caught it in the preview picture and fixed it to `[1, 1, 1]`. The second preview shows the clean radial gradient you described.

Final spec:
```json
{"spec":"smak.sprite/1","sprites":[{"name":"sprites/glow01.spr","class":"glow","use":"env_glow","size":[64,64],"frames":1,"type":"parallel","format":"additive","origin":"centre","layers":[{"kind":"glow","falloff":"power","core":0.3125,"power":2,"reach":0.97,"colour":[1,1,1],"gain":1}]}]}
```

The sprite is at `work:sprites/glow01.spr`, with `-sheet.png` and `-animated.png` previews beside it.
