// A map seen in the game itself: the game is entered, the player walks, turns, speaks, and pictures are taken;
// what the game SAYS is heard, waited for and asserted, so that a run passes or fails without a person
// reading its pictures.
//
//   import { play, maps } from "./smak/src/index.mjs";
//   const driver = play.browserDriver({ url: "http://127.0.0.1:8097/?args=", playwright: "C:/tools/browser" });
//   const run = await play.play({ driver, map: "orchard", out: "work/seen", mod, steps: [
//     { walk: 3000, shot: "walked" },                 // forward for three seconds, then a picture
//     { face: 90, look: -20 },                        // look along +y and 20 degrees down, exactly
//     { say: "hail", until: "Keeper: .*welcome" },    // said as the mod's profile says a thing is said;
//                                                     // then waited for, by what the game answers
//     { expect: "You receive" },                      // the run FAILS unless the game said so
//   ] });
//   run.pictures;                                     // the PNG files, in the order taken
//   run.passed, run.expectations;                     // whether every expectation held, and each one
//   run.logFile;                                      // every line the game said, with its time
//
// The parts, kept apart:
//   playOf         a list of steps, as a person or an agent writes them, checked and made plain actions
//   playSession    a game kept up: many runs and many maps against one engine, which is started once
//   play           one run from a cold start: the engine waited for, the map, the steps, the driver closed
//   browserDriver  the one driver the kit ships: a browser build of the Xash3D engine, driven with
//                  Playwright (src/play-browser.mjs)
//   serveSession, attachSession   a session kept by one process and used by others (src/play-session.mjs)
//   sheetOf        a run's pictures in one, each with its name (src/play-sheet.mjs)
//
// What belongs to one game (how its menu is got through, how a thing is said so that an NPC hears it, what
// line says a map has loaded, how its messages are read) is the `play` field of the mod's profile
// (maps/mod.mjs), and nothing of it is here.
//
// WHERE THE FACTS ARE FROM. The engine is Xash3D FWGS built for the browser. A console command is run by the
// engine's own Cmd_ExecuteString (engine/common/cmd.c), called through the page's Emscripten module. A player
// moves while one of the client library's buttons is down: `+forward`, `+back`, `+moveleft`, `+moveright`,
// `+left`, `+right`, `+jump`, `+duck`, `+use`, `+attack`, each let go by the same word with `-` (the SDK's
// cl_dll/input.cpp, InitInput). Typed with no key's number after it, a `+` command is "typed manually at the
// console for continuous down" (KeyDown, same file): the button stays down until its `-` comes. So a walk is
// `+forward`, a wait, `-forward`, whatever keys the person has bound.
//
// TIME. Measured 2026-10-13 in a local build drawn in software: the engine is up 8 seconds after the page
// is opened, a small map has loaded 8 seconds after `map <name>` (4 the second time in one session), and the
// player is in the game 3 seconds after the menu's click. The rest of a run of old was waiting by the clock:
// a profile that names the line a loaded map prints (`play.loaded`) and gives its `enter` steps an `until`
// waits for the game instead. A picture costs about 1.6 seconds there; text costs nothing.
//
// TURNING. A driver that can set the view (`look`, as the browser driver can) turns exactly: `turn`, `face`
// and `look` are set and read back in degrees. Without it a `turn` is by time and only about right: `+left`
// turns the view by cl_yawspeed degrees a second (input.cpp, CL_AdjustAngles: 210 unless the person changed
// it), counted frame by frame, so a turn is out by up to a frame's worth and does not add up over several.
//
// GOING TO A PLACE. Xash3D FWGS has no command that puts the player at a place (no `setpos`: looked for in
// engine/server/sv_client.c and engine/client/cl_main.c, 2026-10-13). A game may have one of its own, and
// its profile names it (`play.goto`); then `{ goto: [x, y, z] }` runs it and, where the driver knows where
// the player stands, makes sure he is there. Without one: walk, or `{ command: ["sv_cheats 1", "noclip"] }`
// and fly, which a listen server allows, with `{ where: "name" }` to read the place as you go.
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { GOLDSRC, modOf } from "./maps/mod.mjs";
import { sheetOf } from "./play-sheet.mjs";
import { MOUSE_BUTTONS } from "./play-browser.mjs";

export { SOFTWARE_GL, playwrightFrom, browserDriver } from "./play-browser.mjs";
export { sheetOf } from "./play-sheet.mjs";
export { serveSession, attachSession, sessionState, closeSession, SESSION_PORT } from "./play-session.mjs";

/** What a step may do: one of these, or nothing but a wait and a picture. */
const KINDS = [
  ...["command", "say", "walk", "turn", "button", "hold", "press", "click"],
  ...["mouse", "mouseDown", "mouseUp", "tap", "look", "face", "faceAt", "goto", "where", "map"],
  ...["expect", "expectNot", "repeat", "fight"],
];
/** What a step may hold beside its kind, and which kinds take `ms` and `to`. */
const BESIDE = ["wait", "shot", "ms", "to", "until", "within", "every", "since", "times", "for", "radius"];
const TAKES_MS = ["button", "hold", "mouse", "tap"];
/** The kinds that hold steps of their own and end by a line, a count or a time. */
const LOOPS = ["repeat", "fight"];
/** The lines of a fight a profile's `play.fight` may give the pattern of. */
const FIGHT_LINES = ["dealt", "taken", "missed", "slain", "died", "health", "maxHealth"];
/** What a `fight` step may say in its object. */
const FIGHT = ["radius", "heal", "post", "attack", "chase", "quiet", "prefer", "sidestep", "dodge"];
/** What a fight's `dodge` may say in its object. */
const DODGE = ["line", "far", "ms", "hold"];
/** A word of an enemy's name a fight prefers: what a game's command takes as one word. */
const WORD = /^[A-Za-z0-9_-]+$/;
/** Milliseconds of one sidestep round a crowd; how far a fight goes from a place it was warned of, the longest
 * it takes to, and how long after it walks at nobody; units a chase must gain on its enemy to be getting on. */
const SIDESTEP = 600;
const DODGE_FAR = 150;
const DODGE_MS = 1500;
const DODGE_HOLD = 2000;
const GAINED = 16;
/** A chase's walk: units a second it is timed by, the longest one step of it, and how far beyond `chase` the
 * enemy may still be for the blow after it to be struck when nobody else is on the player. */
const PACE = 200;
const CHASE_MOST = 1500;
const OUT_OF_REACH = 100;
/** Blows a round strikes at an enemy within `chase` before it asks for him again. */
const FLURRY = 3;
/** Sidesteps after which a preferred enemy who comes no nearer is let be, and for how long (milliseconds). */
const LET_BE_AFTER = 4;
const LET_BE = 20000;
/** The kinds that only read: nothing is done to the game, so no wait follows them unless one is given. */
const READS = ["where", "expect", "expectNot"];
/** Where a walk goes, as the client library's buttons name it (the SDK's cl_dll/input.cpp). */
const WALKS = { forward: "forward", back: "back", left: "moveleft", right: "moveright" };
/** Milliseconds waited after a step that does something, unless the step says: a frame or two to show it. */
const PAUSE = 1000;
/** How long a key is held when a `hold` step does not say. */
const HOLD = 1000;
/** A tap of the mouse: how long its button is down, and from one tap's beginning to the next's. */
const TAP = 200;
const TAP_EVERY = 700;
/** How far round the player a `fight` and a `faceAt: "target"` look for an enemy unless told. */
const RADIUS = 768;
/** Milliseconds a profile's `play.target` is given to answer. */
const TARGET_WITHIN = 3000;
/** Milliseconds a fallen player is given to rise, and a fight waits where it finds no enemy. */
const RISES = 30000;
const IDLE = 300;
/** Milliseconds between the commands of one step, so that each is taken in a frame of its own. */
const BETWEEN = 150;
/** Milliseconds an `until` waits for its line unless the step says, and between two looks for it. */
const WITHIN = 30000;
const POLL = 100;
/** Milliseconds a map is given to be left before files are put into the engine. */
const LEAVES = 700;
/** How near the place asked for a `goto` has to bring the player, across and in height, and how long it has. */
const GOTO_NEAR = 16;
const GOTO_NEAR_Z = 72;
const GOTO_WITHIN = 3000;
/** A map's name and a picture's, as they may be written: nothing a console or a file system minds. */
const MAP_NAME = /^[A-Za-z0-9_][A-Za-z0-9_\-/.]*$/;
const SHOT_NAME = /^[A-Za-z0-9_-]+$/;
const BUTTON_NAME = /^[a-z][a-z0-9_]*$/;
/** From where an expectation reads, beside a picture's name; and an `until`, which may also read "deed". */
const SINCE = ["run", "map", "step"];
const BEFORE = "deed";
/** What a driver is: every one of these is called by `play`. */
const DRIVER = ["ready", "command", "keyDown", "keyUp", "press", "click", "wait", "shot", "log", "close"];
/** A run's own lines in what was heard: never matched by an `until` or an expectation. */
const OWN = "play";
/** How many of the last lines heard a failed wait repeats. */
const LAST_LINES = 6;
/** How many pictures a row of the contact sheet holds, and how much smaller each is drawn. */
const SHEET = { cols: 4, shrink: 3 };

const shown = (value) => (value === undefined ? "nothing" : JSON.stringify(value));
const isCount = (value) => typeof value === "number" && Number.isFinite(value) && value >= 0;
const isNumber = (value) => typeof value === "number" && Number.isFinite(value);
const isText = (value) => typeof value === "string" && value.trim() !== "";
/** An object without the fields that are undefined. */
const defined = (fields) => Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined));

// ── what the game says ──────────────────────────────────────────────────────
/**
 * A pattern as a step writes it, made a regular expression: `"HIT! .* holy damage"` is the expression's
 * source, matched as written (capitals count); `"/the flame sinks/i"` gives flags too. A RegExp is itself.
 */
export function patternOf(written, what = "a pattern") {
  if (written instanceof RegExp) return written;
  if (!isText(written))
    throw new Error(
      `play: ${what} is a regular expression as text, such as "HIT! .* damage", not ${shown(written)}`,
    );
  const literal = /^\/(.+)\/([a-z]*)$/s.exec(written);
  try {
    return literal ? new RegExp(literal[1], literal[2]) : new RegExp(written);
  } catch (error) {
    throw new Error(`play: ${what} ${shown(written)} is no regular expression: ${error.message}`, {
      cause: error,
    });
  }
}

/** The strings of a message's bytes: each run that ends at a 0, read as Latin-1. */
const stringsOf = (bytes, from = 0) => {
  const strings = [];
  let text = "";
  for (let at = from; at < bytes.length; at++)
    if (bytes[at]) text += String.fromCharCode(bytes[at]);
    else {
      strings.push(text);
      text = "";
    }
  if (text) strings.push(text);
  return strings;
};
/** A line as it is kept: the colour codes of the engine's console (1 to 8) and what is not print taken out. */
const clean = (text) => text.replace(/[\x00-\x09\x0b-\x1f\x7f]/g, "").trim();
const linesOfText = (text) => text.split(/\r?\n/).map(clean).filter(Boolean);

/**
 * How the SDK's own user messages are read, by the names a profile's `play.messages` may give:
 *   "textmsg"   TextMsg (the SDK's dlls/util.cpp, ClientPrint): a byte for where it is shown, the text, and
 *               up to four strings put where the text has %s. What a script or the game prints to a player's
 *               console, his notify lines and the middle of his screen
 *   "saytext"   SayText (dlls/client.cpp, Host_Say): a byte for who spoke, then the line
 *   "strings"   any message: every string of two letters or more in it, for a message whose layout is not known
 */
export const MESSAGE_READERS = {
  textmsg(bytes) {
    const [text = "", ...put] = stringsOf(bytes, 1);
    let next = 0;
    return linesOfText(text.replace(/%s/g, () => clean(put[next++] ?? "")));
  },
  saytext: (bytes) => linesOfText(stringsOf(bytes, 1).join(" ")),
  strings: (bytes) => stringsOf(bytes).flatMap(linesOfText).filter((each) => each.length > 1), // prettier-ignore
};

