# Playing a map in the game, and testing by what the game says

`smak play` opens a browser build of the Xash3D engine, loads a map, gets into the game as the mod's profile
says, does a list of steps, and writes down what happened: pictures, a sheet of them, and **every line the
game said, with its time**. A step can wait for a line and a run can be held to lines, so a test passes or
fails by text and nobody has to read its pictures.

It needs two things that are not part of this kit: a browser build of the engine served at an address, and
Playwright (`npm install playwright` in a folder of your own; name the folder with `--playwright` or
`PLAYWRIGHT_DIR`). The library is `src/play.mjs` (`import { play } from "smak"`); `docs/API.md` has its
functions.

## The commands

```
smak play <url> --map yard --steps steps.json -o work/run1 --mod <profile> --game <folder> --playwright <folder>
```

One run from a cold start. It ends with 0 when every expectation held, with 1 when one did not or the run
stopped. Several `--map` (each with the `--steps` given in the same place) are several runs in one start of
the engine, each in a folder of its own under `-o`.

```
smak play <url> --serve [--port 8098] --mod <profile> --game <folder> --playwright <folder>
smak play http://127.0.0.1:8098 --attach --map yard --steps steps.json -o work/run1
smak play http://127.0.0.1:8098 --attach --map road --steps more.json -o work/run2 --expect "Skeleton .* dies"
smak play http://127.0.0.1:8098 --attach --stay --steps again.json -o work/run3
smak play http://127.0.0.1:8098 --attach --close
```

**A session.** `--serve` starts the game once and keeps it; every `--attach` is a run in it that pays for its
map and not for the engine. Measured in a local build drawn in software (2026-10-13): the engine is up in 8
to 9 seconds; a small map has loaded 8 seconds after `map` the first time and 4 to 6 after that; the player
is in the game a tenth of a second after the menu's click. A cold run is in the game after 18 seconds and a
run in a session after 6, where the fixed waits of 0.11 took 79.

- `--map <name>` loads the map afresh, even the one the session is in (monsters back, doors shut).
- `--stay` loads nothing: the steps go on where the last run left the player. A file `--put` with it is
  written without leaving the map (the game reads it when it next opens it), and the run says so.
- `--put <place>=<file>` writes a file into the running engine before the map loads (`--put
  msc/maps/yard.bsp=build/yard.bsp`): a map rebuilt, a script pack repacked or a save put back is tried
  without starting the engine again. The map the session is in is left first, because a game may write its own
  files as a map ends. What an engine reads only once is not changed by this: a game's list of items, read
  when its libraries load, wants a new session; so may a model the engine still holds.
- `--over <place>=<folder>`: a folder laid over the game's files (`--over msc=content/assets/msc`). Given
  to `--serve`, the session marks every file in it (its size and time) as the engine starts; a run
  `--attach`ed with the same `--over` puts every file of it that is new or changed since, and the mark moves
  on. A game that is up reads a model once (one it failed to find stays failed): this is how a model rebuilt
  is tried in the game that is up. A folder the session never marked is marked by the first run that names
  it, and nothing of it is put then. A run that names no `--over` puts nothing of it: what changed waits.
- `--port <n>` (with `--serve`): several sessions side by side, each with its own engine and port, for
  several agents testing at once.
