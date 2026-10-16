The sprite builds **OK** (`sprites/steam1.spr`, with `-sheet.png` and `-animated.png` beside it). The report still lists some warnings, and I've left them in the table below rather than tune against a measurement I don't trust.

**What it is:** a puff of steam: a small grey-white dot that swells, lifts slightly and thins to nothing over 16 frames. It is a `smoke puff`, `use: env_sprite` (the default), `parallel oriented`, `index alpha`, 32×48, centred, 16 frames at 10 fps, not looping. Its brightness comes from a single `billow` layer, coloured by `ramp: "reference"`.

**Spec**
```json
{"spec":"smak.sprite/1","sprites":[{"name":"sprites/steam1.spr","class":"smoke puff","use":"env_sprite","type":"parallel oriented","format":"index alpha","size":[32,48],"frames":16,"loop":false,"fps":10,"origin":"centre","finish":{"edge":2},"reference":{"picture":"pictures/frames.png","cell":64,"cols":8},"layers":[{"kind":"billow","at":[0,-0.2],"spread":0.5,"size":0.44,"growth":0.6,"rise":0.2,"drift":0.08,"gain":1.0,"env":{"attack":0.55,"decay":0.45,"start":0.02},"ramp":"reference"}]}]}
```
The build saved this as `sprites_steam1.spec.json` in the work folder.

**Measures against the original (after 9 builds)**

| Measure | Original | Mine | Bar |
| --- | --- | --- | --- |
| Mean colour (delta E) | — | 7.1 | 15 or under |
| Share that is dark | 0.62 | 0.58 | within 0.05 |
| Brightest pixels (over 0.7 a frame) | 121 | 131 | half to 1.5× |
| Peak timing (share of play) | 0.57 | 0.53 | match |
| Border light | 0.958 | 0.728 | within 0.08 |

**Still in the report (not cleared):**
- **Shape overlap 0.19 against the 0.8 bar.** This is mostly the measurement. The reader found 8 reference frames, not 16. Its cells are 64×96 (the 32×48 sprite at 2×), and it assumes square cells. It also gave me the reference's frame numbers in the wrong places, so frame-by-frame light and shape comparisons are unreliable. I tuned by eye against the sheet instead.
- **Frames 4 to 7 read dimmer than the original** (0.07 against 0.78). The original's frames 4 to 7 look near peak to me, and mine are mid-grey. This may be the same reference fault. I did not force it, because an earlier peak lost the timing match.
- **Border light 0.73 against 0.96.** The original's edge values may also come from the cell-size fault. I added `finish.edge` (2) to stop the square showing, which the larger puff needed.

**Tool fault to fix:** the reference reader needs non-square cells (64×96 here) or a separate frame-height setting. I could not check how the repo's other sprite examples pass their reference: reading `/media/Data3/Packages/smak/examples/reproduce` was denied. I read the two input files by path instead.
