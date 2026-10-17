The crowbar is built and the build says OK with no warnings. The three game-named files are in `work:crowbar_weapon/`:

- `v_crowbar.mdl`: first person, with the game's hands and animations
- `p_crowbar.mdl`: in another player's hands
- `w_crowbar.mdl`: lying in the world

To use them, copy the three files into the mod's `models` folder. The game loads them in place of its own, with no code change.

**What I made**

- **Spec:** `work:crowbar.json`, kind `held`, `weapon: { like: "crowbar", size: "own" }`, with the length set to 32.
- **Shape:** a round steel shaft, 8 sides, running along x from the grip end. Its far end bends down into a tapering hook. The bar is 31.8 units long and 128 triangles.
- **Paint:** the shaft is red paint (tone about 0.62, 0.08, 0.07). The grip end and the hook are bare steel, so both tips read as metal.
- **Build:** the first try came out 28.2 long, and the build warned that was 12% short of 32. I lengthened the hook and rebuilt; the length is now 31.8 with no warnings.

**Things to check in the game**

- The swing animations are the game's own, so the hook's motion matches stock. The build's attack strip shows the hook following the swing.
- The bar is about a third longer than the stock crowbar (about 24 units), which is what you asked for. It will read longer in hand.
- The tips are plain bare steel with the game's standard light wear. They don't have chips or scuffs painted on, so the "worn" look is subtle. If the modder wants more obvious wear, that means a more detailed texture, which I haven't done.
- The hook is a simple taper, not a flattened wedge like Valve's. I didn't measure the stock models against it, so I can't say it is at least as good as Half-Life's own. That judgment is theirs when they see it side by side.
