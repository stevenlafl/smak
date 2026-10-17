The model is built and the build says OK. Its three game-named files are in `work:9mmhandgun_weapon/`: `v_9mmhandgun.mdl`, `p_9mmhandgun.mdl` and `w_9mmhandgun.mdl`. The stand-alone `work:9mmhandgun.mdl` is the same pistol as one held model, for looking at.

**What I made**

- A held pistol built from the game's own weapon files. Each file keeps the game's hands, bones, animations, events and attachments. Only the pistol meshes are replaced.
- Size: 10 units long, 1.5 wide, 7.3 high. The first-person file sits at Valve's first-person scale, and the other two at Valve's lighter world and other-player scale.
- Triangles: 192 for the pistol, 112 in the lighter `p_` and `w_` files. Valve's first-person weapon is in the same range.
- Parts: a steel slide and barrel, a polymer grip, frame, trigger guard and magazine base, and front and rear sights. A black polymer finish on the frame and grip, grey steel on the slide and barrel.
- The finish has a little wear and grime, so the slide shows some bright edges and light brown spots. I lowered it once to make the pistol look cleaner. It still has those spots, and they could read as rust. Tell me if they should go, and I can drop them further.

**How to use it in the game**

Copy the three files into the mod's `models/` folder, next to nothing else. The game loads them in place of its own `v_`, `p_` and `w_` 9mm files, with no code change.

**What the build did not show**

- The build flagged five pairs of parts that nearly touch and leave a gap of 0.3 to 0.56 units, for example the receiver and trigger. The build calls that a note, not a fault, but at close range the joints may show a sliver of light.
- I have not run the game here. The pictures and checks are from the build. The modder should look at the first-person view and the world pickup in the game beside Half-Life's own to judge whether it is at least as good.
