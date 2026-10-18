# Working with a person: a workflow for each kind of asset

A person asks for something ("make me a crate", "I need a pain sound for my monster") and stays to look at it.
They will get it right with you over a few rounds; your work is to get it there in as few as you can, and never to
spend their time on a costly step they have not seen the reason for. Every kind below has the same shape:

1. **Ask first, briefly.** Only what changes the result, and only what the request does not already say:
   what it is for and where it goes in their mod, its size, its style or the asset of the game it stands beside,
   and any picture or reference they have (a photo, a sketch, a sound they like). Two or three questions at
   most; take a sensible default for the rest and say which you took.
2. **Show at each checkpoint, then wait.** A checkpoint comes before every step that costs minutes or throws
   work away. Show the pictures (or the sound) and ask a plain question: "Does this look right, or what should
   change?" Do not go on to the next step until they say so.
3. **Turn their notes into the next round.** Keep what they liked. Change only what they named. Start from the
   best version so far, not the last one, if the last was worse. Say in one or two lines what you changed.
   If a note is unclear, ask about that note only. Give each round's spec and result a name of its own
   (`guard_r5.json`, `guard_r5.mdl`) so the best one is still there to go back to: a session that built over its
   best model with three worse ones had nothing to return to.
   Fix a fault on the route the person approved, not by changing route: a character's mesh whose arms join its
   trunk is mended with a new picture with the arms apart, not by rebuilding it from pieces, which loses the
   picture's shape they chose.
4. **Stop when they say ship it.** Then give them the files and where each goes in the mod's folder (below), what
   `check` said, and what the pictures cannot tell (how it plays and sounds in the game).

The detail of each kind's spec is in `guide { doc: "spec" }`, by the section named below; it is not repeated
here.

Where the files go in a mod (`<mod>` is its folder, beside `valve`): models in `<mod>/models/`, maps in
`<mod>/maps/` (their `.wad` in `<mod>/`), sounds in `<mod>/sound/...` under the path the spec names, sprites in
`<mod>/sprites/`, a sky's six pictures in `<mod>/gfx/env/`, music in `<mod>/media/`. A file that replaces one of
the game's under the same name works with no code; a new name needs the mod's code or scripts to name it
(AGENTS.md, rule 8). The tool `file` with `to` copies a built file to that place in the work folder.

