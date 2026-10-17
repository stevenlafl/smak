The sprite is built and the build says **OK**, with all checks passed. The file is `work:sprites/zerogxplode.spr`, with a contact sheet (`-sheet.png`) and an animated preview (`-animated.png`) beside it.

**What I made**

- 128×128, 16 frames, 15 frames a second, about one second long.
- `type` parallel and `format` additive, as in the original. The report places it as a temp entity in render mode 5 (Additive).
- Two layers, summed:
  - **Fireball core:** an `explosion` layer, coloured with `blast` (white, cream, tan, brown). It starts as a small dim spark, flashes white in the first few frames, and grows.
  - **Lobes:** a `billow` layer of 18 spheres spreading out about 0.7 of the frame, growing and then breaking up (`dissolve` 0.8) as it ages. This is what gives the lumpy, billowing outline.
- It burns from white to tan to brown, then breaks into wisps and is gone by frame 14. Since it is additive, the dark background is transparent, so the fade to nothing is clean.

The spec, as I built it the second time:

```json
{ "spec": "smak.sprite/1", "sprites": [{ "name": "sprites/zerogxplode.spr", "class": "explosion", "use": "tempent",
  "type": "parallel", "format": "additive", "size": [128,128], "frames": 16, "fps": 15,
  "layers": [
    { "kind": "explosion", "ramp": "blast", "growth": 0.5, "env": { "attack": 0.08, "decay": 0.9, "start": 0.1 } },
    { "kind": "billow", "count": 18, "spread": 0.7, "size": 0.3, "growth": 0.6, "blend": 0.4, "lumps": 0.6,
      "hot": 0.4, "cool": 0.6, "dissolve": 0.8, "ramp": "blast", "env": { "attack": 0.15, "decay": 0.75, "start": 0.05 } }
  ] }] }
```

The first build had the same layers with smaller values, and the lobes barely spread from the core. I raised the billow's spread and growth and added growth to the core, and the second build shows the lobes clearly.

**What the report says**

- Against Half-Life's explosion class, all 5 measures are in range.
- The report has no reference sheet to compare with. The server has no game folders, so I could not read the game's own `zerogxplode.spr` and could not measure this against it directly. The "at least as good" judgement has to come from the in-game comparison.

**What I could not check**

I have not run it in the game. To compare, copy `zerogxplode.spr` over the game's file in the mod's `sprites/` folder, or load it beside the original, and look at both. If the modder sends me a sheet of the original's frames, I can pass it as the `reference` and tune against it.