- `--expect <pattern>`, `--expect-not <pattern>`: lines the whole run is held to.
- `--no-sheet`, `--show` (the browser's window seen), `--loads <ms>`, `--width`, `--height`.

**A long run** (a fight of ten minutes) is answered as it goes: the session sends its answer's headers at
once, a line for each thing done, and a beat (`{ "beat": seconds }`) every 30 seconds in which the run says
nothing; `--attach` reads the answer with Node's own `http` and no time limit. Before 0.15 it read it with
`fetch`, which gives up after 300 seconds of silence: a run of over five minutes ended in the attaching
process with `FAILED: terminated` while it went on in the game.

What a run leaves in its folder: `NN_name.png` for each picture, `sheet.png` (all of them in one, each under
its name), `log.txt` and `log.jsonl` (what was heard), `result.json` (the steps with their times, the
expectations, `passed`, and the `failure` when it stopped).

## The steps

A JSON list. Each step is an object with at most one thing to do:

| Step | What it does |
| --- | --- |
| `{ "command": "noclip" }` | a console command, or a list of them |
| `{ "say": "hail" }` | said as the profile says a thing is said |
| `{ "walk": 2000 }` | forward for that many milliseconds; `"to": "back"`, `"left"`, `"right"` |
| `{ "turn": 90 }` | 90 degrees to the left (under 0: right). Exact: the yaw is read, added to and set |
| `{ "face": 90 }` | turned to that yaw: 0 looks along +x, 90 along +y |
| `{ "look": -30 }` | looking 30 degrees down (over 0: up; 0: level). `face` and `look` may share a step |
| `{ "button": "use", "ms": 200 }` | one of the game's buttons held: `+use`, the wait, `-use` |
| `{ "mouse": "left", "ms": 2500 }` | a button of the mouse held that long: `left`, `right`, `middle`. **A game may charge a blow while the button is held and strike only when it is let go** (Master Sword does: a held left button swings nothing, and a wall that breaks is broken by taps): use `tap` |
| `{ "mouseDown": "left" }` ... `{ "mouseUp": "left" }` | held while the steps between are done (let go at the run's end if not before) |
| `{ "tap": "left", "times": 5, "every": 700 }` | the button pressed and let go, `times` over (1), `every` ms from one tap's beginning to the next (700), down `ms` each (200). What is left of `every` is waited after the last, so taps in steps of their own keep time. With `until`, tapped again every `every` until the line comes |
| `{ "faceAt": [1872, 976, 40] }` | the view turned to a place, yaw and pitch, from the player's eyes (his origin and the profile's `eye`, 28) |
| `{ "faceAt": "target", "radius": 600 }` | turned to the nearest living enemy, as the profile's `play.target` finds one (768 round unless told); the run stops if there is none |
| `{ "hold": "w", "ms": 2000 }`, `{ "press": "Enter" }`, `{ "click": [512, 330] }` | a key held, a key pressed, a click on the page |
| `{ "goto": [512, 96, 36] }` | the player put at that place (the middle of his box: the floor and 36), by the profile's command; then read back, and the run stops if he is not there |
| `{ "where": "gate" }` | a line in the log: `where gate: origin 512 96 36, yaw 90, pitch -30` |
| `{ "map": "road" }` | another map loaded and entered, in the same run |
| `{ "expect": "HIT! .* holy damage" }` | the run fails unless a line heard matches |
| `{ "expectNot": "Script Error" }` | the run fails if a line heard matches |
| `{ "repeat": [steps], "until": "dies", "within": 60000 }` | the steps done again and again until a line; or `"times": 4`, or `"for": 20000` (ms). With `until` alone the run stops when the line never comes in `within` (30000); with `until` and `times` or `for` the block ends at whichever comes first and stops nothing. Its steps are in the log as `3.1`, `3.2`... once for each time they were done |
| `{ "fight": { "heal": 0.5 }, "until": "is quiet", "within": 600000 }` | the nearest enemy found, faced and struck, again and again, until a line (or `"for"` a time): see **A fight** below |

and any step may carry:

| Beside | What it does |
| --- | --- |
| `"until": "Skeleton .* dies"` | after the step, wait for a line the game says, and not for the clock. From where it hears: see below |
| `"within": 20000` | the longest `until` waits (30000). Past it the run stops and says what it waited for and the last lines heard. With `expect`: how long the line is given to come (unless told, it has to be there already); with `expectNot`: how long it is watched for |
| `"every": 1000` | with `until`: the step is done again that often until the line comes (a click a menu does not take until it is drawn) |
| `"since": "map"` | with `expect`, `expectNot`: read the lines since the run began (`"run"`, the default), since the map last loaded (`"map"`), since this step began (`"step"`), or since the picture of that name. With `until`: the same, and `"deed"` (since the last step that did a thing began) |
| `"wait": 1500` | milliseconds waited after it (1000 after a step that does something and has no `until`) |
| `"shot": "gate"` | a picture taken after the wait |

So `{ "wait": 5000 }` only waits, `{ "shot": "here" }` only takes a picture, `{ "until": "dies" }` only waits
for a line.

**From where an `until` hears.** A step that DOES a thing and has `until` hears from its own beginning: the
line it waits for is the answer to what it did, and a line said before it acted is not that answer. A step
that ONLY waits (`{ "until": ... }`, with a picture or not) hears from where the last step that did a thing
began. So in

```json
[
  { "button": "use", "until": "The altar sinks", "wait": 1000 },
  { "until": "the dead get up" },
  { "until": "a door opens" }
]
```

a line the game said in the same instant as "The altar sinks", or while the first step was still at its
wait, is heard by the waits after it, however many there are; a step that only reads (`where`, `expect`)
between them changes nothing. And no `until` stops at a line another `until` has stopped at: two waits for
`"HIT"` want two hits. `"since"` says otherwise where it is wanted (`"run"`, `"map"`, `"step"`, `"deed"`, a
picture's name). A pattern is a regular expression as text, matched as written (capitals count); `"/flame
sinks/i"` gives flags.

A test, whole:

```json
[
  { "look": -55 },
  { "button": "use", "ms": 200, "until": "The trial chest gives you blunt_lantern", "every": 1500 },
  { "goto": [272, 48, 36] },
  { "face": 0, "look": -5, "shot": "at_dummy" },
  { "mouse": "right", "ms": 250, "until": "You kindle the lantern", "shot": "kindled" },
  { "mouseDown": "left" },
  { "until": "holy damage", "within": 15000 },
  { "until": "The flame sinks", "within": 90000, "shot": "sunk" },
  { "mouseUp": "left" },
  { "expect": "HIT! .* holy damage" },
  { "expectNot": "Script Error|PAGE ERROR" }
]
```

## A fight

```json
[
  { "goto": [1812, 976, 36] },
  { "faceAt": [1872, 976, 30] },
  { "button": "use", "ms": 200, "until": "The altar sinks", "every": 1500 },
  { "fight": { "heal": 0.5, "post": [1812, 976, 36] }, "until": "The round tomb is quiet", "within": 900000 },
  { "expect": "^fight \\(step 4\\): .* 0 deaths" }
]
```

A `fight` goes round and round: it asks the game for the nearest living enemy (the profile's `play.target`),
turns the player's view to it (yaw and pitch, as `faceAt`), and strikes one blow (the profile's
`play.fight.attack`: for Master Sword a tap of the left button). It ends when its line comes (`until`, with
`within` as ever: the run stops if the line never comes) or after `for` milliseconds, which stops nothing. In
its object:

| Field | What it does |
| --- | --- |
| `radius` | how far round the player an enemy is looked for (768) |
| `heal` | a share of the player's health (`0.5`): under it he is healed by the profile's `play.heal`, once a wound |
| `post` | `[x, y, z]`: where he is put back (by the profile's `play.goto`) when he has died and risen |
| `chase` | a distance, the reach of a blow: an enemy farther off than it is walked at (+forward) before the blow, for as long as the way takes at 200 units a second (at most 1.5 s a round: one that keeps away is followed); one still over 100 beyond it, with nobody on the player, is not struck at. An enemy within it takes three blows a round before he is asked for again |
| `quiet` | milliseconds: the fight is over when no enemy has been found for that long, which stops nothing (a fight that has no line to wait for) |
| `attack` | the steps of one blow, for the profile's |
| `prefer` | a word of an enemy's name, or a list of them (`"lantern"`, `["lantern", "guard"]`): the enemy whose name holds the first word is struck first, wherever he stands within the radius; then the second word's; the nearest when nobody has one. Matched without regard to capitals. It needs the profile's `play.target.prefer` (below). One that four sidesteps got no nearer (behind others in a corridor) is let be for 20 seconds, the nearest fought meanwhile (the profile's `unprefer`), and then asked for again: `let be N times` in the line |
| `sidestep` | milliseconds of a step to the side (600), or `false` for none. With `chase`, when the enemy chased is held up (two blows swung at him landed on others in the way, or three rounds brought him no nearer by 16) the fight strafes that long, twice to one side and then twice to the other, and walks on |
| `dodge` | the pattern of a line that warns of a blow to a place, or `{ line, far, ms, hold }`. When it is heard the player steps away: from the place the line names in the groups `(?<x>...)` and `(?<y>...)` until he is `far` (150) off it, or (no place named, or he stands on it) to one side; at most `ms` (1500). For `hold` (2000) after it he strikes and does not chase, so as not to walk back in |

**Choosing and moving.** A fight without these strikes whoever is nearest, never gets past a crowd and never
steps out of anything, so what it counts is the worst case. `prefer` goes for the healer first; `sidestep`
(on unless told, wherever `chase` is) gets round a front line to it; `dodge` steps out of a marked place.
**A dodge by a line is an aid for tests only**: a game that shows its warning as a picture (Master Sword's
First Warden marks the ground with a sprite and says nothing) is heard by a test only through a copy of the
monster's script that says it (`WARDEN marks the ground under <name> at <x> <y>` in msr-web's test copy). A
player sees the sprite; the bot hears the line. What a fight with `dodge` counts is how a player who sees
every mark fares. No `block`: Master Sword says nothing before a blow lands (its lines come after the hit),
so there is nothing to block on; a profile cannot name a warning that is not there.

What happened is a line in the log, of the kind `fight` (an `expect` can be held to it), printed at the end
of the run, and `fights` in `result.json`, counted by the profile's patterns of the game's lines:

```
fight (step 12): 129.4 s, ended by the line "The round tomb is quiet at last. ..."; 97 blows in 97 rounds;
dealt 80 hits, 776.5 in all (0.62 hits a second), 11 missed; taken 500 hits, 4009.5 in all (30.99 a second);
19 heals, 0 deaths; slain 5: the Enraged Skeleton x2, the Fallen Knight, the Awakened Guardian x2; enemies at
once: 5 at most, 3.53 on average; on the player: 5 at most, 3.36 on average; health 104 at its least of 339
```

With `prefer`, `chase` or `dodge` the line goes on: `; preferred (lantern): 2 of the 3 slain, faced in 60
of 98 rounds, let be 1 time (not got at); 3 sidesteps round others in the way; dodged 9 of 11 warnings (2 heard off the place already)`,
and `result.json`'s fight has `prefer: { words, slain, rounds, letBe }`, `sidesteps` and `dodge: { warned, dodged,
clear }`. Each sidestep and each dodge is a line of the log (`step 4: a sidestep to the right, round what
stands between him and Lantern-bearer (212.4 off)`, `step 4: dodged "WARDEN marks the ground under Deoroot at
1700 1950": from 12.3 to 151.6 off 1700 1950 in 700 ms`).