// ── the profile's part ──────────────────────────────────────────────────────
/**
 * What a mod's profile says of playing it, made whole: `{ enter, say, loads, loaded, goto, messages,
 * yawspeed, screen }`. A field the profile leaves out is `GOLDSRC`'s; with no profile it is all `GOLDSRC`'s.
 *   enter      the steps that get a player from "the map has loaded" into the game (a menu's clicks); none
 *              for a game that puts the player in by itself. A step with `until` (and `every`) waits for
 *              the game instead of the clock
 *   say        how a thing is said: a list of console commands with `{text}` where the words go, or a
 *              function of the text that gives the commands
 *   loads      milliseconds a map is given to load after `map <name>`: waited out where nothing is heard,
 *              and the longest `loaded` is waited for
 *   loaded     a pattern of the line that says the map has loaded, or null: with it, and a driver that
 *              hears, a run goes on the moment the line comes
 *   goto       how the player is put at a place: console commands with `{x}`, `{y}`, `{z}` in them, or a
 *              function of the three; null where the game has no such command
 *   messages   the game's user messages to listen to, each with how its bytes are read: a name of
 *              `MESSAGE_READERS`, or a function of the bytes that gives a line, lines, or nothing
 *   yawspeed   the game's cl_yawspeed, in degrees a second: what a `turn` is timed by where the driver
 *              cannot set the view
 *   screen     `[width, height]` of the page the `enter` steps' clicks were measured on
 *   eye        how far the player's eyes are above his origin (28: the SDK's VEC_VIEW, dlls/util.h): what
 *              `faceAt` aims from
 *   target     how the nearest living enemy is found, or null where the game cannot say: either
 *              `{ commands: ["nearest {radius}"], answer, none, within }`: console commands, the pattern of
 *              the line that answers, with the named groups `x`, `y`, `z` (the place to aim at) and, if the
 *              game says them, `id`, `name`, `hp`, `far`, `count` (the living enemies in the radius) and
 *              `close` (those on the player, as the game counts that); `none` the pattern of the line that
 *              says there is no enemy; `within` the milliseconds an answer is given (3000). Or a function
 *              `({ radius, command, heard, view })` that resolves to `{ origin: [x, y, z], id, name, hp, far,
 *              count, close }` or null: `command(text)` runs a console command, `heard(pattern, within)`
 *              resolves to the match of the first line said from then on (or null), `view()` is the driver's,
 *              `prefer` the words of the names a fight goes for first (a list, maybe empty). With commands:
 *              `prefer`, the commands that make the game answer with the nearest enemy whose name holds
 *              `{word}` (and the nearest of all when none does), and `unprefer`, those that undo it
 *   heal       how the player's health is given back in a test: console commands, or a function that gives
 *              them; null where the game has no such command
 *   fight      what a `fight` step does and reads: `{ attack, dealt, taken, missed, slain, died, health,
 *              maxHealth }`. `attack`: the steps of one blow (`[{ tap: "left" }]`), done once a round. The
 *              rest are patterns of the game's lines, each null where the game says no such thing: a hit the
 *              player `dealt` and one he has `taken` (the first group the damage), a blow of his that
 *              `missed`, an enemy `slain` (the first group its name), the player `died`, his `health` and the
 *              most it can be, `maxHealth` (the first group the number)
 */
export function playPartOf(mod) {
  const whole = modOf(mod) ?? GOLDSRC;
  if (
    whole.play !== undefined &&
    (typeof whole.play !== "object" || !whole.play || Array.isArray(whole.play))
  )
    throw new Error(
      `mod: play is an object such as { enter: [], say: ["say {text}"] }, not ${shown(whole.play)}`,
    );
  const part = { ...GOLDSRC.play, ...whole.play };
  if (!Array.isArray(part.enter))
    throw new Error(`mod: play.enter is a list of steps, not ${shown(part.enter)}`);
  const commands = (value) => typeof value === "function" || (Array.isArray(value) && value.every(isText));
  if (!commands(part.say))
    throw new Error(
      `mod: play.say is a list of console commands with {text} in them, or a function of the text, not ${shown(part.say)}`,
    );
  if (!isCount(part.loads))
    throw new Error(`mod: play.loads is a number of milliseconds, not ${shown(part.loads)}`);
  if (!(isCount(part.yawspeed) && part.yawspeed > 0))
    throw new Error(`mod: play.yawspeed is degrees a second, over 0, not ${shown(part.yawspeed)}`);
  part.loaded ??= null;
  if (part.loaded !== null) part.loaded = patternOf(part.loaded, "mod: play.loaded");
  part.goto ??= null;
  if (part.goto !== null && !commands(part.goto))
    throw new Error(
      `mod: play.goto is a list of console commands with {x}, {y} and {z} in them, or a function of the three, not ${shown(part.goto)}`,
    );
  part.messages ??= {};
  const readers = typeof part.messages === "object" && !Array.isArray(part.messages) ? part.messages : null;
  const read = (how) => typeof how === "function" || Object.hasOwn(MESSAGE_READERS, how);
  if (!readers || !Object.values(readers).every(read))
    throw new Error(
      `mod: play.messages gives each message's name the way it is read: one of ${Object.keys(MESSAGE_READERS).join(", ")}, or a function of its bytes; not ${shown(part.messages)}`,
    );
  if (!isNumber(part.eye))
    throw new Error(`mod: play.eye is how far the eyes are above the player's origin, not ${shown(part.eye)}`);
  part.heal ??= null;
  if (part.heal !== null && !commands(part.heal))
    throw new Error(
      `mod: play.heal is a list of console commands that give the player's health back, or a function that gives them, not ${shown(part.heal)}`,
    );
  part.target ??= null;
  if (part.target !== null && typeof part.target !== "function") {
    const asked = part.target;
    if (typeof asked !== "object" || Array.isArray(asked) || !commands(asked.commands) || asked.answer === undefined)
      throw new Error(
        `mod: play.target is { commands, answer, none } (console commands with {radius} in them, and the patterns of the lines that answer), or a function, not ${shown(asked)}`,
      ); // prettier-ignore
    const answer = patternOf(asked.answer, "mod: play.target.answer");
    if (!["x", "y", "z"].every((name) => answer.source.includes(`(?<${name}>`)))
      throw new Error(
        `mod: play.target.answer names the place in the groups (?<x>...), (?<y>...) and (?<z>...), which ${answer} does not`,
      );
    const none = asked.none == null ? null : patternOf(asked.none, "mod: play.target.none");
    if (asked.within !== undefined && !(isCount(asked.within) && asked.within > 0))
      throw new Error(`mod: play.target.within is a number of milliseconds over 0, not ${shown(asked.within)}`);
    for (const name of ["prefer", "unprefer"])
      if (asked[name] != null && !commands(asked[name]))
        throw new Error(
          `mod: play.target.${name} is a list of console commands${name === "prefer" ? " with {word} in them (the enemy whose name holds that word is the one answered)" : " that undo a prefer"}, or a function, not ${shown(asked[name])}`,
        ); // prettier-ignore
    part.target = {
      ...{ commands: asked.commands, answer, none, within: asked.within ?? TARGET_WITHIN },
      ...{ prefer: asked.prefer ?? null, unprefer: asked.unprefer ?? null },
    };
  }
  if (whole.play?.fight !== undefined && (typeof whole.play.fight !== "object" || !whole.play.fight || Array.isArray(whole.play.fight))) // prettier-ignore
    throw new Error(
      `mod: play.fight is an object such as { attack: [{ tap: "left" }], dealt: "You hit .* for (\d+)" }, not ${shown(whole.play.fight)}`,
    );
  part.fight = { ...GOLDSRC.play.fight, ...whole.play?.fight };
  const unknown = Object.keys(part.fight).filter((name) => name !== "attack" && !FIGHT_LINES.includes(name));
  if (unknown.length)
    throw new Error(`mod: play.fight has ${unknown.join(", ")}, which it does not read: attack, ${FIGHT_LINES.join(", ")}`); // prettier-ignore
  if (!Array.isArray(part.fight.attack) || !part.fight.attack.length)
    throw new Error(`mod: play.fight.attack is the steps of one blow, such as [{ tap: "left" }], not ${shown(part.fight.attack)}`); // prettier-ignore
  for (const name of FIGHT_LINES)
    part.fight[name] = part.fight[name] == null ? null : patternOf(part.fight[name], `mod: play.fight.${name}`);
  return part;
}

/** The names of the user messages a profile reads: what a driver is asked to listen to. */
export const messagesOf = (mod) => Object.keys(playPartOf(mod).messages);

/** The console commands a profile's list (or function) gives for the words put into it. */
function commandsOf(given, put, values, what) {
  const commands =
    typeof given === "function"
      ? [given(...values)].flat()
      : given.map((each) => each.replace(/\{(\w+)\}/g, (all, name) => (name in put ? put[name] : all)));
  if (!commands.length || !commands.every((each) => isText(each) && !/[\r\n]/.test(each)))
    throw new Error(
      `mod: ${what} gave ${shown(commands)} for ${shown(values)}, where console commands were wanted`,
    );
  return commands;
}

