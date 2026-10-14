I tuned the glow's spread and it now matches the description, so I'm wrapping up.

I built `sprites/glow01.spr` and the build says OK. It passed every check and lands within the range of Half-Life's own glow sprites.

```json
{"spec":"smak.sprite/1","sprites":[{"name":"sprites/glow01.spr","use":"env_glow","class":"glow",
 "size":[64,64],"frames":1,"type":"parallel","format":"additive","origin":"centre",
 "layers":[{"kind":"glow","radius":1.0,"core":0.3,"colour":[1,1,1],"gain":1}]}]}
```

What the build reports:
- **Size and frames:** 64x64, one frame, no animation.
- **Type and format:** parallel and additive. It's placed as an `env_glow` with render mode 3 (Glow).
- **Colour:** neutral white to grey with no tint, in 57 palette colours. Very little was lost when reducing it to the palette (0.0034).
- **Border:** pure black all the way round (brightest border pixel is 0), so no square outline shows.

In the render it's a clean round blob with a white hot spot in the middle. It fades through grey to a faint haze that goes black just inside the frame edges, with no rings or streaks.

I only checked the falloff by eye on the render; I didn't measure individual pixels. So "mid grey at about 10 pixels" and "black at 30 to 32 pixels" look right but aren't confirmed numbers.

It took three tries to get there:
1. **First try:** colour written as 255,255,255. The spec reads colour on a 0 to 1 scale, so that blew out into a flat white disc.
2. **Second try:** a small core of 0.08. The glow was too tight and too dim.
3. **Third try:** core 0.3 with radius 1.0. This gave the gradual falloff the description asks for.

The files are at `work:sprites/glow01.spr`, with `-sheet.png` and `-animated.png` previews beside it.
