The sprite builds OK: `work:sprites/zerogxplode.spr`, with a contact sheet and an animated preview beside it. The build reports 64x64, 15 frames, additive, placed as a `tempent` with render mode 5 at 15 fps. Every check passed, the light stays off the border, and the envelope ends dark.

I matched it to your description by eye, not against the original. I have no reference picture, so the judge's side-by-side comparison is untested.

**Final spec**

```json
{
  "spec": "smak.sprite/1",
  "sprites": [{
    "name": "sprites/zerogxplode.spr", "class": "explosion", "use": "tempent",
    "type": "parallel", "format": "additive", "size": [64, 64], "frames": 15,
    "loop": false, "fps": 15, "origin": "centre",
    "layers": [
      {"kind": "explosion", "gain": 0.35, "ramp": "blast", "growth": 0.4, "cool": 0.8, "turbulence": 0.5,
       "env": {"attack": 0, "decay": 0.6}},
      {"kind": "billow", "gain": 0.9, "ramp": "fire", "at": [-0.08, 0.1], "count": 24, "spread": 0.55,
       "size": 0.36, "growth": 0.4, "rise": 0.15, "drift": 0.08, "blend": 0.4, "lumps": 0.4, "hot": 0.3,
       "cool": 1, "dissolve": 0.6, "light": [-0.6, 0.6], "env": {"attack": 0, "decay": 0.3},
       "debris": {"count": 14, "speed": 0.9, "gravity": 0.2, "trail": 0.1}},
      {"kind": "sparks", "count": 14, "speed": 0.9, "gravity": 0.1, "trail": 0.05,
       "env": {"attack": 0, "decay": 0.7}}
    ]
  }]
}
```

**How it matches your description**

| Frames | Your description | This sprite |
|---|---|---|
| 0 | Small white point, a little left of centre, about 8 px | Small cream point, slightly left of centre, about 8 px |
| 1 to 3 | Bursts into a lumpy white blob, about 45 px by frame 3 | Lumpy blob of about 40 px, bright cream centre |
| 4 to 7 | Grows to nearly fill the frame, bumpy cloud, white cooling to cream | Fills most of the frame, cream body, sparks start to show |
| 8 to 10 | About 50x60 px, pale top lobe, darkening base | About 50 px wide, bright top, base darkens |
| 11 to 13 | Dims fast from amber to brown | Greys out to a dim smudge by 13 |
| 14 | A faint brown smudge near the top | Fully black |

**Known gaps**

- **Palette:** the body reads cream-to-grey, not pure white with an orange-red rim. The rim in frames 1 to 3 is missing, and the amber and brown in frames 11 to 13 come out grey.
- **Frame 14:** it is fully black, where your description keeps a faint brown smudge.
- **Sparks:** they are short fine streaks, not your pale specks flying out to the left and lower left.

I tried about eight variants. The main levers were the colour ramps and the layer gains, and the ramp settings seemed to have less effect than I expected. The gaps above are the ones I did not close. If you want the warmer rim and the brown tail, the next step is a reference picture to tune against.
