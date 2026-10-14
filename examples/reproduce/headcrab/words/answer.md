I've built `headcrab.mdl` in the work folder. The build passed every check, and the engine check says it's fit for GoldSrc (1 bone, 1 texture, 980 triangles). I worked only from your description because there's no original model or picture in the models folder to compare against. How close it gets to the original from the judge's cameras is my reading of the pictures, not something I measured.

**Size, asked vs built:**
```
           asked   built
length     25.9    25.7
width      19.2    18.8
height     13.2    13.3
```

**What's there:**
- **Body:** a tan, ochre-brown dome that leans forward. It's 15 long and 16 wide and sits over the rear 60% of the length. The sides have dark fibrous streaks and painted ribs.
- **Back ridges:** two ridges run along the top edges of the back and leave a shallow notch at the rear.
- **Pale front:** a bulging cream-ivory dome covers the front and the top up to mid-body, about two thirds of the body's width. It has white blotches, thin red veins and red staining along its lower edge.
- **Underside:** flat, with dark-red staining. The mouth sits toward the rear: a red ring with 9 off-white peg teeth around pale tissue. From behind, the teeth just show under the rear edge.
- **Forelegs:** a thin tan upper segment runs from the upper front corners about 10 units ahead of the body. It bends down into a thicker forearm, bright red with darker mottling, that ends in a hooked ivory-and-black claw on the floor. The forelegs run parallel, as wide apart as the body.
- **Hind legs:** short, thick stumps at the rear corners, angled out, tan shading to red feet with three small black claws each.
- **Surface:** no glow, lettering or lights.

**Where it may fall short:**
- **Triangle count:** 980 is far over Half-Life's own props of this size, which mostly stay under 156. Most of it is in the rounded body, the front dome, the teeth and the legs. It's within the engine's limits, but a low-poly original will look more faceted than this.
- **Pixel texture:** the texture is 256×256, so the brown areas are soft rather than visibly blocky.
- **Front face:** your "flat, angled face" is read as a rounded bulge that faces forward and a bit down. If the original has a flat plane there, the side outline will differ.
- **Not animated:** it's a static prop with one bone and no animations, so it doesn't walk, attack or die.

The spec it builds from is `work:headcrab.spec.json`, and `work:headcrab-sheet.png` shows six views.
