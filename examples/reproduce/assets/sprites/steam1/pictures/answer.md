The sprite is built: `work:sprites/steam1.spr`, with `-sheet.png` and `-animated.png` beside it. The build says **OK** with no faults, but it still lists warnings. Most of them come from how the reference was read, not from the sprite itself.

**The spec I built:**

```json
{"spec":"smak.sprite/1","sprites":[{"name":"sprites/steam1.spr","class":"smoke puff","use":"env_sprite",
 "type":"parallel oriented","format":"index alpha","size":[32,48],"frames":16,"loop":false,"fps":10,
 "reference":{"picture":"pictures/frames.png","cell":64,"cols":8},
 "layers":[
  {"kind":"billow","at":[0,0],"count":24,"spread":0.26,"size":0.27,"growth":1.1,"rise":0.2,"drift":0.05,"ramp":"blast","env":{"attack":0.5,"decay":0.4}},
  {"kind":"billow","at":[0,-0.3],"count":12,"spread":0.14,"size":0.12,"growth":0.9,"rise":0.1,"drift":0.03,"ramp":"blast","env":{"attack":0.5,"decay":0.4}}],
 "finish":{"edge":4}}]}
```

**What it matches:**
- **What it is:** a smoke puff, one-shot (`loop: false`), placed as an `env_sprite` at 10 frames a second.
- **Shape and size:** 32x48 with 16 frames. It starts as a dot, grows to a lobed cloud about 26 pixels wide, then breaks up and fades. The second, smaller cloud sits below the main one to give the downward tail seen in frames 3 to 12.
- **Colours:** white to grey with shaded lobes, from the `blast` ramp. Colour difference against the original is 7.8 (the bar is 15, and 15 or under is near).
- **Timing:** brightest at 0.6 of its play, against the original's 0.57. It ends dark.
- **Type and format:** parallel oriented, index alpha. The tool places it with render mode 4 (Solid).
- **Class check:** all 5 measures against Half-Life's own smoke puff are in range.

**Warnings still showing, and why:**
- **Frame count (16 against 8) and shape overlap (0.12 against a bar of 0.8):** these come from the reference reader. The original sheet has 64x96 cells in two rows. The `reference.cell` setting only takes a square size in pixels, and I have no shell here to re-lay the sheet with square cells. The reader therefore finds 8 frames and misaligned rows. The frames themselves match the original by eye.
- **Border light (0.27 against 0.958) and "covers too little of its frame" (dark share 0.71 against 0.62):** the original's border number comes from the same misread sheet. My sprite is slightly sparser in its mid frames than the original, which I did not push further, because each step I tried either clipped the frame edge or looked like a separate ball.

I stopped there because the remaining warnings are measurements of a reference the tool cannot read correctly. If you can supply the sheet with square cells (for example 96x96 per frame, 8 columns), I can rerun the measures and tune against them.
