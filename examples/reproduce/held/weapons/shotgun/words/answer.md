The shotgun builds **OK**, with every check passing. The three replacement files are in `work:shotgun_weapon/` (`v_shotgun.mdl`, `p_shotgun.mdl`, `w_shotgun.mdl`) and the spec is `work:shotgun.spec.json`. Each file keeps the game's hands, bones, animations and events; only the gun's mesh is replaced.

**How I matched it.** At first I couldn't see the game's originals, because the tools won't read files outside the work folder. Then a build hit a tool bug that left the original gun mesh in its output files, and I measured all three views from those.
- **p_ and w_ (other players' hands, lying in the world):** these share one mesh. Mine follows it: about 41 long, 13.4 wide and 5.2 high lying on its side. It has the squared barrel with a magazine tube under it, a small blade sight, and a pale silver muzzle with a dark bore. Behind that come the faceted forend with its two flares and alternating dark and light grooves, then the receiver with a small hump, rear sight and trigger guard. At the back a curved wrist drops into a nearly vertical, slanted butt foot in dark slate.
- **v_ (first person):** the original's mesh here is different from the other two. It has chrome barrel and magazine tubes, a deep pump with vertical ribs, a slotted shroud and a tall receiver with a ribbed top and sight. Behind that is a chrome wrist tube and a short butt block, but no hooked stock. I built those as first-person-only parts. The barrel tip, receiver, pump and butt now sit where the original's do on screen, and the shoot animation keeps the game's own motion.

**Where I went with the original over the description:**
- **The rust band** is on the front flare of the forend, right behind the barrel, not where the receiver meets the stock. That's where the original has it in both p_ and w_.
- **The first-person butt** is a short block off the bottom right, because that's what the original's first-person mesh has.
- **Chrome is off.** The original chromes only its barrels. My parts share one texture, so chrome would cover the whole gun, and in a test it made the body look flat.

**Tool bug:** `weapon.turn: "as drawn"` fails with `Cannot read properties of undefined (reading 'join')` and writes the original mesh unchanged. That's how I got to see the originals, but it's a real fault in the kit.

**Scratch files:** two test builds are still in the work folder: `shotgun_try*` and `shotgun_orig*`. `shotgun_orig_weapon/` holds unchanged copies of the game's three files. Don't install either set by mistake; I can't delete them with these tools.