/** The console commands that say `text` in a game, as its profile's `play.say` has it. */
function sayCommands(part, text, where) {
  // the console ends a command at `;` and at a line's end, and a `"` opens a quoted word: none can be said
  if (!isText(text) || /[;"\r\n]/.test(text))
    throw new Error(
      `play: ${where}: say is the words to say, with no ; and no " and on one line (the console would take them for its own), not ${shown(text)}`,
    );
  return commandsOf(part.say, { text }, [text], "play.say");
}

// ── steps into actions ──────────────────────────────────────────────────────
/**
 * A list of steps checked and made plain actions; a wrong step is refused in a sentence that names it.
 *
 * A step is an object with at most one of:
 *   { command: "noclip" }             a console command, or a list of them
 *   { say: "hail" }                   said as the mod's profile says a thing is said (`play.say`)
 *   { walk: 2000 }                    forward for that many milliseconds; `to: "back" | "left" | "right"`
 *   { turn: 90 }                      degrees to the left (under 0: to the right): exact where the driver
 *                                     sets the view, by time and about right where it does not
 *   { face: 90 }                      the player turned to that yaw: 0 looks along +x, 90 along +y
 *   { look: -30 }                     the player looking that many degrees up (under 0: down), level at 0
 *   { button: "jump", ms: 200 }       one of the game's buttons held: `+jump`, the wait, `-jump`
 *   { hold: "w", ms: 2000 }           a key of the keyboard held (ms: 1000 unless told), as the driver names keys
 *   { press: "Enter" }                a key pressed and let go
 *   { click: [512, 330] }             a click at that place of the page, in its pixels
 *   { mouse: "left", ms: 2500 }       a button of the mouse held that long: left, right, middle
 *   { mouseDown: "left" }             a button of the mouse held until `{ mouseUp: "left" }` (or the run's
 *                                     end), while the steps between are done
 *   { tap: "left", times: 3 }         a button of the mouse pressed and let go, `times` over (1), `every`
 *                                     milliseconds from one tap to the next (700), down for `ms` (200). With
 *                                     `until`, tapped again every that often until the line comes. A game
 *                                     that charges a blow while the button is held swings on a tap only
 *   { faceAt: [1872, 976, 40] }       the view turned to that place, yaw and pitch, from where the player's
 *                                     eyes are; `faceAt: "target"` turns it to the nearest living enemy, found
 *                                     as the profile's `play.target` finds one, within `radius` (768)
 *   { goto: [512, 96, 36] }           the player put at that place, by the profile's `play.goto`; the place
 *                                     is the middle of his box, 36 above the floor he stands on
 *   { where: "gate" }                 the player's place and view written into the log, under that name
 *   { map: "barrowroad" }             another map loaded in the same run, and entered as the profile says
 *   { expect: "HIT! .* holy" }        the run fails unless a line heard matches (a regular expression)
 *   { expectNot: "Script Error" }     the run fails if a line heard matches
 *   { repeat: [steps], until: "x" }   the steps done again and again: until a line (`within`: 30000, and the
 *                                     run stops when it never comes), `times` over, or `for` that many
 *                                     milliseconds. With `until` and one of the other two the block ends at
 *                                     whichever comes first, and a line that did not come stops nothing
 *   { fight: { heal: 0.5 }, until: "x" }   the nearest enemy faced and struck, again and again, until a line
 *                                     (`within`) or `for` a time, as `repeat` ends; `fight: true` for a plain
 *                                     one. In the object: `radius` (768), `heal` (the share of his health
 *                                     under which the player is healed by the profile's `play.heal`), `post`
 *                                     ([x, y, z]: where he is put back when he has died and risen), `chase`
 *                                     (a distance: he walks at an enemy farther off than that), `quiet`
 *                                     (milliseconds: the fight is over when no enemy has been found for
 *                                     that long, which stops nothing), `attack` (the steps of one blow,
 *                                     for the profile's), `prefer` (a word of a name, or a list: that
 *                                     enemy first, by the profile's `play.target.prefer`), `sidestep`
 *                                     (milliseconds, 600, or false: with `chase`, a step to the side
 *                                     round others in the way), `dodge` (the pattern of a line that warns
 *                                     of a blow to a place, its `(?<x>)` and `(?<y>)`; or `{ line, far,
 *                                     ms, hold }`: stepped away from). What happened is written to the
 *                                     log as a line of the kind "fight", and is the run's `fights`
 * and any step may also carry:
 *   until: "Skeleton .* dies"         after it, a line the game says is waited for (and not the clock). A
 *                                     step that DOES a thing hears from when it began doing it; one that
 *                                     only waits (`{ until }`, with a picture or not) hears from when the
 *                                     last step that did a thing began, so that a line said while that
 *                                     step was still at its work, or in the same instant as the line IT
 *                                     waited for, is not missed, however many waits follow one deed. No
 *                                     `until` stops at a line another `until` has stopped at
 *   within: 20000                     the longest `until` waits, in milliseconds (30000): past it the run
 *                                     stops and says what it waited for. With `expect`: how long the line
 *                                     is given to come (unless told: it has to be there already); with
 *                                     `expectNot`: how long the line is watched for
 *   every: 1000                       with `until`: the step is done again that often until the line comes
 *   since: "run"                      with `expect` and `expectNot`: the lines read are those since the
 *                                     run began ("run", as when nothing is said), since the map last
 *                                     loaded ("map"), since this step began ("step"), or since a picture
 *                                     of that name was taken. With `until`: the same, and "deed" (since
 *                                     the last step that did a thing began); unless told, as `until` says
 *   wait: 1500                        milliseconds waited after it (unless told: 1000 after a step that does
 *                                     something and has no `until`, none after one that only reads)
 *   shot: "gate"                      a picture taken after the wait: `NN_gate.png`, numbered as taken
 * so `{ wait: 5000 }` only waits, `{ shot: "here" }` only takes a picture and `{ until: "dies" }` only waits
 * for a line.
 *
 * Options: `mod` (the profile: its `play.say`, `play.goto` and `play.yawspeed`), `pause` (the wait after a
 * step that does something), `what` (how the list is named in a refusal).
 *
 * Each action is `{ kind, wait, shot, step }` with its own fields: "command" `commands`; "button" `button`,
 * `ms` (and `turn`, the degrees, when it came of one); "hold" `key`, `ms`; "press" `key`; "click" `x`, `y`;
 * "mouse" `mouse`, `ms`; "mouseDown", "mouseUp" `mouse`; "tap" `mouse`, `ms`, `times`, `every`; "look" `yaw`,
 * `pitch` (one of them); "faceAt" `place` (or `target: true` with `radius`); "goto" `commands`, `place`;
 * "where" `name`; "map" `map`; "expect", "expectNot" `pattern`, `within`, `since`; "repeat" `actions`, `times`,
 * `for`; "fight" `actions` (one blow), `radius`, `heal`, `post`, `chase`, `quiet`, `for`, `prefer` (and
 * `prefers`, `unprefers`: the commands), `sidestep`, `dodge`; "wait" nothing more. One with
 * `until` has `until` (a RegExp), `within`, `every` (or null) and `since` too. `step` is the step as written.
 */
export function playOf(steps, { mod, pause = PAUSE, what = "step" } = {}) {
  const part = playPartOf(mod);
  if (!Array.isArray(steps))
    throw new Error(
      `play: the steps are a list, such as [{ walk: 2000 }, { shot: "here" }], not ${shown(steps)}`,
    );
  if (!isCount(pause)) throw new Error(`play: pause is a number of milliseconds, not ${shown(pause)}`);
  return steps.map((step, index) => actionOf(step, `${what} ${index + 1}`, part, pause));
}

function actionOf(step, where, part, pause) {
  const refuse = (sentence) => {
    throw new Error(`play: ${where} ${sentence}`);
  };
  if (!step || typeof step !== "object" || Array.isArray(step))
    refuse(
      `is ${shown(step)}: a step is an object, such as { walk: 2000 } or { command: "noclip", shot: "seen" }`,
    );
  const unknown = Object.keys(step).filter((key) => !KINDS.includes(key) && !BESIDE.includes(key));
  if (unknown.length)
    refuse(
      `has ${unknown.join(", ")}, which no step has: a step is one of ${KINDS.join(", ")}, with wait, shot and until`,
    );
  // to face a way and to look up or down are one setting of the view: the two may share a step
  const kinds = KINDS.filter((kind) => step[kind] !== undefined);
  const both = kinds.length === 2 && kinds.includes("look") && kinds.includes("face");
  if (kinds.length > 1 && !both)
    refuse(`has ${kinds.join(" and ")}: one thing a step, the next in a step of its own`);
  const kind = both ? "look" : kinds[0];
  const waits = step.wait !== undefined || step.shot !== undefined || step.until !== undefined;
  if (!kind && !waits) refuse(`does nothing: ${shown(step)}`);
  if (step.ms !== undefined && !TAKES_MS.includes(kind))
    refuse("has ms, which goes with hold or button only, and with mouse");
  if (step.to !== undefined && kind !== "walk") refuse("has to, which goes with walk only");
  if (step.wait !== undefined && !isCount(step.wait))
    refuse(`waits ${shown(step.wait)}: wait is a number of milliseconds`);
  if (step.shot !== undefined && !(typeof step.shot === "string" && SHOT_NAME.test(step.shot)))
    refuse(`names its picture ${shown(step.shot)}: letters, digits, _ and - (it becomes a file's name)`);
  const expects = kind === "expect" || kind === "expectNot";
  if (step.until !== undefined && expects)
    refuse(`has until and ${kind}: an expectation waits by its own within`);
  if (step.within !== undefined && step.until === undefined && !expects)
    refuse("has within, which goes with until, expect or expectNot only");
  if (step.within !== undefined && !(isCount(step.within) && step.within > 0))
    refuse(`waits within ${shown(step.within)}: a number of milliseconds over 0`);
  const loops = LOOPS.includes(kind);
  if (step.every !== undefined && loops)
    refuse(`has every and ${kind}: what is done again there is the ${kind === "repeat" ? "block" : "blow"} itself`);
  if (step.every !== undefined && kind !== "tap" && (step.until === undefined || !kind))
    refuse("has every, which goes with until, on a step that does a thing to do again, and with tap");
  if (step.every !== undefined && !(isCount(step.every) && step.every > 0))
    refuse(`does it again every ${shown(step.every)}: a number of milliseconds over 0`);
  if (step.since !== undefined && !expects && step.until === undefined)
    refuse("has since, which goes with until, expect or expectNot only");
  const sinces = expects || loops ? SINCE : [...SINCE, BEFORE];
  if (step.since !== undefined && !(sinces.includes(step.since) || SHOT_NAME.test(String(step.since))))
    refuse(`reads since ${shown(step.since)}: ${sinces.join(", ")}, or the name of a picture taken before`);
  if (step.times !== undefined && kind !== "tap" && kind !== "repeat")
    refuse("has times, which goes with tap or repeat only");
  if (step.times !== undefined && !(Number.isInteger(step.times) && step.times > 0))
    refuse(`does it ${shown(step.times)} times: a whole number over 0`);
  if (step.for !== undefined && !loops) refuse("has for, which goes with repeat or fight only");
  if (step.for !== undefined && !(isCount(step.for) && step.for > 0))
    refuse(`goes on for ${shown(step.for)}: a number of milliseconds over 0`);
  if (step.radius !== undefined && !(kind === "faceAt" && step.faceAt === "target"))
    refuse('has radius, which goes with faceAt: "target" only (that of a fight is in its object)');
  const far = (value, of) =>
    isCount(value) && value > 0 ? value : refuse(`${of} ${shown(value)}: a distance in the map's units, over 0`);
  const place = (value) => Array.isArray(value) && value.length === 3 && value.every(isNumber);
  const finds = (does) =>
    part.target ||
    refuse(
      `${does}, and the profile names no way to find one (play.target): the engine has none of its own. Face a place with faceAt: [x, y, z]`,
    );
  const quiets = kind === "fight" && step.fight?.quiet !== undefined;
  if (loops && step.until === undefined && step.times === undefined && step.for === undefined && !quiets)
    refuse(`${kind === "repeat" ? "repeats" : "fights"} without an end: until (a line), ${kind === "repeat" ? "times (a count) or for (milliseconds)" : "for (milliseconds) or quiet in its object"} says when it stops`); // prettier-ignore
  const pattern = (written, of) => {
    try {
      return patternOf(written, of);
    } catch (error) {
      return refuse(error.message.replace(/^play: /, ""));
    }
  };
  const held = (ms, of) =>
    isCount(ms) && ms > 0 ? ms : refuse(`${of} ${shown(ms)}: a number of milliseconds over 0`);
  const mouse = (button) =>
    MOUSE_BUTTONS.includes(button)
      ? button
      : refuse(`names the mouse's button ${shown(button)}: ${MOUSE_BUTTONS.join(", ")}`);

  const action = { kind: kind ?? "wait" };
  if (kind === "command") {
    const commands = [step.command].flat();
    if (!commands.length || !commands.every((each) => isText(each) && !/[\r\n]/.test(each)))
      refuse(
        `gives the command ${shown(step.command)}: a console command, or a list of them, each on one line`,
      );
    action.commands = commands;
  } else if (kind === "say") {
    action.commands = sayCommands(part, step.say, where);
    action.kind = "command";
  } else if (kind === "walk") {
    const to = step.to ?? "forward";
    if (!Object.hasOwn(WALKS, to)) refuse(`walks to ${shown(to)}: ${Object.keys(WALKS).join(", ")}`);
    Object.assign(action, { kind: "button", button: WALKS[to], ms: held(step.walk, "walks for") });
  } else if (kind === "turn") {
    if (!(isNumber(step.turn) && step.turn !== 0))
      refuse(`turns ${shown(step.turn)}: degrees, over 0 to the left and under 0 to the right`);
    // by time where the view cannot be set: see TURNING at the head of this file
    const ms = Math.max(1, Math.round((Math.abs(step.turn) / part.yawspeed) * 1000));
    Object.assign(action, { kind: "button", button: step.turn > 0 ? "left" : "right", ms, turn: step.turn });
  } else if (kind === "look") {
    if (step.look !== undefined && !(isNumber(step.look) && Math.abs(step.look) <= 89))
      refuse(`looks ${shown(step.look)}: degrees up, from -89 (down) to 89`);
    if (step.face !== undefined && !isNumber(step.face))
      refuse(`faces ${shown(step.face)}: a yaw in degrees, 0 along +x and 90 along +y`);
    if (step.face !== undefined) action.yaw = step.face;
    if (step.look !== undefined) action.pitch = step.look;
  } else if (kind === "face") {
    if (!isNumber(step.face))
      refuse(`faces ${shown(step.face)}: a yaw in degrees, 0 along +x and 90 along +y`);
    Object.assign(action, { kind: "look", yaw: step.face });
  } else if (kind === "button") {
    if (!(typeof step.button === "string" && BUTTON_NAME.test(step.button)))
      refuse(
        `holds the button ${shown(step.button)}: a button's name without its +, such as jump, duck, use, attack`,
      );
    Object.assign(action, { button: step.button, ms: held(step.ms, "holds its button for") });
  } else if (kind === "hold") {
    if (!isText(step.hold)) refuse(`holds ${shown(step.hold)}: a key, such as "w" or "Space"`);
    Object.assign(action, { key: step.hold, ms: held(step.ms ?? HOLD, "holds its key for") });
  } else if (kind === "press") {
    if (!isText(step.press)) refuse(`presses ${shown(step.press)}: a key, such as "e" or "Enter"`);
    action.key = step.press;
  } else if (kind === "click") {
    if (!(Array.isArray(step.click) && step.click.length === 2 && step.click.every(isCount)))
      refuse(`clicks ${shown(step.click)}: [x, y], a place of the page in its pixels`);
    [action.x, action.y] = step.click;
  } else if (kind === "mouse") {
    Object.assign(action, { mouse: mouse(step.mouse), ms: held(step.ms, "holds the mouse's button for") });
  } else if (kind === "mouseDown" || kind === "mouseUp") {
    action.mouse = mouse(step[kind]);
  } else if (kind === "tap") {
    const every = step.every ?? TAP_EVERY;
    const ms = held(step.ms ?? Math.min(TAP, every), "holds the mouse's button for");
    if (ms > every) refuse(`holds the button ${ms} ms and taps every ${every}: a tap is over before the next`);
    Object.assign(action, { mouse: mouse(step.tap), ms, times: step.times ?? 1, every });
  } else if (kind === "faceAt") {
    if (step.faceAt === "target") {
      finds("faces the nearest enemy");
      Object.assign(action, { target: true, radius: far(step.radius ?? RADIUS, "looks for an enemy within") });
    } else if (place(step.faceAt)) action.place = [...step.faceAt];
    else refuse(`faces ${shown(step.faceAt)}: [x, y, z], a place in the map's units, or "target" for the nearest enemy`); // prettier-ignore
  } else if (kind === "repeat") {
    if (!Array.isArray(step.repeat) || !step.repeat.length)
      refuse(`repeats ${shown(step.repeat)}: a list of steps, such as [{ faceAt: "target" }, { tap: "left" }]`);
    action.actions = step.repeat.map((each, index) => actionOf(each, `${where}.${index + 1}`, part, pause));
    Object.assign(action, { times: step.times ?? null, for: step.for ?? null });
  } else if (kind === "fight") {
    const asked = step.fight === true ? {} : step.fight;
    if (!asked || typeof asked !== "object" || Array.isArray(asked))
      refuse(`fights ${shown(step.fight)}: true, or an object such as { heal: 0.5, radius: 600 }`);
    const unknownHere = Object.keys(asked).filter((key) => !FIGHT.includes(key));
    if (unknownHere.length) refuse(`fights with ${unknownHere.join(", ")}, which no fight has: ${FIGHT.join(", ")}`);
    finds("fights the nearest enemy");
    if (asked.heal !== undefined && !(isNumber(asked.heal) && asked.heal > 0 && asked.heal <= 1))
      refuse(`heals under ${shown(asked.heal)}: a share of the player's health, over 0 and up to 1`);
    if (asked.heal !== undefined && !(part.heal && part.fight.health))
      refuse(
        "heals, and the profile does not say how (play.heal) or by what line the player's health is known (play.fight.health)",
      );
    if (asked.post !== undefined && !place(asked.post))
      refuse(`is held at ${shown(asked.post)}: post is [x, y, z], where the player is put back after a death`);
    if (asked.post !== undefined && !part.goto)
      refuse("has a post, and the profile names no command that puts the player at a place (play.goto)");
    if (asked.attack !== undefined && !(Array.isArray(asked.attack) && asked.attack.length))
      refuse(`strikes with ${shown(asked.attack)}: attack is the steps of one blow, such as [{ tap: "left" }]`);
    action.actions = (asked.attack ?? part.fight.attack).map((each, index) =>
      actionOf(each, `${where}'s blow, step ${index + 1}`, part, pause),
    );
    if (action.actions.some((each) => LOOPS.includes(each.kind) || each.until))
      refuse("strikes with steps that wait or repeat: a blow is done and over");
    Object.assign(action, {
      radius: far(asked.radius ?? RADIUS, "looks for an enemy within"),
      heal: asked.heal ?? null,
      post: asked.post ? [...asked.post] : null,
      chase: asked.chase === undefined ? null : far(asked.chase, "walks at an enemy farther than"),
      quiet: asked.quiet === undefined ? null : held(asked.quiet, "is over when no enemy was found for"),
      for: step.for ?? null,
    });
    // what it goes for first: words of a name, the first the most
    action.prefer = asked.prefer === undefined ? [] : [asked.prefer].flat();
    if (asked.prefer !== undefined && !(action.prefer.length && action.prefer.every((word) => typeof word === "string" && WORD.test(word)))) // prettier-ignore
      refuse(`prefers ${shown(asked.prefer)}: a word of an enemy's name ("lantern"), or a list of them, the first preferred most`); // prettier-ignore
    if (action.prefer.length && typeof part.target !== "function" && !part.target.prefer)
      refuse("prefers an enemy, and the profile names no way to ask the game for one (play.target.prefer)");
    if (action.prefer.length && typeof part.target !== "function") {
      action.prefers = action.prefer.map((word) => commandsOf(part.target.prefer, { word }, [word], "play.target.prefer")); // prettier-ignore
      action.unprefers = part.target.unprefer ? commandsOf(part.target.unprefer, {}, [], "play.target.unprefer") : null; // prettier-ignore
    }
    // round a crowd: only on the way to an enemy farther than chase
    if (asked.sidestep !== undefined && action.chase === null)
      refuse("sidesteps, which a fight does on its way to an enemy farther off than its chase: give chase too");
    action.sidestep = asked.sidestep === false ? null : asked.sidestep === undefined ? SIDESTEP : held(asked.sidestep, "sidesteps for"); // prettier-ignore
    // out of a place the game warns of
    action.dodge = null;
    if (asked.dodge !== undefined) {
      const dodge = typeof asked.dodge === "string" ? { line: asked.dodge } : asked.dodge;
      if (!dodge || typeof dodge !== "object" || Array.isArray(dodge) || dodge.line === undefined)
        refuse(`dodges ${shown(asked.dodge)}: the pattern of the line that warns, or { line, far, ms, hold }`);
      const strange = Object.keys(dodge).filter((key) => !DODGE.includes(key));
      if (strange.length) refuse(`dodges with ${strange.join(", ")}, which a dodge has not: ${DODGE.join(", ")}`);
      const line = pattern(dodge.line, "dodges at");
      if (/\(\?<x>/.test(line.source) !== /\(\?<y>/.test(line.source))
        refuse(`dodges at ${line}, which names one of the groups (?<x>...) and (?<y>...): the place is both, or neither`); // prettier-ignore
      action.dodge = {
        line,
        far: far(dodge.far ?? DODGE_FAR, "dodges as far as"),
        ms: held(dodge.ms ?? DODGE_MS, "dodges for at most"),
        hold: dodge.hold === 0 ? 0 : held(dodge.hold ?? DODGE_HOLD, "after a dodge walks at nobody for"),
      };
    }
    if (action.post) action.back = commandsOf(part.goto, { x: action.post[0], y: action.post[1], z: action.post[2] }, action.post, "play.goto"); // prettier-ignore
    if (action.heal !== null) action.heals = commandsOf(part.heal, {}, [], "play.heal");
  } else if (kind === "goto") {
    if (!place(step.goto))
      refuse(`goes to ${shown(step.goto)}: [x, y, z], the middle of the player's box in the map's units`);
    if (!part.goto)
      refuse(
        "goes to a place, and the profile names no command that puts the player at one (play.goto): the engine has none of its own. Walk there, or fly with noclip",
      );
    const [x, y, z] = step.goto;
    action.commands = commandsOf(part.goto, { x, y, z }, step.goto, "play.goto");
    action.place = [x, y, z];
  } else if (kind === "where") {
    if (!(step.where === true || (typeof step.where === "string" && SHOT_NAME.test(step.where))))
      refuse(`asks where under the name ${shown(step.where)}: letters, digits, _ and -, or true for no name`);
    action.name = step.where === true ? "" : step.where;
  } else if (kind === "map") {
    if (!(typeof step.map === "string" && MAP_NAME.test(step.map)))
      refuse(`loads the map ${shown(step.map)}: the map's name as the console's \`map\` takes it`);
    action.map = step.map;
  } else if (expects) {
    action.pattern = pattern(step[kind], `${kind === "expect" ? "expects" : "expects no"}`);
    action.within = step.within ?? 0;
    action.since = step.since ?? "run";
  }
  if (step.until !== undefined) {
    action.until = pattern(step.until, "waits until");
    action.within = step.within ?? WITHIN;
    // a tap is tapped again as often as it taps
    action.every = loops ? null : kind === "tap" ? action.every : (step.every ?? null);
    // a step that only waits hears from the last that did a thing: see `until` at the head of playOf
    action.since = step.since ?? (kind ? "step" : BEFORE);
  }
  const idle = !kind || READS.includes(kind) || kind === "map" || step.until !== undefined || loops;
  // a tap is followed by what is left of its `every`, so that taps in steps of their own keep one time
  action.wait = step.wait ?? (idle ? 0 : kind === "tap" ? action.every - action.ms : pause);
  action.shot = step.shot ?? null;
  action.step = step;
  return action;
}

// ── the run ─────────────────────────────────────────────────────────────────
/** What a driver has to be able to do for an action, as a sentence's end; null when every driver can. */
function wantOf(action, driver) {
  const has = (...names) => names.every((name) => typeof driver[name] === "function");
  if ((action.until || action.kind === "expect" || action.kind === "expectNot") && !has("lines"))
    return "waits for what the game says, and this driver hears nothing (it has no lines())";
  if (action.kind === "look" && !has("look"))
    return "sets the view, which this driver cannot (it has no look())";
  if (action.kind === "where" && !has("view"))
    return "asks where the player is, which this driver does not know (it has no view())";
  if (["mouse", "mouseDown", "mouseUp", "tap"].includes(action.kind) && !has("mouseDown", "mouseUp"))
    return "holds a button of the mouse, and this driver has no mouse (no mouseDown() and mouseUp())";
  if ((action.kind === "faceAt" || action.kind === "fight") && !has("view", "look"))
    return "turns the view to a place, which this driver cannot (it has no view() and look())";
  if ((action.target || action.kind === "fight") && !has("lines"))
    return "finds an enemy by what the game answers, and this driver hears nothing (it has no lines())";
  for (const inner of action.actions ?? []) {
    const want = wantOf(inner, driver);
    if (want) return want;
  }
  return null;
}

const rounded = (value) => Math.round(value * 10) / 10;
const placeText = (origin) => (origin ? origin.map(rounded).join(" ") : "nowhere yet");

/**
 * A game kept up for many runs: the engine is started once (`ready`), and each `run` loads a map, or stays
 * in the one it is in, does its steps and writes its pictures, its log and its sheet. The driver is closed
 * by `close()` and by nothing else, so a second run pays for its map and not for the engine.
 *
 *   const session = play.playSession({ driver, mod });
 *   const first = await session.run({ map: "yard", steps, out: "work/first" });
 *   const second = await session.run({ map: "road", steps: more, out: "work/second" });   // some seconds later
 *   await session.close();
 *
 *   driver   a driver, as `play` takes one
 *   mod      the mod's profile
 *   pause    milliseconds waited after a step that does something and gives no `wait` (1000)
 *   tell     a function handed a line as each thing is done; a run may give its own
 *   over     folders laid over the game's files, marked as the session begins: `[{ path: "msc", folder }]`
 *            (the folder's files are the engine's `<path>/...`). A run that names one again puts what changed
 *            in it since (see the run's `over`)
 *
 * `session.state` is `{ up, map, entered, runs }`. A run takes:
 *   map        the map to load, as `map <name>` takes it. Loaded afresh even when it is the map the session
 *              is in (monsters back, doors shut), unless `stay` is true
 *   stay       true: nothing is loaded; the steps go on from where the last run left the player
 *   steps      what to do once in the game (`playOf` has the format)
 *   out        the folder the pictures and the log go to; it is made
 *   expect, expectNot   patterns the whole run is held to, beside its steps' own: checked at its end
 *   put        files written into the engine before the map loads: `[{ path: "msc/maps/yard.bsp", file }]`
 *              (or `bytes`). A driver that cannot (`put`) refuses. The map the session is in is left first
 *              (the driver's `leave`): a game may write its own files as a map ends, over what was put
 *   over       folders laid over the game's files, `[{ path: "msc", folder }]`: every file in one that is new
 *              or changed (its size or its time) since the session marked it is put, as `put` puts, and the
 *              mark is moved on. A game that is up reads a file once (a model it failed to find stays
 *              failed): this is how one edited since is tried without starting the engine again. A folder
 *              the session has not marked (not given to `playSession`, nor to a run before) is marked by
 *              this run, and nothing of it is put
 *   loads, pause, tell   as `play`'s
 *   sheet      false for no contact sheet (unless told: `sheet.png`, when a picture was taken)
 *
 * and resolves to what happened:
 *   { map, out, took,
 *     pictures      the PNG files written, in the order taken (their paths)
 *     sheet         the contact sheet of them, `<out>/sheet.png`, or null
 *     steps         one for each thing done: { part: "load" | "enter" | "steps", index, kind, step, at, took,
 *                   picture, heard }: `at` and `took` in milliseconds from the run's start, `picture` its
 *                   file or null, `heard` the line an `until` waited for. A step of a `repeat`'s block is
 *                   there once for each time it was done, with `where` ("step 3.2") and its index in the block
 *     expectations  one for each `expect` and `expectNot`: { where, kind, pattern, passed, line }
 *     fights        one for each `fight` step: { where, seconds, ended: "line" | "time" | "quiet", line, rounds, blows,
 *                   dealt: { hits, sum, missed }, taken: { hits, sum }, heals, deaths, down (seconds dead),
 *                   slain: [names], enemies: { asked, none, most, mean, closeMost, closeMean }, health:
 *                   { least, most } }, counted by the profile's `play.fight` patterns; with `prefer`, `prefer:
 *                   { words, slain, rounds, letBe }` (the slain whose names hold a word; the rounds that faced one;
 *                   the times one was let be);
 *                   with `chase`, `sidesteps`; with `dodge`, `dodge: { warned, dodged, clear }`
 *     passed        true when every expectation held
 *     lines         what was heard in the run: { at, kind, text }, `at` in milliseconds from its start and
 *                   `kind` "console", "error", a message's name, "where", or "play" for the run's own notes
 *     log           the same as text lines; logFile: <out>/log.txt; linesFile: <out>/log.jsonl (a JSON
 *                   object a line); resultFile: <out>/result.json (this, without the lines) }
 *
 * A run that cannot go on (a line waited for that never came, a driver that failed) throws, with the step it
 * was at named; the log, the sheet and result.json are written all the same and named on the error
 * (`pictures`, `logFile`, `sheet`, `expectations`). An expectation that does not hold does not stop a run:
 * it is in `expectations`, and `passed` is false.
 */
export function playSession({ driver, mod, pause: sessionPause, tell: sessionTell, over: sessionOver = [] } = {}) {
  const lacks = DRIVER.filter((name) => typeof driver?.[name] !== "function");
  if (lacks.length)
    throw new Error(
      `play: driver is an object with ${DRIVER.join(", ")} (browserDriver makes one)${driver ? `: this one has no ${lacks.join(", ")}` : ""}`,
    );
  const part = playPartOf(mod);
  /** The folders laid over the game's, each with its files' marks as the engine last had them. */
  const laid = new Map();
  for (const each of oversOf(sessionOver)) laid.set(each.key, { ...each, marks: marksOf(each.folder) });
  const hears = typeof driver.lines === "function";
  const state = { up: false, map: null, entered: false, runs: 0 };
  /** Everything heard since the session began: `{ at, kind, text }`, `at` the clock's milliseconds. */
  const heard = [];
  let taken = 0;
  /** Whether a turn is still set exactly: false once the driver's view could not be read. */
  let exact = true;
  const readers = Object.fromEntries(
    Object.entries(part.messages).map(([name, how]) => [
      name,
      typeof how === "function" ? how : MESSAGE_READERS[how],
    ]),
  );
  /** What the driver heard since the last asking, read and kept. */
  const listen = async () => {
    if (!hears) return;
    const fresh = (await driver.lines(taken)) ?? [];
    taken += fresh.length;
    for (const each of fresh) {
      if (each.text !== undefined) heard.push({ at: each.at, kind: each.kind, text: String(each.text) });
      else if (readers[each.kind])
        for (const text of [readers[each.kind](each.bytes) ?? []].flat())
          if (isText(text)) heard.push({ at: each.at, kind: each.kind, text: String(text) });
    }
  };
  const note = (kind, text) => heard.push({ at: Date.now(), kind, text });
  /** The first line from `from` on that matches, is not the run's own, and is none of `but` (a WeakSet). */
  const found = (pattern, from, but) => {
    for (let at = from; at < heard.length; at++)
      if (heard[at].kind !== OWN && !but?.has(heard[at]) && pattern.test(heard[at].text)) return heard[at];
    return null;
  };
  /** The driver's own time where it keeps one (a test's fake), the clock's otherwise: milliseconds. */
  const clock = () => (typeof driver.clock === "function" ? driver.clock() : Date.now());
  /** Waits until a line from `from` on matches: the line, or null when `within` ran out. */
  const waitFor = async (pattern, from, within, every, again, but) => {
    for (let waited = 0, last = 0; ; waited += POLL) {
      await listen();
      const line = found(pattern, from, but);
      if (line || waited >= within) return line;
      if (every && waited - last >= every) {
        last = waited;
        await again();
      }
      await driver.wait(POLL);
    }
  };
  const lastLines = (from) => {
    const said = heard.slice(from).filter((each) => each.kind !== OWN);
    return said.length
      ? `The last it said: ${said.slice(-LAST_LINES).map((each) => shown(each.text)).join(", ")}` // prettier-ignore
      : "It said nothing meanwhile";
  };

  async function ready() {
    if (state.up) return;
    await driver.ready();
    state.up = true;
  }

  async function run({
    map,
    stay = false,
    steps = [],
    out,
    loads,
    pause = sessionPause,
    tell = sessionTell,
    expect = [],
    expectNot = [],
    put = [],
    sheet = true,
    over = [],
  } = {}) {
    const staying = stay === true;
    if (staying && !state.entered)
      throw new Error("play: stay goes on from the run before, and this session has entered no map yet");
    if (!staying && !(typeof map === "string" && MAP_NAME.test(map)))
      throw new Error(
        `play: map is the map's name as the console's \`map\` takes it, such as "orchard", not ${shown(map)}`,
      );
    if (!isText(out))
      throw new Error(`play: out is the folder the pictures and the log go to, not ${shown(out)}`);
    const loading = loads ?? part.loads;
    if (!isCount(loading)) throw new Error(`play: loads is a number of milliseconds, not ${shown(loads)}`);
    const entering = playOf(part.enter, { mod, pause, what: "the profile's enter step" });
    const asked = playOf(steps, { mod, pause });
    const held = [expect, expectNot].map((list, which) =>
      [list].flat().map((written) => ({
        kind: which ? "expectNot" : "expect",
        pattern: patternOf(written, which ? "expectNot" : "expect"),
      })),
    );
    for (const [list, name] of [[entering, "the profile's enter step"], [asked, "step"]]) // prettier-ignore
      list.forEach((action, index) => {
        const want = wantOf(action, driver);
        if (want) throw new Error(`play: ${name} ${index + 1} ${want}`);
      });
    if (held.flat().length && !hears)
      throw new Error("play: an expectation reads what the game says, and this driver hears nothing");
    if (!Array.isArray(put) || !put.every((each) => isText(each?.path) && (each.bytes || isText(each.file))))
      throw new Error(
        `play: put is a list of { path, file } (or bytes): a place in the engine's files and what goes there, not ${shown(put)}`,
      );
    const overs = oversOf(over);
    /** What changed in each folder laid over since the session marked it, as files to put; and the new marks. */
    const moved = overs.map((each) => {
      const marks = marksOf(each.folder);
      const had = laid.get(each.key)?.marks;
      const files = had ? [...marks].filter(([file, mark]) => had.get(file) !== mark).map(([file]) => file) : null;
      return { ...each, marks, files };
    });
    put = [
      ...put,
      ...moved.flatMap(({ path, folder, files }) => (files ?? []).map((file) => ({ path: `${path}/${file}`, file: join(folder, file) }))), // prettier-ignore
    ];
    if (put.length && typeof driver.put !== "function")
      throw new Error("play: this driver cannot put a file into the engine (it has no put())");

    mkdirSync(out, { recursive: true });
    const began = Date.now();
    const pictures = [];
    const done = [];
    const expectations = [];
    const marks = new Map();
    const down = new Set();
    const fights = [];
    /** The lines an `until` of this run has stopped at: no other stops at one of them. */
    const stoppedAt = new WeakSet();
    let first = heard.length;
    let mapFrom = first;
    /** Where the last step that did a thing began: what "deed" reads from. */
    let before = first;
    const picture = async (name) => {
      const file = join(out, `${String(pictures.length).padStart(2, "0")}_${name}.png`);
      await driver.shot(file);
      pictures.push(file);
      // what was said before the picture is heard before it: "since the picture" is then from here
      await listen();
      marks.set(name, heard.length);
      return file;
    };
    /** One thing done and written down: `does` does it, `shot` names the picture taken after it. */
    const record = async (phase, index, kind, step, shot, does, named) => {
      const at = Date.now() - began;
      let file = null;
      let line = null;
      const where =
        named ??
        (phase === "load"
          ? "loading the map"
          : `${phase === "enter" ? "the profile's enter step" : "step"} ${index + 1}`);
      try {
        line = (await does(where)) ?? null;
        if (shot) file = await picture(shot);
      } catch (error) {
        throw new Error(`${/^play: /.test(error.message) ? "" : "play: "}${error.message} (at ${where})`, {
          cause: error,
        });
      }
      const entry = { part: phase, index, kind, step, at, took: Date.now() - began - at, picture: file };
      if (line) entry.heard = line.text;
      if (named) entry.where = named;
      done.push(entry);
      const said = lineOf(entry);
      note(OWN, said.trim());
      tell?.(said);
      return entry;
    };
    /** An expectation looked at and written down; it never stops the run. */
    const expecting = async ({ kind, pattern, within = 0, since = "run" }, where, stepFrom) => {
      if (!SINCE.includes(since) && !marks.has(since))
        throw new Error(`play: no picture named ${shown(since)} was taken before, to read since`);
      const from = since === "run" ? first : since === "map" ? mapFrom : since === "step" ? stepFrom : marks.get(since); // prettier-ignore
      // an expectation that a line is not there watches for it; one that it is there waits for it
      const line = within ? await waitFor(pattern, from, within) : (await listen(), found(pattern, from));
      const passed = kind === "expect" ? Boolean(line) : !line;
      const entry = { where, kind, pattern: String(pattern), passed, line: line?.text ?? null };
      expectations.push(entry);
      // told at the run's end by whoever reports it, and kept in the log where it was asked
      note(OWN, expectationLine(entry));
    };
    /** Where a step reads from, by its `since`; `from` is where the step itself began. */
    const sinceOf = (since, from) => {
      if (!SINCE.includes(since) && since !== BEFORE && !marks.has(since))
        throw new Error(`play: no picture named ${shown(since)} was taken before, to read since`);
      return since === "run" ? first : since === "map" ? mapFrom : since === "step" ? from : since === BEFORE ? Math.min(before, from) : marks.get(since); // prettier-ignore
    };
    /** The view turned to a place: yaw and pitch from where the player's eyes are. */
    const aim = async ([x, y, z]) => {
      const { origin } = await driver.view();
      if (!origin) throw new Error("play: the view cannot be turned to a place: the player is nowhere yet");
      const [dx, dy, dz] = [x - origin[0], y - origin[1], z - origin[2] - part.eye];
      const flat = Math.hypot(dx, dy);
      const to = { pitch: Math.max(-89, Math.min(89, (Math.atan2(dz, flat) * 180) / Math.PI)) };
      // straight over or under him there is no way to turn to: the yaw stays
      if (flat > 0.01) to.yaw = (Math.atan2(dy, dx) * 180) / Math.PI;
      await driver.look(to);
      return Math.hypot(flat, dz);
    };
    /** The nearest living enemy within `radius`, as the profile finds one, or null: `{ origin, ... }`. */
    const targetOf = async (radius, prefer = []) => {
      await listen();
      const asked = heard.length;
      if (typeof part.target === "function") {
        const told = await part.target({
          radius,
          command: (text) => driver.command(text),
          heard: async (pattern, within = TARGET_WITHIN) => {
            const expression = patternOf(pattern, "play.target: heard");
            const line = await waitFor(expression, asked, within);
            return line ? expression.exec(line.text) : null;
          },
          view: () => driver.view(),
          prefer,
        });
        if (told == null) return null;
        if (!(Array.isArray(told.origin) && told.origin.length === 3 && told.origin.every(isNumber)))
          throw new Error(`play: the profile's play.target gave ${shown(told)}, where { origin: [x, y, z] } or null was wanted`); // prettier-ignore
        return told;
      }
      const { commands, answer, none, within } = part.target;
      const said = commandsOf(commands, { radius }, [radius], "play.target");
      for (const [index, command] of said.entries()) {
        if (index) await driver.wait(BETWEEN);
        await driver.command(command);
      }
      const either = { test: (text) => answer.test(text) || Boolean(none?.test(text)) };
      const line = await waitFor(either, asked, within);
      if (!line)
        throw new Error(
          `play: the game did not answer ${shown(said.join("; "))} in ${rounded(within / 1000)} seconds (the profile's play.target): does this map have that command? ${lastLines(asked)}`,
        );
      const groups = answer.exec(line.text)?.groups;
      if (!groups) return null;
      const number = (text) => (text === undefined || text === "" || !Number.isFinite(Number(text)) ? undefined : Number(text)); // prettier-ignore
      const origin = [groups.x, groups.y, groups.z].map(Number);
      if (!origin.every(isNumber))
        throw new Error(`play: the place of an enemy does not read as numbers in ${shown(line.text)} (the profile's play.target.answer)`); // prettier-ignore
      return {
        origin,
        ...defined({ id: groups.id, name: groups.name }),
        ...defined({ hp: number(groups.hp), far: number(groups.far), count: number(groups.count), close: number(groups.close) }), // prettier-ignore
      };
    };
    /** Steps of a block done one after another, each written down; true to `ends` stops them. */
    const block = async (actions, where, ends) => {
      for (const [index, inner] of actions.entries()) {
        const named = `${where}.${index + 1}`;
        await record("steps", index, inner.kind, inner.step, inner.shot, () => act(inner, named), named);
        if (await ends?.()) return true;
      }
      return false;
    };
    /**
     * A block done again and again, as `repeat` and `fight` are: `round` does one pass and gives true when
     * the pass itself ends it. Gives the line it ended at, or null; stops the run when only `within`
     * bounded it and the line never came.
     */
    const again = async (action, where, from, round) => {
      const began = clock();
      // a time the caller set ends it quietly; the `within` of an `until` alone stops the run
      const quiet = action.for !== null || (action.times ?? null) !== null;
      const most = action.for ?? (action.until && !quiet ? action.within : Infinity);
      const but = stoppedAt;
      let line = null;
      let passes = 0;
      let over = false;
      const ended = async () => {
        if (action.until) {
          await listen();
          line = found(action.until, from, but);
        }
        return Boolean(line) || clock() - began >= most;
      };
      while (!(await ended())) {
        const at = clock();
        over = await round(ended, passes);
        passes++;
        if (over || line || (action.times && passes >= action.times)) break;
        // a pass that took no time would never come to its end by the clock
        if (clock() === at) await driver.wait(POLL);
      }
      if (line) stoppedAt.add(line);
      else if (action.until && !quiet && !over)
        throw new Error(
          `play: the game never said ${action.until} in the ${rounded(action.within / 1000)} seconds its ${action.kind} was given (${passes} ${passes === 1 ? "pass" : "passes"}). ${lastLines(from)}`,
        );
      return { line, passes, over, took: clock() - began };
    };
    /** The last line heard that matches, back to `from`: its first group as a number, or null. */
    const lastAmount = (pattern, from = 0) => {
      if (!pattern) return null;
      for (let at = heard.length - 1; at >= from; at--) {
        const read = heard[at].kind === OWN ? null : pattern.exec(heard[at].text);
        if (read) return Number(read[1]);
      }
      return null;
    };
    /** A fight: the nearest enemy faced and struck until its end, and what happened written down. */
    const fight = async (action, where, from) => {
      const lines = part.fight;
      const tally = {
        ...{ where, seconds: 0, ended: null, rounds: 0, blows: 0 },
        ...{ dealt: { hits: 0, sum: 0, missed: 0 }, taken: { hits: 0, sum: 0 } },
        ...{ heals: 0, deaths: 0, slain: [], down: 0 },
        ...{ enemies: { asked: 0, none: 0, most: 0, sum: 0, closeMost: 0, closeSum: 0, closeAsked: 0 } },
        ...{ health: { least: null, most: null } },
        ...(action.prefer.length ? { prefer: { words: action.prefer, slain: 0, rounds: 0, letBe: 0 } } : {}),
        ...(action.chase !== null && action.sidestep !== null ? { sidesteps: 0 } : {}),
        ...(action.dodge ? { dodge: { warned: 0, dodged: 0, clear: 0 } } : {}),
      };
      let read = from;
      let fallen = null;
      let alone = null;
      let health = lastAmount(lines.health);
      let most = lastAmount(lines.maxHealth) ?? health;
      /** What was said since the last look, counted. */
      const count = () => {
        for (; read < heard.length; read++) {
          const { kind, text } = heard[read];
          if (kind === OWN) continue;
          const amount = (pattern) => {
            const got = pattern?.exec(text);
            return got ? (Number.isFinite(Number(got[1])) ? Number(got[1]) : 0) : null;
          };
          const dealt = amount(lines.dealt);
          const taken = amount(lines.taken);
          if (dealt !== null) (tally.dealt.hits++, (tally.dealt.sum += dealt));
          if (taken !== null) (tally.taken.hits++, (tally.taken.sum += taken));
          if (lines.missed?.test(text)) tally.dealt.missed++;
          const slain = lines.slain?.exec(text);
          if (slain) tally.slain.push(slain[1] ?? text);
          if (slain && tally.prefer && preferred(slain[1] ?? text)) tally.prefer.slain++;
          if (lines.died?.test(text) && fallen === null) {
            tally.deaths++;
            fallen = clock();
          }
          const now = amount(lines.health);
          if (now !== null) {
            health = now;
            if (fallen === null || now > 0) tally.health.least = Math.min(tally.health.least ?? now, now);
          }
          const top = amount(lines.maxHealth);
          if (top !== null) most = top;
          if (health !== null) most = Math.max(most ?? health, health);
        }
      };
      const done = async (inner) => {
        for (const [index, command] of inner.entries()) {
          if (index) await driver.wait(BETWEEN);
          await driver.command(command);
        }
      };
      const blow = async () => {
        for (const [index, inner] of action.actions.entries()) await act(inner, `${where}'s blow, step ${index + 1}`);
        tally.blows++;
      };
      /** The first word of `prefer` a name holds, or null. */
      const preferred = (name) =>
        action.prefer.find((word) => String(name ?? "").toLowerCase().includes(word.toLowerCase())) ?? null;
      /** The word the game was last told to prefer, by this fight; until when the preferred are let be. */
      let preferSaid = null;
      let letBe = -Infinity;
      /** The enemy to strike: of the words of `prefer`, the first that one within the radius has; else the nearest. */
      const find = async () => {
        // a preferred one that could not be got at is let be a while: the nearest meanwhile
        if (clock() < letBe) {
          if (preferSaid !== null && action.unprefers) await done(action.unprefers);
          preferSaid = null;
          return targetOf(action.radius);
        }
        if (!action.prefers) return targetOf(action.radius, action.prefer);
        let enemy = null;
        for (const [index, word] of action.prefer.entries()) {
          if (preferSaid !== word) {
            await done(action.prefers[index]);
            preferSaid = word;
          }
          enemy = await targetOf(action.radius);
          // none at all, or one of this word: the answer stands; else the next word is asked for
          if (!enemy || preferred(enemy.name) === word) return enemy;
        }
        return enemy;
      };
      /** Buttons held for a while and let go: a move the fight makes. Gives the milliseconds it took. */
      const moving = async (buttons, ms, stop) => {
        for (const button of buttons) await driver.command(`+${button}`);
        let went = 0;
        try {
          while (went < ms) {
            const step = Math.min(POLL, ms - went);
            await driver.wait(step);
            went += step;
            if (await stop?.()) break;
          }
        } finally {
          for (const button of buttons) await driver.command(`-${button}`);
        }
        return went;
      };
      /** The buttons that move the player towards a yaw of the world while his view is turned to `yaw`. */
      const towards = (way, yaw) => {
        const turned = ((way - yaw) * Math.PI) / 180;
        const [ahead, left] = [Math.cos(turned), Math.sin(turned)];
        return [
          ...(ahead > 0.38 ? ["forward"] : ahead < -0.38 ? ["back"] : []),
          ...(left > 0.38 ? ["moveleft"] : left < -0.38 ? ["moveright"] : []),
        ];
      };
      // a warning heard is dodged once; after a dodge he walks at nobody for its `hold`
      let warnedRead = from;
      let calm = -Infinity;
      let aside = 1;
      /** A line that warns of a blow to a place, dodged: true when he moved. */
      const evade = async () => {
        if (!action.dodge) return false;
        await listen();
        let warned = null;
        let said = "";
        for (; warnedRead < heard.length; warnedRead++) {
          const got = heard[warnedRead].kind === OWN ? null : action.dodge.line.exec(heard[warnedRead].text);
          if (got) [warned, said] = [got, heard[warnedRead].text];
        }
        if (!warned) return false;
        tally.dodge.warned++;
        const { far, ms, hold } = action.dodge;
        const named = warned.groups?.x !== undefined ? [Number(warned.groups.x), Number(warned.groups.y)] : null;
        const spot = named?.every(isNumber) ? named : null;
        const { origin, yaw = 0 } = await driver.view();
        if (!origin) return false;
        const off = (at) => Math.hypot(at[0] - spot[0], at[1] - spot[1]);
        if (spot && off(origin) >= far) {
          tally.dodge.clear++;
          note(OWN, `${where}: warned (${shown(said)}), and ${rounded(off(origin))} off it already`);
          return false;
        }
        // away from the place; straight over it (or with no place said), to one side and the other the next time
        aside = -aside;
        const way = spot && off(origin) > 8 ? (Math.atan2(origin[1] - spot[1], origin[0] - spot[0]) * 180) / Math.PI : yaw + 90 * aside; // prettier-ignore
        const away = async () => Boolean(spot) && off((await driver.view()).origin ?? origin) >= far;
        const took = await moving(towards(way, yaw), ms, away);
        const now = (await driver.view()).origin ?? origin;
        tally.dodge.dodged++;
        calm = clock() + hold;
        note(OWN, `${where}: dodged ${shown(said)}: ${spot ? `from ${rounded(off(origin))} to ${rounded(off(now))} off ${spot.join(" ")}` : `a step aside, ${rounded(Math.hypot(now[0] - origin[0], now[1] - origin[1]))} units`} in ${took} ms`); // prettier-ignore
        return true;
      };
      /** The enemy chased: how near it has come, the rounds that came no nearer, the blows that landed on others. */
      let chased = null;
      let chasing = false;
      let hitsBefore = 0;
      let side = 1;
      const { line, over, took } = await again(action, where, from, async (ended) => {
        tally.rounds++;
        await listen();
        count();
        // the last round's blow, struck on the way to an enemy out of reach, landed: on another, in the way
        if (chasing && chased && tally.dealt.hits > hitsBefore) chased.others++;
        chasing = false;
        if (await evade()) return false;
        if (fallen !== null) {
          // down: a game may want a button pressed to rise, so the blows go on; risen when his health is back
          if (health !== null && health > 0 && lines.health) {
            tally.down += clock() - fallen;
            fallen = null;
            if (action.back) {
              await done(action.back);
              await arrived(action.post);
            }
            note(OWN, `${where}: the player died and has risen${action.back ? `, and is put back at ${placeText(action.post)}` : ""}`); // prettier-ignore
          } else if (clock() - fallen > RISES || !lines.health) {
            // a game that does not say his health: taken to have risen where he fell, after a moment
            tally.down += clock() - fallen;
            fallen = null;
            if (lines.health) throw new Error(`play: the player died in ${where} and had not risen ${rounded(RISES / 1000)} seconds after: the game never said his health again`); // prettier-ignore
          } else {
            await blow();
            return false;
          }
        }
        if (action.heal !== null && health !== null && most && health < action.heal * most) {
          await done(action.heals);
          tally.heals++;
          // the game is given a moment to say his health again, so that one wound is healed once
          const told = heard.length;
          await waitFor(lines.health, told, 1000);
          count();
        }
        const enemy = await find();
        tally.enemies.asked++;
        if (!enemy) {
          tally.enemies.none++;
          alone ??= clock();
          if (action.quiet !== null && clock() - alone >= action.quiet) return true;
          await driver.wait(IDLE);
          return false;
        }
        alone = null;
        const seen = enemy.count ?? 1;
        tally.enemies.sum += seen;
        tally.enemies.most = Math.max(tally.enemies.most, seen);
        if (enemy.close !== undefined) {
          tally.enemies.closeAsked++;
          tally.enemies.closeSum += enemy.close;
          tally.enemies.closeMost = Math.max(tally.enemies.closeMost, enemy.close);
        }
        if (tally.prefer && preferred(enemy.name)) tally.prefer.rounds++;
        const far = await aim(enemy.origin);
        if (action.chase !== null && far > action.chase && clock() >= calm) {
          // the same enemy chased: is he any nearer?
          const who = enemy.id ?? enemy.name ?? "";
          if (chased?.who !== who) chased = { who, best: far, stalled: 0, others: 0, tries: 0 };
          else if (far < chased.best - GAINED) Object.assign(chased, { best: far, stalled: 0, tries: 0 });
          else chased.stalled++;
          // as long as it takes him at a walk's pace, up to CHASE_MOST: one that keeps away is followed, not edged at
          const step = Math.min(CHASE_MOST, Math.max(100, ((far - action.chase) / PACE) * 1000));
          const held = chased.others >= 2 || chased.stalled >= 3;
          // four sidesteps that did not get him nearer: the preferred one is let be for a while, and the
          // nearest (who stands in the way) fought, where the game can be told to prefer nobody
          const canLetBe = action.prefer.length && (action.unprefers || !action.prefers);
          if (held && canLetBe && preferred(enemy.name) && chased.tries >= LET_BE_AFTER) {
            letBe = clock() + LET_BE;
            tally.prefer.letBe++;
            note(OWN, `${where}: ${enemy.name} is not got at (${chased.tries} sidesteps, ${rounded(far)} off): the nearest for ${LET_BE / 1000} s`); // prettier-ignore
            chased = null;
            await blow();
            return false;
          }
          if (action.sidestep !== null && held) {
            // held up by others in the way, or getting no nearer: round them, a step to the side, then on.
            // Twice to one side, then twice to the other: a side that got him on is kept for the next time
            if (chased.tries && chased.tries % 2 === 0) side = -side;
            chased.tries++;
            Object.assign(chased, { stalled: 0, others: 0 });
            tally.sidesteps++;
            await moving([side > 0 ? "moveright" : "moveleft"], action.sidestep);
            note(OWN, `${where}: a sidestep to the ${side > 0 ? "right" : "left"}, round what stands between him and ${enemy.name ?? "the enemy"} (${rounded(far)} off)`); // prettier-ignore
            await aim(enemy.origin);
          }
          // a step towards him, and the blow all the same: he may be in reach before it lands
          await moving(["forward"], step);
          // a fight whose time ran out in the step is ended by its time, at the loop's next look
          if (await ended()) return false;
          if (await evade()) return false;
          const left = await aim(enemy.origin);
          chasing = true;
          hitsBefore = tally.dealt.hits;
          // still well out of reach of where he was, and nobody on the player: no blow at the air, the next
          // round walks on. With others on him the blow is struck, and lands on whoever is in front
          if (left > action.chase + OUT_OF_REACH && enemy.close === 0) return false;
        }
        await blow();
        // in reach (a fight that says its reach with chase): more blows before he is asked for again, as a player
        // swings while the one before him stands; each with a look at the time and at a warning
        if (action.chase !== null && far <= action.chase)
          for (let more = 1; more < FLURRY; more++) {
            if ((await ended()) || (await evade())) return false;
            await blow();
          }
        await evade();
        return false;
      });
      await listen();
      count();
      if (preferSaid !== null && action.unprefers) await done(action.unprefers);
      if (fallen !== null) tally.down += clock() - fallen;
      tally.seconds = rounded(took / 1000);
      tally.down = rounded(tally.down / 1000);
      tally.ended = line ? "line" : over ? "quiet" : "time";
      if (line) tally.line = line.text;
      for (const side of [tally.dealt, tally.taken]) side.sum = rounded(side.sum);
      const { asked, none, sum, closeAsked, closeSum, ...kept } = tally.enemies;
      tally.enemies = {
        ...{ asked, none, most: kept.most, mean: asked ? Math.round((sum / asked) * 100) / 100 : 0 },
        ...(closeAsked ? { closeMost: kept.closeMost, closeMean: Math.round((closeSum / asked) * 100) / 100 } : {}),
      };
      tally.health.most = most ?? null;
      fights.push(tally);
      note("fight", fightLine(tally));
      tell?.(fightLine(tally));
      return line;
    };
    /** One action done through the driver: what it does, its `until`, then its wait. */
    const act = async (action, where) => {
      // what was said before the step is heard before it, so that "from this step on" is from here
      await listen();
      const from = heard.length;
      const hears = action.until ? sinceOf(action.since, from) : from;
      // a step that only reads or waits moves nothing on: the waits after a step that did a thing all hear from it
      if (!READS.includes(action.kind) && action.kind !== "wait") before = from;
      if (action.kind === "repeat") {
        const { line, passes } = await again(action, where, hears, async (ended) => {
          await block(action.actions, where, ended);
          return false;
        });
        note(OWN, `${where}: repeated ${passes} ${passes === 1 ? "time" : "times"}${line ? "" : action.until ? `, and the game did not say ${action.until}` : ""}`); // prettier-ignore
        if (action.wait > 0) await driver.wait(action.wait);
        return line;
      }
      if (action.kind === "fight") {
        const line = await fight(action, where, hears);
        if (action.wait > 0) await driver.wait(action.wait);
        return line;
      }
      const once = async () => {
        if (action.kind === "command" || action.kind === "goto")
          for (const [index, command] of action.commands.entries()) {
            if (index) await driver.wait(BETWEEN);
            await driver.command(command);
          }
        else if (action.kind === "button") {
          if (action.turn !== undefined && exact && typeof driver.view === "function" && driver.look) {
            // a build whose view cannot be read is turned by time from then on, as a driver with no view is
            const seen = await Promise.resolve(driver.view()).catch((error) => {
              exact = false;
              note(OWN, `${error.message}: a turn is by time, and about right only`);
              return null;
            });
            if (seen) {
              await driver.look({ yaw: (((seen.yaw + action.turn) % 360) + 540) % 360 - 180 }); // prettier-ignore
              return;
            }
          }
          await driver.command(`+${action.button}`);
          try {
            await driver.wait(action.ms);
          } finally {
            await driver.command(`-${action.button}`);
          }
        } else if (action.kind === "hold") {
          await driver.keyDown(action.key);
          try {
            await driver.wait(action.ms);
          } finally {
            await driver.keyUp(action.key);
          }
        } else if (action.kind === "press") await driver.press(action.key);
        else if (action.kind === "click") await driver.click(action.x, action.y);
        else if (action.kind === "mouse") {
          await driver.mouseDown(action.mouse);
          try {
            await driver.wait(action.ms);
          } finally {
            await driver.mouseUp(action.mouse);
          }
        } else if (action.kind === "tap") {
          for (let tapped = 0; tapped < action.times; tapped++) {
            if (tapped) await driver.wait(action.every - action.ms);
            await driver.mouseDown(action.mouse);
            try {
              await driver.wait(action.ms);
            } finally {
              await driver.mouseUp(action.mouse);
            }
          }
        } else if (action.kind === "faceAt") {
          let place = action.place;
          if (action.target) {
            const enemy = await targetOf(action.radius);
            if (!enemy)
              throw new Error(`play: there is no living enemy within ${action.radius} of the player to face`);
            place = enemy.origin;
          }
          await aim(place);
        } else if (action.kind === "mouseDown") {
          await driver.mouseDown(action.mouse);
          down.add(action.mouse);
        } else if (action.kind === "mouseUp") {
          await driver.mouseUp(action.mouse);
          down.delete(action.mouse);
        } else if (action.kind === "look") {
          const to = {};
          if (action.yaw !== undefined) to.yaw = action.yaw;
          if (action.pitch !== undefined) to.pitch = action.pitch;
          await driver.look(to);
        } else if (action.kind === "where") {
          const { yaw, pitch, origin } = await driver.view();
          note(
            "where",
            `where${action.name ? ` ${action.name}` : ""}: origin ${placeText(origin)}, yaw ${rounded(yaw)}, pitch ${rounded(pitch)}`,
          );
        } else if (action.kind === "map") await load(action.map);
        else if (action.kind === "expect" || action.kind === "expectNot")
          await expecting(action, where, from);
      };
      await once();
      if (action.kind === "goto" && typeof driver.view === "function") await arrived(action.place);
      let line = null;
      if (action.until) {
        line = await waitFor(action.until, hears, action.within, action.every, once, stoppedAt);
        if (!line)
          throw new Error(
            `play: the game never said ${action.until} in the ${rounded(action.within / 1000)} seconds it was given. ${lastLines(hears)}`,
          );
        stoppedAt.add(line);
      }
      if (action.wait > 0) await driver.wait(action.wait);
      return line;
    };
    /** The player is where a `goto` put him, or the run says where he is instead. */
    const arrived = async ([x, y, z]) => {
      let origin = null;
      for (let waited = 0; waited <= GOTO_WITHIN; waited += POLL) {
        ({ origin } = await driver.view());
        const near =
          origin &&
          Math.hypot(origin[0] - x, origin[1] - y) <= GOTO_NEAR &&
          Math.abs(origin[2] - z) <= GOTO_NEAR_Z;
        if (near) return;
        await driver.wait(POLL);
      }
      throw new Error(
        `play: the player was to be put at ${placeText([x, y, z])} and is at ${placeText(origin)}: does this map have the command the profile's play.goto names?`,
      );
    };
    const through = async (phase, actions) => {
      for (const [index, action] of actions.entries())
        await record(phase, index, action.kind, action.step, action.shot, (where) => act(action, where));
    };
    /** `map <name>`, the wait for it, and the profile's steps into the game. */
    const load = async (name, shots = false) => {
      state.entered = false;
      state.map = name;
      const loaded = async () => {
        const from = heard.length;
        await driver.command(`map ${name}`);
        if (!(part.loaded && hears)) {
          if (loading > 0) await driver.wait(loading);
          return null;
        }
        const line = await waitFor(part.loaded, from, loading);
        if (!line)
          throw new Error(
            `play: the map ${name} had not loaded after ${rounded(loading / 1000)} seconds: the game never said ${part.loaded}. ${lastLines(from)}`,
          );
        return line;
      };
      const step = { command: `map ${name}`, wait: loading };
      await record("load", 1, "command", step, shots ? "loaded" : null, loaded);
      mapFrom = heard.length;
      await through("enter", entering);
      if (entering.length && shots)
        await record("enter", entering.length, "wait", { shot: "entered" }, "entered", () => {});
      state.entered = true;
    };

    let failure = null;
    try {
      if (!state.up) await record("load", 0, "ready", null, null, ready);
      await listen();
      first = heard.length;
      mapFrom = first;
      // a game leaving a map may write its own files (a character saved as the server ends): the map is left
      // first, so that what is put is what the next map reads and not what the last one wrote over it
      // (a run that stays is not taken out of its map: what is put is read when the game next opens it)
      if (put.length && !staying && state.map !== null && typeof driver.leave === "function") {
        await driver.leave();
        await driver.wait(LEAVES);
        state.entered = false;
      }
      if (put.length && staying) {
        const said = "put while staying: the map is not left, and the game reads these files when it next opens them (a map, a script pack: at the next map)"; // prettier-ignore
        note(OWN, said);
        tell?.(said);
      }
      for (const each of put) {
        const bytes = each.bytes ?? readFileSync(each.file);
        await driver.put(each.path, bytes);
        note(OWN, `put ${each.path} (${bytes.length} bytes)`);
        tell?.(`put ${each.path} (${bytes.length} bytes)`);
      }
      for (const each of moved) {
        laid.set(each.key, { ...each });
        const said = each.files
          ? `over ${each.path}: ${each.files.length} files of ${each.folder} changed since the session had them${each.files.length ? `: ${each.files.slice(0, 8).join(", ")}${each.files.length > 8 ? ", ..." : ""}` : ""}` // prettier-ignore
          : `over ${each.path}: ${each.folder} is new to the session: marked now, and nothing of it put (what changes in it from now on is)`; // prettier-ignore
        note(OWN, said);
        tell?.(said);
      }
      if (!staying) await load(map, true);
      await through("steps", asked);
      for (const each of held.flat()) await expecting(each, "the run", heard.length);
    } catch (error) {
      failure = error;
    }
    // whatever is still held is let go: the next run begins with free hands
    for (const button of down) await Promise.resolve(driver.mouseUp(button)).catch(() => {});
    await listen().catch(() => {});
    state.runs++;

    // the log is kept whatever happened: a failed run's log says why
    const said = heard.slice(first).sort((a, b) => a.at - b.at);
    const lines = said.map((each) => ({ at: each.at - began, kind: each.kind, text: each.text }));
    let log = lines.map(
      (each) => `[${(each.at / 1000).toFixed(3).padStart(9)}] ${each.kind.padEnd(10)} ${each.text}`,
    );
    if (!hears)
      try {
        log = [...((await driver.log()) ?? [])].map(String);
      } catch {
        log = [];
      }
    const logFile = join(out, "log.txt");
    writeFileSync(logFile, log.join("\n"));
    const linesFile = join(out, "log.jsonl");
    if (hears)
      writeFileSync(
        linesFile,
        said.map((each) => JSON.stringify({ t: (each.at - began) / 1000, time: new Date(each.at).toISOString(), kind: each.kind, text: each.text })).join("\n"), // prettier-ignore
      );
    let sheetFile = null;
    if (sheet && pictures.length)
      try {
        sheetFile = join(out, "sheet.png");
        writeFileSync(sheetFile, sheetOf(pictures, SHEET));
      } catch {
        // pictures that are not PNG (a driver of another kind) make no sheet, and the run is no worse for it
        sheetFile = null;
      }
    const passed = !failure && expectations.every((each) => each.passed);
    const result = {
      ...{ map: state.map, out, took: Date.now() - began, passed },
      ...{ pictures, sheet: sheetFile, steps: done, expectations, fights },
      ...{ logFile, linesFile: hears ? linesFile : null, resultFile: join(out, "result.json") },
    };
    writeFileSync(
      result.resultFile,
      JSON.stringify({ ...result, failure: failure ? failure.message : null }, null, 2),
    );
    if (failure) throw Object.assign(failure, { pictures, logFile, sheet: sheetFile, expectations, fights });
    return { ...result, lines, log };
  }

  async function close() {
    state.up = false;
    state.entered = false;
    await driver.close();
  }

  return { ready, run, close, state };
}

/** Folders laid over the game's files, checked: `[{ path, folder, key }]`, the folder made whole. */
function oversOf(list) {
  if (!Array.isArray(list) || !list.every((each) => isText(each?.path) && isText(each?.folder)))
    throw new Error(
      `play: over is a list of { path, folder }: a place in the engine's files and the folder laid over it there, not ${shown(list)}`,
    );
  return list.map(({ path, folder }) => {
    const whole = resolve(folder);
    if (!existsSync(whole) || !statSync(whole).isDirectory())
      throw new Error(`play: over: ${folder} is no folder, to lay over ${path}`);
    const place = path.replace(/\\/g, "/").replace(/\/+$/, "");
    return { path: place, folder: whole, key: `${place}=${whole}` };
  });
}

/** Every file under a folder, `a/b.mdl` from it, with its size and time as a mark: what changed is told by it. */
function marksOf(folder, under = "", marks = new Map()) {
  for (const entry of readdirSync(join(folder, under), { withFileTypes: true })) {
    const name = `${under}${entry.name}`;
    if (entry.isDirectory()) marksOf(folder, `${name}/`, marks);
    else if (entry.isFile()) {
      const { size, mtimeMs } = statSync(join(folder, name));
      marks.set(name, `${size}:${mtimeMs}`);
    }
  }
  return marks;
}

/**
 * A map played from a cold start: the engine waited for, `map <name>`, the profile's steps to enter the
 * game, then `steps`, with a picture wherever a step asks for one; then the driver is closed. Resolves to
 * what `playSession`'s run does: `{ map, out, pictures, sheet, steps, expectations, passed, lines, log,
 * logFile, ... }`.
 *
 * Two pictures are taken unasked, since a run that never got into the game is told by them at a glance:
 * `loaded` when the map has loaded and `entered` after the profile's steps to enter (when it has any).
 *
 *   driver   a plain object: `ready()` resolves when the engine takes commands, `command(text)` runs a
 *            console command, `keyDown(key)`, `keyUp(key)`, `press(key)`, `click(x, y)`, `wait(ms)`,
 *            `shot(file)` writes a PNG of what the player sees, `log()` gives the console's lines and
 *            `close()` ends it. Each may be async. A driver may also have `lines(from)` (what it heard:
 *            `until` and the expectations need it), `view()` and `look({ yaw, pitch })` (`look`, `face`,
 *            `where`, `faceAt`, `fight`, an exact `turn`), `mouseDown(button)` and `mouseUp(button)`,
 *            `put(path, bytes)` with `leave()`, and `clock()` (its own time in milliseconds, where it is
 *            not the clock's: a test's fake, by which `repeat` and `fight` then count their time).
 *            `browserDriver` makes the kit's own, which has them all
 *   map      the map's name, as `map <name>` takes it
 *   steps    what to do once in the game (`playOf` has the format)
 *   out      the folder the pictures and the log go to; it is made
 *   mod      the mod's profile: its `play` part says how the game is entered and how a thing is said
 *   loads    milliseconds the map is given to load (unless told: the profile's `play.loads`)
 *   pause    milliseconds waited after a step that does something and gives no `wait` (1000)
 *   tell     a function handed a line as each thing is done, for a caller that prints while it waits
 *   expect, expectNot, put, sheet   as a session's run takes them
 *
 * Every step is checked before the driver is touched. The driver is closed and the log written whatever
 * happens; what a driver throws comes through with the step it was doing named before it. For a second map
 * or a second run without the engine's start, keep a `playSession`.
 */
export async function play({ driver, mod, pause, tell, ...run } = {}) {
  const session = playSession({ driver, mod, pause, tell });
  let result = null;
  let failure = null;
  try {
    result = await session.run({ ...run, stay: false });
  } catch (error) {
    failure = error;
  }
  // a run refused before the driver was touched leaves nothing to close
  if (session.state.up || session.state.runs)
    try {
      await session.close();
    } catch (error) {
      failure ??= new Error(`play: the driver did not close: ${error.message}`, { cause: error });
    }
  if (failure) throw failure;
  return result;
}

/** One thing done, as a line: when, how long, what, its picture and the line it waited for. */
function lineOf({ part, kind, step, at, took, picture, heard, where }) {
  const seconds = (ms) => `${(ms / 1000).toFixed(1).padStart(6)} s`;
  const what = kind === "ready" ? "the engine is up" : JSON.stringify(step);
  // a step of a block is said with its place in it: "1.2" is the second step of step 1's block
  const of = part === "enter" ? "enter  " : where ? `${where.replace(/^step /, "")}  ` : "";
  return `${seconds(at)} ${seconds(took)}  ${of}${what}${heard ? `   heard: ${heard}` : ""}${picture ? `   -> ${picture}` : ""}`;
}

/**
 * A fight, as a line: how long, how it ended, the blows struck and landed, the hits taken, the heals, the
 * deaths, who was slain, how many enemies there were at once and the least health seen.
 */
export function fightLine(fight) {
  const { where, seconds, ended, line, rounds, blows, dealt, taken, heals, deaths, slain, enemies, health, down } = fight; // prettier-ignore
  const rate = (sum) => (seconds > 0 ? (sum / seconds).toFixed(2) : "0.00");
  const names = new Map();
  for (const name of slain) names.set(name, (names.get(name) ?? 0) + 1);
  const dead = [...names].map(([name, count]) => (count > 1 ? `${name} x${count}` : name)).join(", ");
  return [
    `fight (${where}): ${seconds} s, ended by ${ended === "line" ? `the line ${shown(line)}` : ended === "quiet" ? "no enemy being left" : "its time"}`,
    `${blows} blows in ${rounds} rounds`,
    `dealt ${dealt.hits} hits, ${dealt.sum} in all (${rate(dealt.hits)} hits a second), ${dealt.missed} missed`,
    `taken ${taken.hits} hits, ${taken.sum} in all (${rate(taken.sum)} a second)`,
    `${heals} ${heals === 1 ? "heal" : "heals"}, ${deaths} ${deaths === 1 ? "death" : "deaths"}${deaths ? ` (${down} s down)` : ""}`,
    `slain ${slain.length}${dead ? `: ${dead}` : ""}`,
    `enemies at once: ${enemies.most} at most, ${enemies.mean} on average${enemies.closeMost === undefined ? "" : `; on the player: ${enemies.closeMost} at most, ${enemies.closeMean} on average`}${enemies.none ? ` (none found in ${enemies.none} of ${enemies.asked} rounds)` : ""}`,
    `health ${health.least ?? "not said"} at its least${health.most ? ` of ${health.most}` : ""}`,
    ...(fight.prefer ? [`preferred (${fight.prefer.words.join(", ")}): ${fight.prefer.slain} of the ${slain.length} slain, faced in ${fight.prefer.rounds} of ${rounds} rounds${fight.prefer.letBe ? `, let be ${fight.prefer.letBe} ${fight.prefer.letBe === 1 ? "time" : "times"} (not got at)` : ""}`] : []), // prettier-ignore
    ...(fight.sidesteps !== undefined ? [`${fight.sidesteps} ${fight.sidesteps === 1 ? "sidestep" : "sidesteps"} round others in the way`] : []), // prettier-ignore
    ...(fight.dodge ? [`dodged ${fight.dodge.dodged} of ${fight.dodge.warned} warnings${fight.dodge.clear ? ` (${fight.dodge.clear} heard off the place already)` : ""}`] : []), // prettier-ignore
  ].join("; ");
}

/** An expectation, as a line: whether it held, what it was, where it was asked and the line that decided. */
export function expectationLine({ where, kind, pattern, passed, line }) {
  const what = kind === "expect" ? "expect" : "expect no";
  const why = line ? `: ${line}` : kind === "expect" ? ": no such line was heard" : "";
  return `${passed ? "PASS" : "FAIL"}  ${what} ${pattern} (${where})${why}`;
}
