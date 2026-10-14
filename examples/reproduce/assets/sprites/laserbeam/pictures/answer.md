I built `sprites/laserbeam.spr` and the build says OK with every check passed. It's in the work folder, with a `-sheet.png` and `-animated.png` beside it.

It matches the brief: 32x64, one frame, parallel type, additive format. It's a vertical beam lit from top to bottom so it tiles along its length. The core is pure white and about a third of the width. Either side of it is a soft, mottled blue-grey fringe that fades to dark near the left and right edges. In game it goes in as a beam with render mode 5 (Additive).

Final spec:

```json
{"spec":"smak.sprite/1","sprites":[{"name":"sprites/laserbeam.spr","use":"beam","class":"beam",
 "size":[32,64],"frames":1,"type":"parallel","format":"additive",
 "layers":[{"kind":"beam","core":0.3,"noise":0.5,"colour":[0.92,0.94,1.0],"gain":1.6}]}]}
```

Side by side with the original, the main difference is the fringe. The original's is a little wider and more blue-grey and mottled than mine; mine is a bit cleaner. I stopped at this version rather than keep tuning that.

The build couldn't measure it against Half-Life's own beams: it reported "0 of 0 in range", so it had nothing to compare to. The only comparison is the one I did by eye against the reference picture.

The beam layer's `colour` takes values from 0 to 1, not 0 to 255, and the guide doesn't say so. With 0 to 255 values the whole beam turns solid white, and that cost me several builds.
