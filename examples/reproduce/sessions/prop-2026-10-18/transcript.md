# Session: prop (2026-10-18)

Maker haiku, person haiku. Reported cost $0.29.

Brief (the person's only): A wooden supply crate for a warehouse level of your Half-Life mod. About waist high, square. Worn and a bit dirty, planks with metal corner brackets. No picture of one. It should look like it belongs beside Half-Life's own crates, not like a cartoon. It will replace nothing: a new file name is fine.

## person 0

Make me a crate for my mod.

## maker 1 (11 s, 3 calls: guide, guide, guide)

A crate is a prop model, so I'll follow SMAK's prop workflow: a few quick questions before I build anything. I'll start from these defaults unless you say otherwise:

- **Type:** a new, plain wooden supply crate.
- **Size:** about 32 units on each side, the size of Half-Life's own crates.
- **Shape:** a cube with plain planks and a slightly worn finish.

To get it right, I need:

1. **What is it for, and what does it stand beside?** For example, an ammo crate in a warehouse, or a loose crate in a level. If you tell me which game models it will sit near, I can match their scale.
2. **Size:** do you want the default 32 units, or something bigger or smaller? A box that a player walks past should look different from one they can stand on.
3. **Style:** new or battered? Wood, metal, or cardboard? Do you have a photo or sketch of the one you have in mind? If so, send it and I'll match it.

Once you reply, I'll build the shape first and show you the sides. I won't paint it until you've approved the shape.

## person 1

Size's fine at 32 units, it's a waist-high crate, so I'd go a bit taller than a cube, closer to 40 tall. Plain wood planks, metal corner brackets, worn and a little dirty. New file name is fine, nothing gets replaced. It should look like it sits with Half-Life's own crates, not cartoony. No photo to send.

## maker 2 (26 s, 6 calls: guide, guide, guide, guide, file, build)

The shape is built and every check passed. Please look at the sheet before I paint anything else.

**What's in it:**
- **Body:** 32 by 32 units, 37 tall, with two horizontal seams per side to suggest planks.
- **Lid:** a 3-unit lid that overhangs the body by half a unit on each side, so the total height is 40.
- **Brackets:** iron corner brackets on all four sides, painted on rather than built, so they add no triangles.
- **Size:** 24 triangles. Half-Life's own crates are about 26, so this is in the right range for the game.

The grain is a painted stand-in for now. It looks a bit bold and stylised, which is the wrong direction for "not cartoony". For the paint step I'd switch the planks to a photographed wood surface from the materials library, which is the kind of surface Half-Life's own props are closer to. I'd also keep the wear and grime settings and add more dirt along the bottom.

Does the shape look right? Are the proportions right, and do you want the lid, the seams, or the bracket placement changed? Once you approve the shape, I'll do the paint round with the library wood.

The files are in the work folder: `supply_crate.mdl` (the model) and `supply_crate-sheet.png` (the sheet).

Files written: supply_crate-sheet.png, supply_crate.built.json, supply_crate.json, supply_crate.mdl, supply_crate.spec.json

## person 2

Looks solid for the shape, and the lid and proportions are fine. The one thing I'd fix is the wood: the swirly, bold grain reads as cartoon, and I want straight, plain planks with subtle grain, like Half-Life's crates. Switch to the library wood as you said, and keep the brackets visible enough to read at game distance.

## maker 3 (20 s, 8 calls, 1 failed: materials, guide, materials, guide, guide, file, build, build)

The wood is now the library photograph, and the brackets are raised so they read at a distance. The check passed, and the shape and triangle count are unchanged at 24.

**What changed:**
- **Wood:** Brown Planks 07, a CC0 photograph, laid at a 39-unit board width. Its grain is faint and it has plain horizontal seams, so each face shows two boards.
- **Brackets:** now 6 by 4 units and raised rather than flat, with the same iron finish. They should read at game distance.
- **Painted seams:** removed, because the photograph's own seams replace them.

**One thing to check:** the seams come out at about two boards per face. If you want more, narrower planks, I can change the board width. That would mean a different library surface or a smaller size value.

Does this look right? If so, I'll take the view in place next to a game model, turning, as the last checkpoint. The files are `supply_crate.mdl` and `supply_crate-sheet.png` in the work folder.

Files written: supply_crate-sheet.png, supply_crate.built.json, supply_crate.json, supply_crate.mdl, supply_crate.spec.json

## person 3

This is much closer. The planks are plain, the brackets read, and it no longer looks like a cartoon. The main thing off now is that it looks clean and fresh. I want the dirt and wear you mentioned earlier: grime along the bottom edges and some worn corners, so it looks like it has sat in a warehouse for years.

## maker 4 (30 s, 6 calls: file, build, file, build, file, build)

The dirt and wear are in. The bottom edges now have a dark grime band, the corners are worn, and all eight brackets are visible.

**What changed:**
- **Wear:** raised from 0.6 to 0.9 (the top of its range).
- **Grime:** raised to 1, the top of its range. The floor dirt is now also a painted band of about 4 units at the foot of the body. I added it as paint, so it adds no triangles.
- **Brackets:** the two lower ones moved up to sit above the grime band, so none are hidden.
- **Variation:** raised slightly, so the boards differ more from each other.

The check passed, and the shape is unchanged at 24 triangles.

**One note:** the finish settings are capped at 1, so the painted band is what gives the strong bottom dirt. If it looks too heavy or too light in the game, the band's depth and tone are the two values to change.

Does this look worn enough? If so, the last checkpoint is the crate standing next to a Half-Life model, turning, so you can judge whether it sits with the game's own crates. The files are `supply_crate.mdl` and `supply_crate-sheet.png` in the work folder.

Files written: supply_crate-sheet.png, supply_crate.built.json, supply_crate.json, supply_crate.mdl, supply_crate.spec.json

## person 4

Worn enough now. The bottom grime and the corner wear read right, and the brackets show. Show me the crate next to a Half-Life model before I sign off, since that's the test that matters.

## maker 5 (20 s, 7 calls: models, models, render, info, models, models, render)

Here is the crate beside two game models, in the work folder as `crate_beside_game.png`. The picture is a plain stand-in for the game's lighting.

- **Scale:** the crate sits well against the filing cabinet. It stands about waist-high, as you asked.
- **Style:** the plain planks, the faint grain, the iron brackets and the grime at the foot read as grey-brown Half-Life props. They do not look cartoony next to the cabinet.
- **Weakness of the test:** Half-Life's own wooden crates are not models in this game folder. The `mil_crate.mdl` there is a set of military gear, and its frame came out as a flat sliver. The weapon box is green metal, so it is not a fair match for wood. The cabinet is the closest comparison I have. If you want a true match, the check is in the game itself: put the crate in a level next to one of Half-Life's crates.

The pictures cannot tell how the crate looks under the engine's lighting, or how it plays. Those need a look in the game.

If it looks right to you in the game, say "ship it". The file to put in your mod is `models/supply_crate.mdl` (in `<mod>/models/`). It is in the work folder as `supply_crate.mdl`, with the check report (every check passed, 24 triangles) from the last build.

Files written: crate_beside_game.png

## person 5

Better. It sits in the same grimy, muted world as the cabinet. My one note is the wood: it's a lot warmer and more orange than the grey cabinet and the green weapon box. Knock the saturation down a bit so it looks like the same warehouse.

## maker 6 (32 s, 7 calls: file, build, file, build, file, build, render)

The planks are now a muted grey-brown, close to the cabinet's tone. Please check the render in `crate_beside_game.png` (the work folder), since that is the comparison you asked for.

I set the plank tone to a middle value (0.36, 0.32, 0.27). The first try (0.40, 0.36, 0.31) looked pale, and the second (0.32, 0.29, 0.25) went almost grey and lost the look of wood. The middle one still reads as wood at the seams and grain, with the warmth taken out of it.

- **Still off:** the crate's planks are a little lighter than the cabinet. The cabinet is darker and nearly neutral. If the crate should match it more closely, the next step would be a slightly darker tone, but that risks losing the wood look again.
- **Unchanged:** the shape, the brackets, the grime band and the wear. The check passed, with 24 triangles.

Is this the right warmth? If so, say "ship it" and I'll give you the files for `<mod>/models/`. If it is still too warm or too light, tell me which way.

Files written: crate_beside_game.png, supply_crate-sheet.png, supply_crate.built.json, supply_crate.json, supply_crate.mdl, supply_crate.spec.json

## person 6

Now it reads as grey stone or concrete, not wood. The planks have lost the grain and warmth, and they're still lighter than the cabinet. Bring back a little brown, somewhere between the first try and this one, so the grain shows, and keep the tone darker than now.

## maker 7 (17 s, 3 calls: file, build, render)

The planks are now darker and browner, and they sit close to the cabinet's value. The grain still does not show clearly, though. I can't bring it back with the tone alone, because the grain comes from the photograph itself, and Brown Planks 07 is a plain, low-grain photo.

**Where it stands:**
- **Tone:** (0.33, 0.28, 0.22). It is darker than the last try and has more brown, between the first try and the grey one.
- **Grain:** faint. The seams and board edges show, but the wood figure is mostly lost at this tone.
- **Cabinet match:** the crate is now a little warmer than the cabinet and about the same darkness. This is close.
- **Unchanged:** the shape, the brackets, the grime band and the wear. The check passed, with 24 triangles.

**Options:**
1. **Change the photograph to one with more grain**, such as Old Wooden Floor 01 or Raw Wooden Floor 01. This should show the grain at this tone. It is a different surface, so I'd render it beside the cabinet to check the match before you see it.
2. **Keep Brown Planks 07 at this tone**, and accept the plain look. This is closest to the plain planks you asked for first.

Which do you want? Once you pick, I'll make the change and render it beside the cabinet. Then, if it is right, say "ship it" and I'll give you the files for `<mod>/models/`.

Files written: crate_beside_game.png, supply_crate-sheet.png, supply_crate.built.json, supply_crate.json, supply_crate.mdl, supply_crate.spec.json

## person 7

Closer, and the tone sits with the cabinet now. But the sides still read more like stone or concrete than wood. Go with option 1, the grainier photo, and check it beside the cabinet.

## maker 8 (18 s, 3 calls: file, build, render)

The sides now read as wood. Please check `crate_beside_game.png` in the work folder.

**What changed:** the planks use Old Wooden Floor 01, with the same brown tone as before. The grain and board lines show, and the sides no longer look like stone.

**Against the cabinet:**
- **Darkness:** about the same value as the cabinet.
- **Colour:** the crate is still a little warmer and browner. The cabinet is almost neutral grey. The crate is muted, but it is not the same colour.

**One thing you asked for that this photo doesn't give:** you asked for straight, plain planks. The floor photo's boards are short and staggered, with breaks between them, so the sides look more like a parquet floor than a crate's long boards. Brown Planks 07 had long straight boards but no grain. If the staggered look is wrong for a crate, the fix is another photo, and I can search the library for one with long straight boards and visible grain.

The shape, brackets, grime band and wear are unchanged. The check passed, with 24 triangles.

Does this read as wood enough to keep, staggered boards and all? If yes, say "ship it" and I'll give you the files for `<mod>/models/`. If the boards need to be long and straight, I'll look for another photo.

Files written: crate_beside_game.png, supply_crate-sheet.png, supply_crate.built.json, supply_crate.json, supply_crate.mdl, supply_crate.spec.json

## person 8

It reads as wood now, and it sits well next to the cabinet. My one note is the boards: they're short and staggered, so the sides look like a wooden floor. I want long, straight planks like a crate's. Find a photo like that.
