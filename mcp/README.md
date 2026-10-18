# SMAK as an MCP server

SMAK is used by an agent that reads `AGENTS.md` and writes short Node scripts with a shell. This folder is the
same kit for a client that has **no shell**: a [Model Context Protocol](https://modelcontextprotocol.io) server
that Claude Desktop, Claude Code or any other MCP client starts and talks to. The client's model reads the
guide a section at a time, looks at models and maps, and makes or changes them with specs, with the command line's
own commands, or by sending scripts for the server to run. Everything the command line does, a client does through
`command`; what was made it reads, sees and hears through `file`; the person's viewer and editor it opens with
`page`.

It needs Node 18 or later and nothing else: no `npm install`, no SDK. The protocol (JSON-RPC 2.0 over stdin and
stdout, one message a line) is written out in `protocol.mjs`.

## Starting it

```
node mcp/server.mjs --models <folder> --work <folder> [--no-run] [--compilers <folder>] [--fgd <file> ...] [--wads <folder> ...] [--generators <folder>] [--materials <folder>]
```

|            |                                                                                                                              |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `--models` | The files to work from: a mod's `models` folder, say, or its `maps` folder (or the mod's own folder, for both). Only ever read. May be left out when everything is made from nothing. |
| `--work`   | Where everything made is written (models, pictures, kept scripts). Made when it is not there.                                |
| `--no-run` | Without the tool `run`, and `command` refuses what would load code (a `.mjs` module, a `layers` expression): the server then runs no code of the client's. |
| `--compilers` | The map compilers' folder (SDHLT or VHLT), for `build` of a map and for `command`'s `map-compile` (and a script's `compileMap`, as `VHLT_DIR`). `VHLT_DIR` and the PATH are looked in unless told. |
| `--fgd`    | An entity definitions file: the game's `.fgd` (Half-Life's is in the SDK, `Hammer Editor/fgd/half-life/halflife.fgd`) and the compilers' own (`sdhlt.fgd`). `build` holds a map's entities against them; `entities` lists them. Again for more. |
| `--wads`   | A game folder whose `.wad` files a map spec's `wads` name (`valve`, a mod's folder). Again for more.                            |
| `--generators` | A folder of sound and music models run on this machine (`SMAK_GENERATORS` unless told): adds the tool `generate`. `generators/README.md` says how to fill one. |
| `--materials` | A library of material photographs (`SMAK_MATERIALS` unless told; `node generators/fetch-materials.mjs <folder>` fills one with Poly Haven's CC0 textures): adds the tool `materials`, and a map's or a .wad's material may take `picture: "library:<name>"`. |

A client starts it itself; you only tell it how.

**Claude Desktop**, in `claude_desktop_config.json` (Settings, Developer, Edit Config):

```json
{
  "mcpServers": {
    "smak": {
      "command": "node",
      "args": [
        "C:/path/to/smak/mcp/server.mjs",
        "--models",
        "C:/Games/Half-Life/ts/models",
        "--work",
        "C:/Users/me/smak-work"
      ]
    }
  }
}
```

**Claude Code:**

```
claude mcp add smak -- node <path>/mcp/server.mjs --models <dir> --work <dir>
```

## The warning about `run`

**`run` runs whatever code the client's model sends, on your machine, as you.** It is Node with no sandbox: the
script can read and write any file you can and reach the network. Nothing holds it inside the two folders; the
tool's description asks the model to write to the work folder only, and that is a request, not a wall. Start
the server with `run` only for a model and a conversation you would hand a shell to. With `--no-run` the server runs no
code of the client's: it lists, describes, checks, draws, builds from specs and runs the command line's commands,
writing to the work folder only.

Every other tool takes a file only from inside `--models` or `--work` (and the game and library folders it was
given, read only), and refuses anything else in words.

## The tools

Few on purpose: a client is sent every tool's description in every conversation (about 2900 tokens for the
twelve, maps included), so the long guidance stays behind `guide` and is read only when a task needs it.