`enemies at once` are those the game counted within the radius each time it was asked; `on the player` those
it counts as on him (Master Sword's helper: within 128), when the profile reads such a count. A death is the
profile's `died` line; the fight then waits for the player's health to come back (he has risen) with its
blows going on (a game may want a button to rise), and puts him at `post`.

An expectation that does not hold does not stop the run: every one is looked at, and the run ends `FAILED`
with each on a line (`PASS  expect /.../ (step 10): the line that decided`). A line an `until` waited for in
vain does stop it: the steps after it would be done in a game that is not where they think.

## What is heard

`log.txt` has a line for everything, with its seconds from the run's start and its kind:

```
[   13.668] HUDInfoMsg ent_owner CHARGEPROBE blunt begin
[   13.877] HUDInfoMsg You attack a Trial Dummy. (61/0) HIT! 35.5 blunt damage.
[   14.584] TextMsg    TRIAL get target haseffect = 0
[   15.002] console    [19:22:41] Host_EndGame: disconnected from server
[   15.100] where      where gate: origin 512 96 36, yaw 90, pitch -30
[   15.101] play       15.0 s    0.1 s  {"where":"gate"}
```

- `console`: the page's console, which is the engine's; `error`: an error of the page (`PAGE ERROR: ...`).
- **A message's name**: what the server told the player. A GoldSrc game speaks to its players in "user
  messages": HUD text, hints, chat. The browser driver listens to the ones the profile names, in the engine's
  own table of them, and the profile reads their bytes (`play.messages`). The SDK's two, `TextMsg` (what a
  script or the game prints to a player's console or the middle of his screen) and `SayText`, are read for
  any game. Nothing of the game is changed for this (`src/play-browser.mjs` says how it is done).
- `where`: a `where` step's answer. `fight`: what a fight came to. `play`: the run's own notes (each step as
  it ended, each expectation, how often a block went round); these are never matched by an `until` or an
  expectation.

`log.jsonl` is the same, one JSON object a line: `{ "t": 13.877, "time": "2026-10-13T19:22:55.012Z", "kind":
"HUDInfoMsg", "text": "..." }`.

What is NOT heard: what a game draws without telling (a health bar's length, a model's animation), and what a
build prints nowhere (Master Sword's script command `dbg` is compiled out of a release build; `consolemsg`
and the `playermessage` family are heard).

## The profile's part

Everything that is one game's is the `play` field of its profile (`docs/MAPS-MAKING.md`, "A mod's profile"):

```js
play: {
  enter: [{ click: [512, 330], every: 1000, until: "^Welcome to Master Sword", within: 60000 }],
  say: ["cmd say_text 1 {text}"],
  loads: 90000,                                    // the longest a map is given to load
  loaded: "Custom resource propagation complete",  // the line that says it has: waited for, not the clock
  goto: ["trial goto {x} {y} {z}"],                // the game's command that puts the player at a place, if it has one
  heal: ["trial heal"],                            // the command that gives his health back, if it has one
  target: {                                        // how the nearest living enemy is found, if the game can say
    commands: ["trial nearest {radius}"],
    answer: /^TRIAL nearest (?<id>\S+) hp (?<hp>\S+) at \((?<x>[-\d.]+),(?<y>[-\d.]+),(?<z>[-\d.]+)\) far (?<far>\S+) count (?<count>\d+) close (?<close>\d+) name (?<name>.*)$/,
    none: /^TRIAL nearest none/,
    prefer: ["trial prefer {word}"],               // the commands after which the answer is the nearest whose name holds {word}
    unprefer: ["trial prefer none"],               // and those that undo it (sent when a fight that preferred ends)
  },
  fight: {                                         // a blow, and the lines a fight is counted by
    attack: [{ tap: "left", ms: 200, every: 700 }],
    dealt: /^You attack .*HIT! ([\d.]+)/, missed: /^You attack .*MISS!/, taken: / attacks you\..*HIT! ([\d.]+)/,
    slain: /^You've slain (.*)$/, died: / has fallen!$/, health: /^HP (\d+)$/, maxHealth: /^MaxHP (\d+)$/,
  },
  messages: { HUDInfoMsg: hudInfoLines, TextMsg: "textmsg", SayText: "saytext" },
  eye: 28, yawspeed: 210, screen: [1024, 768],
}
```

`target` may instead be a function `({ radius, command, heard, view, prefer })` that resolves to `{ origin: [x, y, z],
name, hp, far, count, close }` or null: a game whose engine can be asked another way. Its `answer` names the
place to aim at in the groups `x`, `y`, `z` (the middle of the enemy, for a blow); the rest are read when they
are there.

`messages` gives each user message the way its bytes are read: `"textmsg"`, `"saytext"`, `"strings"` (every
string in it, for a message whose layout you do not know yet), or a function of the bytes that gives a line,
several, or nothing. To find a game's messages: its server registers them by name (`REG_USER_MSG`), and
`"strings"` on a name shows what it carries. `profiles/mastersword.mjs` is a whole example, with where each
fact is from.

With no profile (`GOLDSRC`) nothing is clicked to enter, a thing is said with `say`, the engine's own line is
waited for, `TextMsg` and `SayText` are read, and a `goto` step is refused: the engine has no command that
puts a player at a place. The eyes are 28 above the origin and a blow is `+attack`; a `fight` and `faceAt:
"target"` are refused, for the engine says nothing of where an enemy is.

## From a script

```js
import { play } from "./smak/src/index.mjs";
const driver = play.browserDriver({ url, playwright: "C:/tools/browser", messages: play.messagesOf(mod) });
const session = play.playSession({ driver, mod });
const first = await session.run({ map: "yard", steps, out: "work/first", expect: ["holy damage"] });
const second = await session.run({ map: "road", steps: more, out: "work/second" });
await session.close();
first.passed; first.expectations; first.lines; first.pictures; first.sheet;
```

`play.play({ driver, map, steps, out, mod })` is one run with the driver closed after it.
`play.serveSession({ session, port })` and `play.attachSession(address, run)` are the session shared between
processes. `play.sheetOf(files, { cols, shrink })` is the sheet by itself. A driver of your own is a plain
object (`ready, command, keyDown, keyUp, press, click, wait, shot, log, close`); with `lines(from)` it can be
waited on and expected of, with `view()` and `look()` it turns exactly, with `mouseDown`/`mouseUp`, `put` and
`leave` it does the rest.

## When it does not work

| What you see | Why, and what to do |
| --- | --- |
| `the map X had not loaded after N seconds: the game never said /.../` | The map did not load. The last lines heard are in the sentence and in `log.txt`: a missing file, a map with no place to put a player |
| `the game never said /Welcome.../ ... (at the profile's enter step 1)` | The menu was not got through. Open `00_loaded.png`: is the menu where the profile clicks? |
| `the game never said /.../ in the N seconds it was given` | The line did not come. The sentence ends with the last lines that did: is the pattern right (capitals, a full stop), is the thing in reach? |
| `the player was to be put at ... and is at ...` | The profile's `goto` command did nothing: this map does not have it |
| `the view cannot be read: this build of the engine does not export pfnSPR_Load...` | The view cannot be read or set in this build. A `turn` is then by time (the game's `+left` held: about right only, and the log says so); `face`, `look` and `where` stop the run |
| A message named in the profile is never heard | It is not in the engine's table (the game does not register it), or the game's client takes it by no function. `driver.unheard()` lists them |
| A new item, or a script's new model, is not there after `--put` | The game read its list once, when it started: close the session and start it again |
| `the game never said /x/ in the N seconds its repeat was given (P passes)` | A `repeat` (or a `fight`) with `until` alone ran out of `within`. Give `for` or `times` beside `until` for a block that may end without its line |
| `the game did not answer "trial nearest 768" ... (the profile's play.target)` | The map has not the command that finds an enemy: for Master Sword, the trial helper script (tools/playtest.mjs adds it to any map's map_startup) |
| A fight lands few blows | `chase` an enemy that keeps off; a `radius` that takes in enemies behind a wall aims at them. The log has the answer of each `target` asked, and `enemies at once` says how many there were |
| A held mouse button does nothing in the game | It charges a blow: `tap` |
| A change to the kit (or to a profile) does nothing in `--attach` runs | The steps are done by the serving process, with the code it started with: close the session and serve it again |
| `FAILED: terminated` after five minutes (0.14 and before) | `fetch` gave up on a long run's answer. 0.15 reads it with no limit; update the kit |
| `play: the session at ... went away during the run (ECONNRESET)` | The serving process ended in the run (closed, killed, out of memory). Its `session.log`, or the terminal that serves, says why |
| `step 4 prefers an enemy, and the profile names no way to ask the game for one` | The profile's `play.target` has no `prefer` commands: the game cannot be asked. Add them, or a `target` function that takes `prefer` |
| A fight with `prefer` strikes the others all the same | The preferred one is out of reach behind them: give `chase` (and its sidesteps). Or the word is not in his name as the game says it (`trial nearest`'s `name`) |
