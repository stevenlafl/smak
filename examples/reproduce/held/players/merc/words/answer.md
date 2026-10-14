`merc.mdl` is built and the build says **OK**. It is a new body on The Specialists' own `player/gordon/gordon.mdl`, with the spec's contract set to that file. The contract check passes: all 34 bones, the 171 animations in their original order, the 4 attachments and the bodypart are unchanged. The engine check says it is fit for GoldSrc, at 2,214 triangles on one 512×512 texture.

I couldn't look at the original model. The kit won't render files outside its models and work folders, and gordon.mdl is in the game folder. So the shape comes from your description plus the joint positions in the first frame of the first animation. Fine details are best guesses: the exact tattoo strokes, the camo blotch layout, where the "311" sits and how big it is.

**Size compared with the original**

```
            merc    original
height      69.4    69.4
width       22.3    22
depth       23.9    23.7
```

**What it has**
- **Head:** black balaclava with one wide eye slot showing brown skin and dark eyes, a separate mouth hole with brown lips, and a slight nose bump. It runs down into the shirt collar.
- **Torso:** charcoal padded vest over a black shirt, with grey stitching on the panels. Six red shells with brass ends sit in a loop strip on the upper chest. "311" in dull gold is below the shells and again on the upper left of the back. There's a black belt with a silver buckle.
- **Arms:** black short sleeves ending near mid-bicep, brown skin, and black tattoos with pointed curling strokes on both upper arms and forearms. Black fingerless gloves leave the fingertips brown. The silver studs are painted on both flat sides of each hand, because I couldn't tell which side is the back.
- **Legs:** grey urban camo trousers in light grey, mid grey, near-white and black, with cargo pockets on the outer thighs and straps above the knees. A black drop-leg holster sits on the right thigh with two straps, a dark pistol grip and a silver magazine showing.
- **Boots:** tall black boots with grey laces up the front, crease lines at the ankle and dark brown soles.

**Checks I looked at:** the body stays in one piece through run2, walk, crouch and jump (the build checks those itself), and I also looked at dive_f_akimbo and roll_f. The dive matches what you described: he crouches, launches flat with both arms straight ahead and hands together, and ends horizontal with his knees bent and boots trailing behind.

**Leftovers you might want cleaned up:**
- `num-test.mdl` and its spec in the work folder are scratch from testing the "311" print. They can be deleted.
- The file still carries the base's unused `trench.bmp` and `DM_Face.bmp` textures, which nothing draws.

The spec is in the work folder as `merc.spec.json`, so changes are a rebuild away.