| Tool     | What it does                                                                                                                                                      | Arguments                                                                                                                                                           |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `guide`  | The kit's guide (`AGENTS.md`), cut at its headings when asked. With nothing: the list of sections, a line each, and the table of what the kit can and cannot do.  | `topic` (section numbers `"12,20"`, or words of one title), `doc` (`"api"`, `"spec"`, `"engines"`, `"maps"`, `"maps-making"`, `"maps-checks"`, `"import"`, `"items"`, `"play"`, `"editor"`, `"workflow"`, or an example's or a kit's path), `find` (the lines that hold these words) |
| `models` | The files there are: the models folder's `.mdl`, `.bsp`, `.map` and `.wad` files and everything in the work folder, with their sizes.                              | `match`                                                                                                                                                             |
| `info`   | What a model holds: bones, bodies with their body numbers, textures, animations. Of a map (`.bsp`): its size, entities, textures, light; of a `.map` or a `.wad`, what is in it. | `model`, `full` (bone places, events, attachments; a map: every entity with its keys)                                                                               |
| `check`  | The errors and warnings an engine would have with a model or a compiled map; of a `.map`, what its plan has wrong before a compile. With `walk`, a map's walk test: what a player cannot reach on foot, what stands in something solid, the openings. With `against`, a map's entities held against its mod: classes, keys, values, names, the mod's rules. | `model`, `engine` (`goldsrc`, `xash`), `walk`, `goal` (entities to tell the walk to, `"9, keeper"`), `doors` (`open`, `closed`), `against` (files of the folders, with commas: `.fgd` files, what `smak map-learn` wrote, a profile that is a `.json` file; or `goldsrc`. A profile that is a module is code: `run`)                                      |
| `render` | A picture of a model or a map, returned as an image. A map's kinds are `plan` (from above, every entity marked with its pixel), `view` (from inside), `views` (from the starts, and aimed at what the map has: its water, its lamps, each storey), `section` (a side cut along a line), `storeys` (a plan for each storey) and `openings` (a view through each doorway). | `model`, `kind` (`view`, `sheet`, `strip`, `uv`; a map: `plan`, `view`, `views`, `section`, `storeys`, `openings`), `body`, `seq`, `frame`, `side` or `yaw` / `pitch`, `zoom`, `dist`, `first`, `count`, `texture`, `at`, `z`, `from` and `to` (a section's ends, `"x y"`), `heights`, `legend`, `reach` (a plan), `size` |
| `build`  | A model, a map, textures, a sound, music, a sprite or a video from a spec (`docs/SPEC.md`, `guide { doc: "spec" }`): what a person's words, or drawing, are turned into. Built, checked (holes, gaps, faces turned inwards, parts floating apart; a map's leaks, walk, light, entities against the FGD), compiled, drawn. Says `OK` or what to fix, and what changed since the last build of the same name. Writes the result and its spec to the work folder. Runs no code of the client's. | `spec` (an object, JSON text, or a `.json` file of the folders), `reference` (a PNG drawn beside the result), `focus` (a model's parts to see close) |
| `decompile` | A compiled map made back into brush source in the work folder, with a `.wad` of the textures it carries, and compiled again (unless `compile: false`). | `map`, `name`, `compile` |
| `entities` | The entity classes of the server's FGDs, a line each; with `class`, its keys, types, defaults, choices and flags by name. | `match`, `class` |
| `run`    | Runs an ES module with Node in the work folder, with the kit importable. Returns what it printed, the files it wrote, and up to three of its PNG files as images. | `script`, `show`, `timeout` (seconds; 120 unless told, 600 at most), `name` (keep the script as `<name>.mjs`), `edits` (change a kept script in place)              |
| `command` | Any command of the command line, run as it runs there with every flag it has (`guide { topic: "The command line" }` lists them): retexture, animations, re-skins, pieces, layers, a map's entities changed and compiled, its walk test with jumps, height plans, light, measures, .wad files, imports. Files are named `work:`, `models:`, `library:`, and `game:<folder>` for a game folder of the server's; what it writes goes to the work folder; nothing outside the folders is named. | `name`, `args` (its words and flags), `show`, `timeout` |
| `file` | A file of the folders read back as what it is: words (`.map`, `.json`, `.txt`, `.fgd` ...), a picture, or a sound to listen to (`.wav`, `.mp3`, as the protocol's audio). With `text`: a text file written into the work folder (a `.map` to compile, rules for `reskin`, steps for `play`). With `to`: the file copied to that place of the work folder, as the mod lays its files out (`models/x.mdl`, `maps/x.bsp`). | `name`, `text`, `to`, `from` (a long text read on from there) |
| `page` | The person's own pages, which stay up after the call, on this machine: the viewer (`view`: models side by side, turning, animated) or the editor (`edit`: animations, events and textures by hand, its projects in the work folder). Returns the address; `stop` closes it. One of each at a time; they stop with the server. | `kind`, `files`, `port`, `stop` |
| `materials` | With `--materials` only. The library searched by words or category, each material with its real size in units; `show` draws up to twelve side by side. A map's or a .wad's material then takes one as `picture: "library:<name>"` (read only, nothing outside the library). | `match`, `category`, `show` |
| `generate` | With `--generators` only. A sound, music or a shape made by a model run on this machine, a take a seed: each written to `work:gen/<name>_s<seed>` (`.wav`, or `.obj` with the picture it was made from and its cut-out) with a sidecar `.json` (model, prompt, seed, licence). Sounds are measured at the game's rate (against a class of the game's sounds when given) and drawn one under another (kept as `work:gen/<name>_takes.png`, for the person to open); shapes are drawn beside their pictures. The first call to a model loads it (a minute or three) and keeps it loaded; later calls take seconds. A sound spec takes the chosen take as a `sample` layer, a model spec the chosen shape as a `mesh` part. Kind `segment` cuts a named subject out of a cluttered picture (detectors held to the words, then SAM 2): its mask, its cut-out and the subject alone on white, for a shape, a projection or a texture's photograph (`generators/README.md`). | `prompt`, `length` (seconds; not for a shape), `kind` (`sound`, `music`, `shape`, `segment`), `subject` (segment, or a shape from a cluttered `picture`: the thing to cut out, in words), `point` (segment: `[x, y]` on it), `model`, `seeds` (a count, or a list), `from` (the first seed), `name`, `class`; music: `bpm`, `key`, `loop`; a shape: `picture` (of the folders, in place of drawing one from the prompt), `base` (a character: its base model, whose figure in the stance it is built in the picture is drawn over, so that its limbs stand clear of its body) |

