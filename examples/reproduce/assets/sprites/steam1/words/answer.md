The sprite builds OK with no faults or warnings: `sprites/steam1.spr` in the work folder, with its sheet and animated picture beside it.

The final spec:

```json
{"spec":"smak.sprite/1","sprites":[{"name":"sprites/steam1.spr","class":"smoke puff","use":"env_sprite","size":[32,48],"frames":16,"loop":false,"fps":10,"type":"parallel oriented","format":"index alpha","origin":"centre","finish":{"edge":2},"layers":[{"kind":"billow","gain":1.5,"at":[-0.05,-0.45],"count":24,"spread":0.4,"size":0.25,"growth":0.8,"rise":0.35,"drift":0.1,"blend":0.4,"lumps":0.5,"hot":0.4,"cool":0.6,"dissolve":0.7,"env":{"attack":0,"decay":0.6}}]}]}
```

What the build reports: 32x48, 16 frames, index alpha, type parallel oriented, not looping, placed as an env_sprite at 10 fps. Against Half-Life's smoke puff, all five measures are in range. The border light is 0.002, so the square edge does not show.

Frame by frame, against your description:
- **Frame 0:** a small white dot low and a little left of centre. It is about 6 px, where yours is about 3 px.
- **Frames 1 and 3:** about 10 px and 22 px across, close to your 12 px and 22 px.
- **Frames 4-7:** the cloud swells to nearly the full 32 px width, with lumpy cauliflower edges, bright middle and grey shading.
- **Frames 8-11:** it dims to grey and loosens, but the top does not stretch into a tall column as clearly as you describe.
- **Frames 12-15:** it breaks into faint grey streaks and fades to almost nothing by frame 15.

Colours are white and greys only, with a single index colour (its alpha coverage gives the shading).

Limits: I had no reference picture, so this was matched to your description, not measured against the original. The `reference` field would let the report measure it directly, if you can supply a contact sheet of the original. The main gaps are the size of the frame 0 dot and the column shape in frames 8-11. I stopped at OK rather than tuning further, since the report has no warnings left.
