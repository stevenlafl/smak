The build says OK. The pistol is in `work:9mmhandgun_weapon/`, with the three files named as the game's own.

**What I made**

A 9mm pistol with a steel slide, barrel and sights, and a black polymer frame and grip, lying along +x with the grip at the rear. Its size is 7.6 units long, about the length of the game's pistol. The model is 108 triangles, and I used a 512 x 256 picture. The spec is `work:9mmhandgun.json`.

| File | Where | What it is |
| --- | --- | --- |
| `v_9mmhandgun.mdl` | `work:9mmhandgun_weapon/` | First-person view, with the game's hands and animations kept |
| `p_9mmhandgun.mdl` | `work:9mmhandgun_weapon/` | The pistol in another player's hands |
| `w_9mmhandgun.mdl` | `work:9mmhandgun_weapon/` | The pistol lying in the world |
| `9mmhandgun.mdl` | `work:` | The new pistol built on its own, as a plain model |

To use it, copy the three files in `9mmhandgun_weapon/` into the mod's `models` folder. They keep the game's names, so the game loads them in place of its own with no code. The plain `9mmhandgun.mdl` is not needed for that.

**How I made it**

I wrote the spec with `size: "own"`, so the model is built at the pistol's real length rather than stretched to the game's. The first build passed but warned that the barrel's 48 triangles were over the 24 Valve spends on a piece that small. I changed the barrel to 6 sides, and the rebuild had no warnings.

**Where it may fall short**

- It is simple. The grip is a plain box, and there is no trigger, hammer, ejection port or checkering. The game's first-person model has 523 to 832 triangles with its arms, so the game's own may read as more detailed.
- I could not put the game's own pistol beside it in this kit. The render tool refuses paths outside the work and models folders, so the comparison is for the modder to make in the game.

The modder will need to judge whether it is at least as good as the game's pistol.