A map's `.wad` files are looked for beside it and in the models folder; when that folder is the game's own
(it has `gfx/env` and `sprites`), a view shows the sky's picture and the sprites too. Models in a map's
pictures, jumps in its walk test and a way out named for it are flags of the command line's map commands, used by
`command` (`map-plan --models`, `map-reach --jump --exit`). Changing a map's entities (`map-set`) and compiling a
`.map` written with `file` (`map-compile`) go by `command`; making one from brushes goes by a spec (`build`) or
`run` (`guide { doc: "maps" }` and `"maps-making"`).

A file is named by its path under one of the two folders. `work:pot.mdl` and `models:player/gordon.mdl` say
which; a bare `pot.mdl` is looked for in the work folder first, so that a changed model is found before the one
it was made from.

**Pictures.** A picture costs the model tokens by its area, and the client bytes by its file, so they are small
unless asked: 512 pixels on the longer side for one view or a texture, 768 for a sheet or a strip, 1024 at
most (`size`). They are sent with 32 levels of each colour in place of 256, which more than halves the file
and changes nothing a model is checked for. A picture a script wrote and asked to `show` is treated the same; the file
on the disk is left as the script wrote it.

**Commands.** `command` is the command line itself, run in the work folder: a client has every command and every
flag the day the command line has it, and nothing about them is written twice. `command { name: "retexture", args:
["models:barney.mdl", "vest.bmp", "work:vest.png", "-o", "barney_vest.mdl"] }` is `smak retexture ...`; what it
prints comes back, then the files it wrote, then up to three of the pictures it wrote. `view` and `edit` stay up,
so they are `page`, and the server is not run from itself.

**Scripts.** There is no tool for each thing the kit does, because building a shape or painting by place takes
functions (a colour for every pixel, a ring for every height), and a function is written in code. A script
imports the kit by name:

```js
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { paint, check, sheet, png, workshop } from "smak"; // where the guide writes "./smak/src/index.mjs"
import { sword } from "smak/kits/swordkit"; // also "smak/workshop", "smak/src/<module>"

const src = readFileSync(join(process.env.SMAK_MODELS, "player/gordon.mdl")); // the models folder
writeFileSync("out.mdl", src); // the working folder is --work (also process.env.SMAK_WORK)
```

