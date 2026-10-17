You are consulted for advice only. Do not edit, create or delete any file, run no build, install nothing and
download nothing. Read what you need, think, and answer in prose.

## The project

SMAK (this folder) is a kit an LLM agent drives through an MCP server to make a GoldSrc (Half-Life 1) mod's
assets: models (props, first-person/in-hand/world weapon sets, characters, creatures), maps, .wad textures,
sprites and sounds. AGENTS.md is the kit's briefing; docs/SPEC.md the JSON specs the agent writes; mcp/README.md
the server's tools.

The goal: an agent working only through the server makes assets that hold up beside Valve's own, proven by
reproduction legs (from pictures, from a written description, from a modder's brief), an original small mod
made from a brief, and independent judges (Haiku) who score pictures and measurements against a fixed rubric
(examples/reproduce/rubric.md, with dated amendments), with measured gates that cap the score, decoys that must
fail, and controls (Valve's own asset judged against the same brief) that must pass. An asset passes when every
must-have item scores 2 and its total is at least 85%; a kind passes when 80% of its assets do.

## Where it stands (2026-10-17)

- The original mod (20 assets from a brief: 3 maps, 5 props, a weapon, an enemy, a .wad, 3 sprites, 6 sounds):
  seven one-shot runs on Haiku makers scored 2, 3, 4, 2, 5, 4 and 3 of 20; one on an Opus maker 7 of 20
  (examples/reproduce/original/). No map has passed; the pump hall reached 16 of 18.
- Held brief legs (weapons and characters on game skeletons): a pump shotgun made with the new firearm kit
  (kits/firearmkit.mjs) passed 18 of 18 once and scored 16 on a rerun; the judges' spread on one build is 2 to 3
  points. Characters 0 of 4: three of four are picked out of a line-up of the game's own.
- Characters are being made by a generator route (research/generated-characters.md): SD-Turbo draws the figure
  over a grey guide of the base skeleton's stance, Hunyuan3D-2mini makes a mesh, the picture is projected as its
  paint. The attached picture shows Valve's barney (left two, front and back) beside ours (right two): ours is a
  soft blob with a box vest and no face; the maker discarded the generated picture and painted flat colours.
- The person's view: "The important part is fidelity", and "we may never get fidelity on a one shot". A
  revision loop is being tested now (examples/reproduce/held.mjs, `rounds`): the maker gets the judge's failing
  lines as a person's notes and revises in the same work folder.
- Hardware for local generators: AMD RX 9070 (16 GB, ROCm), 60 GB RAM. research/backlog.md lists open items.

## What we ask

1. Is the bar reachable for each kind with LLM makers through this kit, one-shot or with revisions? Where is it
   likely capped, and by what (the maker, the kit's tools, the generators, the judging)?
2. Fidelity of characters and creatures: what route would you take to get from the picture's right two figures
   to the left two in GoldSrc's limits (about 700 to 1600 triangles, 8-bit textures)? Image models, multi-view,
   3D generation, texture projection or painting, retopology, rigging; what fits a 16 GB ROCm card.
3. Maps: what would most raise a map made from a brief toward Valve's own (layout, detail, texturing, light)?
4. The judging: is the rubric's design sound (line-up test, controls, measured gates, Haiku judges with a 2 to 3
   point spread)? What would you change so that results measure fidelity rather than noise?
5. The three highest-leverage things to do next, in order, with how you would know each worked.

Be concrete and say where you are unsure. Cite the files you read.
