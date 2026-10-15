The sprite builds OK: `work:sprites/zerogxplode.spr`, with `-sheet.png` and `-animated.png` beside it. The last build passed every check, and the kit's measure against Half-Life's own explosion class was 5 of 5 in range.

The spec is `smak.sprite/1`, one sprite with `use: tempent`, `class: explosion`, `size: [64, 64]`, `frames: 15`, `loop: false`, `type: parallel`, `format: additive`, `finish.edge: 6`. It has two layers:

- **Explosion layer:** the white-hot core. Its colour ramp runs white, cream, yellow, orange, dark red. It sits a little left of centre and grows slowly with an attack and decay envelope.
- **Billow layer:** the smoke-fire cloud. Its ramp runs pale yellow at the top, through gold and amber, to brown. It is lumpy, has a small spread, and dissolves at the edges, with debris flecks and a slight upward rise.

I chose 15 fps myself, since the description gave no rate. The kit also decided the timing: the first frame is a small point, the cloud fills about 45 pixels by frame 3, and it dims to nearly black by frame 13.

Where it falls short of the original:

- **Frame 14 is empty.** The kit fails any one-shot that does not end dark, so I dropped the faint brown smudge the description puts at frame 14. Frame 13 carries the last trace.
- **The outer halo is greyer than described.** Frames 4 to 11 have a pale grey-white rim where the original has warm yellow. I could not remove it without also losing the amber lower body. This is the main visual difference to judge.
- **Frames 1 to 3 have an orange-red core with a cream outer ring.** The description asks for a pure white middle with a thin dark-orange edge. The kit's colour ramps respond in ways I could only find by trial, so I did not get the edge that dark.

I did not iterate further. Comparing the animated picture against the original is the next check.