`"smak"` resolves because the server puts a link to the kit at `<work>/node_modules/smak` the first time `run`
is called (a junction on Windows, which needs no administrator's rights; a symbolic link elsewhere). The
script's own file is written to the work folder and removed after the run, unless it was given a `name`; a
named script stays, and a later one can `import "./<name>.mjs"`. A named script is also changed without being
sent again: `run` with its `name` and `edits: [{ old, new }]` (each `old` must be in the script exactly once)
changes it in place and runs it; with the `name` alone it runs as kept. What it prints comes back cut to 6000
characters a stream (its start and its end are kept), without the lines of a stack trace that are inside Node.

## Working with a person

A person who asks for an asset stays to look at it, and gets it right over a few rounds. `docs/WORKFLOWS.md`
(`guide { doc: "workflow", topic: "sound" }`) says, for each kind (a model, a weapon, a character, a map,
textures, a sprite, a sound, music, a video), what to ask first, the checkpoints where the client shows the
person the pictures or the sound and waits before the next costly step, how to turn their notes into the next
round, and what to hand over when they say ship it. The server's instructions send the client there.

The server also offers **prompts**, the starting messages a client lists in its menu (in Claude Code, `/mcp__smak__make-sound`):
`make-model`, `make-weapon`, `make-character`, `make-map`, `make-sound`, `make-textures` and `make-sprite`. Each
takes the person's request in their own words (optional) and starts the conversation by naming its workflow.

## A session

What a person might ask, and the calls a client makes for it.

> A cyberpunk noodle bar for my map: a counter with stools, a neon sign of a bowl, lanterns.

1. `guide { doc: "spec" }` → how a spec is written; `examples/prompts/13-map-noodle-bar` is this very case.
2. `entities { match: "light" }`, `entities { class: "func_breakable" }` → the classes and keys to use.
3. `build { spec: {...} }` → `NOT OK`, `FAULT walk: ... the health kit ... only by a jump`: the counter too
   high. Change it, `build` again → `OK`, the plan and the views.
4. > Looks good, now add a second fridge next to the first.

   `build` with the fridge given an `id` and a new one `at: { beside: "fridge", side: "west" }` → `CHANGED
   ... things added: furniture fridge #2 ...; 21 rooms and things are where they were`.


> Make me a small wooden barrel prop with two iron hoops.

1. `guide` → the list of sections and the table of what the kit can do.
2. `guide { topic: "12,20,7" }` → "A whole new model", "Making a shape", "Conventions".
3. `run { script: "...", show: ["barrel.png"] }` → a script that turns the barrel in the workshop, paints its
   zones, writes `barrel.mdl` with `buildMdl`, prints what `check` says and writes a `sheet`. The answer has
   the printed lines, `written: barrel.mdl (...), barrel.png (...)` and the picture.
4. The picture shows the hoops too thin: `run` again with the script changed.
5. `check { model: "barrel.mdl" }`, then `render { model: "barrel.mdl", side: "below" }` to see the bottom.
6. The client tells the person where `barrel.mdl` is, what `check` said, and shows the picture.

> The security guard in my mod: make his vest dark green, and leave his skin and trousers alone.

1. `models { match: "barney" }`, `info { model: "barney.mdl" }` → the textures and the body numbers.
2. `render { model: "barney.mdl", kind: "sheet" }`, `render { model: "barney.mdl", kind: "uv", texture: "2" }`.
3. `guide { topic: "10,14" }` → "A new texture on an existing model", "Wear, damage and markings by place".
4. `run { script: "...", show: ["after.png"] }` → `paint` by place over the vest, the result written to the work
   folder and drawn from four sides.
5. `check { model: "barney_green.mdl" }`, and the report to the person: the file, what changed, the picture,
   and what the pictures cannot show (the game's own lighting).

## What is where

| File           |                                                                                                     |
| -------------- | --------------------------------------------------------------------------------------------------- |
| `server.mjs`   | The entry: the flags, the two folders, the start.                                                   |
| `protocol.mjs` | JSON-RPC over two streams: `initialize`, `ping`, `tools/list`, `tools/call`, `prompts/list`, `prompts/get`, and a call taken back. |
| `prompts.mjs`  | The prompts: a starting message for each kind of asset, naming its workflow in `docs/WORKFLOWS.md`. |
| `folders.mjs`  | The rule that a named file is inside `--models` or `--work`.                                        |
| `guide.mjs`    | The guide and the reference cut at their headings, read from the kit's own files each time.         |
| `tools.mjs`    | The tools: their descriptions as a client is told them, and `models`, `info`, `check`, `render`, `build`, `entities`. |
| `run.mjs`      | The tool `run`: the link to the kit, the child process, its time limit, what it wrote.              |
| `command.mjs`  | The tool `command`: a command line's words with their names resolved to the folders, run through `run.mjs`'s child process. |
| `file.mjs`     | The tool `file`: a file read back as words, a picture or a sound; a text file written; a file copied. |
| `page.mjs`     | The tool `page`: the viewer or the editor started inside the server, and stopped.                   |
| `materials.mjs` | The tool `materials`: the library's index searched, its pictures drawn. |
| `generate.mjs` | The tool `generate`: the generators folder's manifest, the worker (`generators/worker.py`) kept loaded, the takes and their sidecars. |

The cases that start the server and speak to it are in `test/16-mcp.mjs`, `test/22-maps-draw.mjs`,
`test/46-specs.mjs`, `test/57-generate.mjs` (with a stand-in for the model), `test/58-materials.mjs` and
`test/63-mcp-command.mjs` (`command`, `file`, `page`); `examples/prompts/run.mjs` builds every worked case through it, and
`examples/prompts/blind.mjs` hands a case's words to a fresh agent that has nothing else.
