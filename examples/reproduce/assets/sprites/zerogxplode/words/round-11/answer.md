The sprite is built and the build says **OK**: `work:sprites/zerogxplode.spr` (with `-sheet.png` and `-animated.png` beside it).

I had no reference picture, only your description, so every measure is against Half-Life's own explosion class, not the original. The judge's comparison to the original can't be run here.

**Spec used**, written inline (not saved to a file in the work folder):

```json
{"spec":"smak.sprite/1","sprites":[{"name":"sprites/zerogxplode.spr","class":"explosion","use":"tempent","size":[64,64],"frames":15,"loop":false,"fps":15,"type":"parallel","format":"additive","origin":"centre","finish":"edge","layers":[{"kind":"billow","at":[0.1,0.05],"count":18,"spread":0.42,"size":0.3,"growth":1.0,"rise":0.2,"drift":0.1,"hot":0.4,"cool":0.6,"lumps":0.5,"blend":0.4,"dissolve":0.7,"env":{"attack":0.0,"decay":0.5},"ramp":[[0,[0.3,0.15,0.05]],[0.35,[0.75,0.5,0.2]],[0.65,[1.0,0.9,0.55]],[0.85,[1.0,0.92,0.75]],[1,[1.0,0.98,0.92]]],"debris":{"count":24,"speed":0.9,"gravity":0.4,"trail":0.3}}]}]}
```

**What the build reports:** 64x64, 15 frames, additive, `tempent` (render mode 5), 15 fps. Against Half-Life's explosion, all five measures are in range. Border light is 0 and the last frame is dark.

**Choices I made:**
- **Frame rate:** 15 fps. You didn't give one.
- **Shape:** one lumpy billow, weighted to the upper right, with debris flecks thrown left and below. The bright speck in frame 0 comes from the billow's own start, not a separate glow.
- **Colours:** the ramp runs from the deep brown edge through amber and gold to the white core. The rim is brown at low brightness, not your exact (0.45, 0.12, 0.05).
- **Fade:** the tool's fade-out is what sets the brightness over the frames, so the envelope is a fitted guess, not your numbers.

**Where it differs from your description:**
- Frame 14 is fully dark. You describe a faint smudge there. I kept it dark because the tool fails a one-shot that does not end dark. A faint smudge at frame 13 is the closest I could get.
- The grey-white spark flecks use the debris default colour. I did not check that colour against yours.
- The speck in frame 0 sits near the centre, not a little left of it, because the billow is weighted right.
- Frames 1 to 4 read as near-solid white, and frames 5 to 8 turn cream then gold, as described.