**Their own files, at any step.** Every step takes the person's own file in place of the kit's, so they can do any
part themselves and hand it back: a photo or drawing in place of a generated picture, the generated picture after
they fixed it in an image editor, a back view, a mesh changed in Blender (`.obj`), a recording, a texture painted by
hand, a model touched up elsewhere, a map edited in Hammer. A file on their disk is copied in first with
`file { name: "<its whole path>", to: "theirs/<name>" }` (pictures, meshes, sounds, models, maps, .wad and sprites;
nothing else is read from outside), then used by its `work:` name at the step it belongs to. Go on from that step;
do not redo the steps before it. When a note is one the generator does not follow after a redraw or two ("take the
holster off" a picture), say so and offer that route: they edit the picture, you carry on from it.

## A prop or other model

For a thing that stands in the world: a crate, a lamp, a console, a pickup. Spec: "A model".

- **Ask:** what it is and where it stands; its size (or what it stands beside); worn or new; a picture of one if
  they have it (a shape is made from it: `generate { kind: "shape", picture }`, and it can paint the model:
  "Pictures projected onto it"), or a mesh of theirs (`.obj`: the spec's mesh part).
- **Checkpoint 1, the shape:** `build` it and show the sheet of sides (the build's picture). Ask whether the
  shape and proportions are right before painting anything in detail.
- **Checkpoint 2, the paint:** the materials and finish on it, the sides again, and one close angle. With
  `--materials`, `materials` shows real surfaces to choose from by name.
- **Checkpoint 3, in its place:** `page { kind: "view" }` with it beside a game model it will stand near, turning.
- **Notes:** "too tall" changes `size`; "the handle's on the wrong side" moves that part only; "make it
  dirtier" raises the finish's grime. Rebuild from the same spec, changed.
- **Ship it:** `<mod>/models/<name>.mdl`.

## A weapon

For something held: a crowbar, a pistol, a shotgun. Spec: "A weapon in place of a game's" (and the firearm kit
for guns, `kind: "kit:firearm"`).

- **Ask:** which of the game's weapons it replaces (its animations and sounds come with that file); real-world
  model or length; finish (blued, wood, painted); anything it must have (a scope, a light).
- **Checkpoint 1, the side view:** the weapon alone from the side (`render { side: "left" }` of the `w_`, or
  the build's pictures), its outline and parts. Ask about shape and length.
- **Checkpoint 2, in the hands:** the first-person view (`v_`) beside the game's own, and the player-held and
  world models (`p_`, `w_`). Ask whether it sits right on screen.
- **Checkpoint 3, moving:** a strip or GIF of its attack or reload (`render { kind: "gif" }`).
- **Notes:** "longer barrel" changes that part; "sits too high" is the fit, not the shape. Keep the brief's real
  length: the build lays it at the game's own share of life in each file.
- **Ship it:** `<mod>/models/v_<name>.mdl`, `p_<name>.mdl`, `w_<name>.mdl`, and its sounds under `<mod>/sound/weapons/`.

## A character or creature

For a person or a monster on one of the game's skeletons. Spec: "A character on a game's skeleton", and
"Pictures projected onto it".

- **Ask:** who or what it is, which of the game's characters it replaces or stands beside (its skeleton and
  animations), and anything that must show (a uniform, a badge, armour, a face).
- **Checkpoint 1, the picture:** `generate { kind: "shape", prompt, base, only: "picture", turnaround: true }`
  draws it front and back in seconds. Show the pictures. This is the cheapest place to get it right: the
  picture is all the paint it will have. Redraw with other words or seeds until they say it is right.
  A picture of their own (a photo, a drawing, the drawn one after they edited it) skips this checkpoint: it goes
  straight to the next with `picture`, and a back of theirs with `back`.
- **Checkpoint 2, the shape:** `generate` again with the chosen `picture` and `base` (its sides are painted for
  you), then `build` the spec its answer gives (a picture not drawn here is built with `"pose": { "fit": true,
  "bind": true }`, as the answer says). Show it from every side, front and back. A mesh they changed elsewhere goes
  in as the spec's mesh part; `generate { kind: "paint", mesh, picture }` paints its sides again.
- **Checkpoint 3, moving:** `page { kind: "view" }` with it walking and running beside the game's own, or
  `render { kind: "gif" }` of its walk.
- **Notes:** a note about the clothes or face goes back to checkpoint 1 (a new picture); a note about the size
  or stance changes the spec; "the back is wrong" is the back picture. The build's warning that arms join the
  trunk (they tear in motion) goes back to checkpoint 1 too: a picture with clear space between arms and body.
- **Ship it:** `<mod>/models/<name>.mdl` under the name the mod's code loads.

## A map

A level from words, a sketch or a floor plan. Spec: "A map" (and `guide { doc: "maps-making" }`).

- **Ask:** what happens there and the rooms it needs; how big; how it joins the maps before and after it; the
  mood (lit, dark, industrial, outdoor); a sketch or plan if they have one.
- **Checkpoint 1, the plan:** `build` it and show the plan from above, rooms named. Ask about layout before any
  detail. A sketch of theirs is read by you and written as the plan ("A drawing of the layout"), and drawn beside the
  result (`build { reference }`) so both of you compare; a `.map` they edited in Hammer is compiled and checked as
  it is (`command` with `map-compile`, then `check { walk: true }`).
- **Checkpoint 2, the views:** the build's view of each room and its views aimed at what the map has (its
  `features`), compiled and lit. Ask about look and light (`lighting`, `focus`, a room's `use`).
- **Checkpoint 3, walking it:** the walk test's faults fixed, and a flythrough video (spec "A video") so they see
  it as a player moves through.
- **Notes:** "this room's too small" changes that room; "too dark" changes the light, not the textures; "it
  needs a landmark here" names `focus`. Keep every room they did not name as it is.
- **Ship it:** `<mod>/maps/<name>.bsp` and its `.wad` in `<mod>/`; `map <name>` in the console.

## Textures (a .wad)

A `.wad` of a map's surfaces. Spec: "Textures for maps (a .wad)".

- **Ask:** which surfaces (walls, floors, trim, doors, signs); the setting; photos they want them made from, or the
  material library (`materials`).
- **Checkpoint 1, the set:** the textures side by side (the build's picture). Ask which are right.
- **Checkpoint 2, in place:** a compiled map drawn wearing them (`preview: { map, views }`; `each: true` for
  each texture on its own place). Ask about scale and repeat.
- **Notes:** change only the textures they named; keep each other's colours as they are.
- **Ship it:** `<mod>/<name>.wad`, named in the map's `wads`.

## A sprite

A flame, a glow, smoke, a spark: a flat picture the engine shows facing the player. Spec: "A sprite".

- **Ask:** what it shows, how big in the world, looping or played once, and its colour.
- **Checkpoint 1, the frames:** the contact sheet and the animated picture. Ask about shape, colour and timing.
- **Notes:** "faster" changes the frame rate; "less orange" the colour; keep the frames they liked.
- **Ship it:** `<mod>/sprites/<name>.spr`.

## A sound

A hit, a shot, a step, a pain cry, a loop. Spec: "A sound".

- **Ask:** what makes the sound and when it plays; whether it replaces one of the game's (its name); one-shot or
  loop; any sound they like as a reference. A recording of their own takes the place of the takes: it goes in the
  sound spec as the `sample` layer, and checkpoint 2 follows.
- **Checkpoint 1, the takes:** with `--generators`, `generate { kind: "sound", ... }` makes several takes; send
  them with `file` so the person can listen, and ask which is closest. Tell them each take's licence (its
  sidecar names it): whether a non-commercial one will do is their call.
- **Checkpoint 2, the shaped sound:** `build` the sound spec from the chosen take (length, bands fitted with
  `finish: { fit: "bands" }`), and send it again.
- **Notes:** "too long" changes `length`; "too bright" or "thinner" the bands; "more echo" the finish's room. Keep
  the take they chose.
- **Ship it:** `<mod>/sound/<path>.wav` under the name it replaces or the name the mod plays.

## Music

A track for a level or a menu. Spec: "A music track".

- **Ask:** mood, tempo, length, looping or not, and a track they like as a reference.
- **Checkpoint 1, the takes:** `generate { kind: "music", ... }`, each sent with `file` to listen to.
- **Checkpoint 2, the track:** the music spec built from the chosen take, levelled as the game's tracks are.
- **Ship it:** `<mod>/media/<name>.mp3`.

## Pictures and videos to show the work

A turntable of a model, a flythrough of a map, a sheet of everything. Spec: "A video".

- **Ask:** what it is for (a forum post, a trailer, a review) and how long.
- **Checkpoint 1, the shot list:** the contact sheet (`preview`). Ask about framing and order.
- **Checkpoint 2, the video:** rendered (`preview: false`). Ask about pace.
- **Ship it:** the video file from the work folder.
