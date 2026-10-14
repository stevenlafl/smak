// The play driver hearing the game: lines waited for and asserted, the view set, a place gone to, a session
// kept for several runs and served to another process, and the sheet of a run's pictures.
//
// No browser and no game: the driver here is a fake one with a clock of its own (a wait moves it on and takes
// no time) and a game that says what it is told to say, so what is tested is what `play` does with what it
// hears. That the real driver hears a real game is not tested here (it needs Playwright and a build of the
// engine).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import * as smak from "../src/index.mjs";
import { hudInfoLines } from "../profiles/mastersword.mjs";
import { test, testAsync, sure, tmp, runRefused, SMAK_CLI } from "./helper.mjs";

const { play, playOf, playPartOf, playSession, patternOf, sheetOf, messagesOf, MESSAGE_READERS } = smak.play;
const { serveSession, attachSession, sessionState, closeSession } = smak.play;
const folder = join(tmp, "play-heard");
mkdirSync(folder, { recursive: true });
const inFolder = (name) => join(folder, name);
const bytesOf = (text) => [...Buffer.from(text, "latin1")];

/**
 * A driver with a clock and a game that speaks. `says`: `{ "<command>": [[after ms, text, kind], ...] }`: the
 * lines the game says that long after a command is given ("click" for a click). It writes its calls down,
 * keeps a view and a place, and a picture is a real PNG, so that a sheet can be made of them.
 */
const hearingDriver = (says = {}, { goes = true } = {}) => {
  const calls = [];
  const heard = [];
  const due = [];
  // it begins at the true time and runs ahead of it: a line's time is then after the run's beginning
  let now = Date.now();
  const view = { yaw: 0, pitch: 0, origin: [0, 0, 36] };
  const said = (word) => {
    for (const [after, text, kind = "console"] of says[word] ?? []) due.push({ at: now + after, kind, text });
  };
  const picture = smak.png(6, 6, new Uint8Array(6 * 6 * 4).fill(200));
  return {
    calls,
    clock: () => now,
    ready: () => void calls.push("ready"),
    command(text) {
      calls.push(`command ${text}`);
      said(text);
      const place = /^put me at (-?\d+) (-?\d+) (-?\d+)$/.exec(text);
      if (place && goes) view.origin = place.slice(1).map(Number);
    },
    click(x, y) {
      calls.push(`click ${x} ${y}`);
      said("click");
    },
    keyDown: (key) => void calls.push(`keyDown ${key}`),
    keyUp: (key) => void calls.push(`keyUp ${key}`),
    press: (key) => void calls.push(`press ${key}`),
    mouseDown: (button) => void calls.push(`mouseDown ${button}`),
    mouseUp: (button) => void calls.push(`mouseUp ${button}`),
    wait(ms) {
      now += ms;
    },
    shot(file) {
      calls.push(`shot ${file}`);
      writeFileSync(file, picture);
    },
    view: () => ({ ...view }),
    look(to) {
      calls.push(`look ${JSON.stringify(to)}`);
      Object.assign(view, to);
      return { ...view };
    },
    put: (path, bytes) => void calls.push(`put ${path} ${bytes.length}`),
    leave: () => void calls.push("leave"),
    lines(from = 0) {
      for (let at = due.length - 1; at >= 0; at--)
        if (due[at].at <= now) heard.push(...due.splice(at, 1).map((each) => ({ ...each, at: each.at })));
      heard.sort((a, b) => a.at - b.at);
      return heard.slice(from);
    },
    log: () => heard.map((each) => each.text),
    close: () => void calls.push("close"),
  };
};
const refusal = (run) => {
  try {
    run();
  } catch (e) {
    return e.message;
  }
  return "";
};
const refusalOf = async (run) => {
  try {
    await run();
  } catch (e) {
    return e.message;
  }
  return "";
};
// a made-up game: a map says "the map is in", its menu is clicked until it says "welcome", and it has a
// command that puts the player at a place
const GAME = {
  name: "smakgame",
  play: {
    enter: [{ click: [100, 200], every: 1000, until: "^welcome", within: 9000 }],
    say: ["say {text}"],
    loads: 20000,
    loaded: "the map is in",
    goto: ["put me at {x} {y} {z}"],
    messages: { TextMsg: "textmsg", Hud: (bytes) => `hud: ${String.fromCharCode(...bytes)}` },
  },
};
const GAME_SAYS = {
  "map yard": [[4000, "the map is in"]],
  "map road": [[2500, "the map is in"]],
  click: [[300, "welcome to the yard"]],
};

// ── steps ──

test("playOf makes the new kinds plain actions: the mouse, the view, a place, a map, an expectation", () => {
  const actions = playOf(
    [
      { mouse: "left", ms: 2500 },
      { mouseDown: "right" },
      { mouseUp: "right", wait: 0 },
      { look: -30 },
      { face: 90 },
      { face: 180, look: 10, shot: "round" },
      { goto: [512, 96, 36] },
      { where: "gate" },
      { map: "road" },
      { expect: "HIT! .* holy damage", since: "map" },
      { expectNot: "/script error/i", within: 3000 },
      { command: "use", until: "The chest gives you", within: 8000, every: 1500 },
      { until: "dies" },
    ],
    { mod: GAME },
  );
  const plain = actions.map(({ step: _step, ...rest }) => JSON.stringify(rest));
  const expected = [
    { kind: "mouse", mouse: "left", ms: 2500, wait: 1000, shot: null },
    { kind: "mouseDown", mouse: "right", wait: 1000, shot: null },
    { kind: "mouseUp", mouse: "right", wait: 0, shot: null },
    { kind: "look", pitch: -30, wait: 1000, shot: null },
    { kind: "look", yaw: 90, wait: 1000, shot: null },
    { kind: "look", yaw: 180, pitch: 10, wait: 1000, shot: "round" },
    { kind: "goto", commands: ["put me at 512 96 36"], place: [512, 96, 36], wait: 1000, shot: null },
    { kind: "where", name: "gate", wait: 0, shot: null },
    { kind: "map", map: "road", wait: 0, shot: null },
  ];
  expected.forEach((action, index) =>
    sure(plain[index] === JSON.stringify(action), `step ${index + 1} became ${plain[index]}`),
  );
  const [expects, expectsNot, until, only] = actions.slice(9);
  sure(
    expects.kind === "expect" && expects.pattern.test("HIT! 4.0 holy damage") && expects.since === "map",
    "an expectation keeps its pattern and where it reads from",
  );
  sure(expects.within === 0 && expects.wait === 0, "and is looked at there and then, with no wait after it");
  sure(
    expectsNot.pattern.test("Script Error in x") && expectsNot.within === 3000 && expectsNot.since === "run",
    "a pattern written /so/i has its flags; an expectation reads the run unless told",
  );
  sure(
    until.kind === "command" && until.until.test("The chest gives you a mace") && until.wait === 0,
    "a step with until waits for the line and not for the clock",
  );
  sure(until.within === 8000 && until.every === 1500, "with its within and its every");
  sure(only.kind === "wait" && only.within === 30000 && only.every === null, "until alone waits 30 seconds");
});

test("a wrong new step is refused in a sentence that names it", () => {
  const wrong = [
    [[{ mouse: "thumb", ms: 100 }], /step 1 names the mouse's button "thumb": left, right, middle/],
    [[{ mouse: "left" }], /step 1 holds the mouse's button for nothing/],
    [[{ look: 120 }], /step 1 looks 120: degrees up, from -89/],
    [[{ face: "north" }], /step 1 faces "north": a yaw in degrees/],
    [[{ goto: [1, 2] }], /step 1 goes to \[1,2\]: \[x, y, z\]/],
    [[{ where: "a b" }], /step 1 asks where under the name "a b"/],
    [[{ map: "a; quit" }], /step 1 loads the map "a; quit"/],
    [[{ expect: "(" }], /step 1 expects "\(" is no regular expression/],
    [[{ walk: 100, until: "" }], /step 1 waits until is a regular expression as text.*not ""/],
    [[{ walk: 100, within: 500 }], /has within, which goes with until, expect or expectNot only/],
    [[{ until: "x", every: 500 }], /has every, which goes with until, on a step that does a thing/],
    [[{ walk: 100, since: "map" }], /has since, which goes with until, expect or expectNot only/],
    [[{ expect: "x", until: "y" }], /has until and expect: an expectation waits by its own within/],
    [[{ look: 10, walk: 100 }], /step 1 has walk and look: one thing a step/],
  ];
  for (const [steps, sentence] of wrong) {
    const said = refusal(() => playOf(steps, { mod: GAME }));
    sure(
      sentence.test(said),
      `${JSON.stringify(steps)} was ${said ? `refused with: ${said}` : "not refused"}`,
    );
  }
  sure(
    /goes to a place, and the profile names no command that puts the player at one \(play\.goto\)/.test(
      refusal(() => playOf([{ goto: [1, 2, 3] }])),
    ),
    "a goto with no profile's command is refused: the engine has none",
  );
  sure(/mod: play.goto is a list of console commands/.test(refusal(() => playPartOf({ play: { goto: "tele" } }))), "a profile's goto that is a word"); // prettier-ignore
  sure(/mod: play.messages gives each message's name the way it is read/.test(refusal(() => playPartOf({ play: { messages: { TextMsg: "morse" } } }))), "a profile's reader that is none"); // prettier-ignore
  sure(/mod: play.loaded "\(" is no regular expression/.test(refusal(() => playPartOf({ play: { loaded: "(" } }))), "a profile's loaded that is no pattern"); // prettier-ignore
});

test("the SDK's messages are read as the SDK writes them, and a profile names the ones it reads", () => {
  sure(
    MESSAGE_READERS.textmsg(bytesOf("\x02%s killed %s\n\0the keeper\0a rat\n\0")).join("|") ===
      "the keeper killed a rat",
    "TextMsg: where it goes, the text, and the strings put into it",
  );
  sure(
    MESSAGE_READERS.textmsg(bytesOf("\x01TRIAL where origin (1,2,3)\n\0")).join("|") ===
      "TRIAL where origin (1,2,3)",
    "a line for the console is the line",
  );
  sure(MESSAGE_READERS.saytext(bytesOf("\x01\x02Keeper: hail\n\0")).join("|") === "Keeper: hail", "SayText"); // prettier-ignore
  sure(
    MESSAGE_READERS.strings([3, 0, ...bytesOf("gate\0"), 7, 0, ...bytesOf("open\0")]).join("|") ===
      "gate|open",
    "any message: its strings",
  );
  sure(messagesOf(GAME).join(" ") === "TextMsg Hud", "a profile's messages are the ones a driver listens to");
  sure(messagesOf(undefined).join(" ") === "TextMsg SayText", "GOLDSRC reads the SDK's two");
  sure(patternOf("/flame sinks/i").test("The Flame Sinks"), "a pattern with flags");
  sure(!patternOf("flame sinks").test("The Flame Sinks"), "and one without: capitals count");
});

test("Master Sword's profile reads the game's own HUD message: boxes, events, tips, speech", () => {
  const box = [0, ...bytesOf("Welcome to Master Sword\0No player killing|Characters are stored\0")];
  sure(
    hudInfoLines(box) === "Welcome to Master Sword: No player killing | Characters are stored",
    `a box is its title and its text on one line, not ${hudInfoLines(box)}`,
  );
  const event = [1, 240, 0, 0, 0, ...bytesOf("You attack a Skeleton. (99/25) HIT! 4.0 holy damage.\n\0")];
  sure(
    hudInfoLines(event).filter(Boolean).join("|") === "You attack a Skeleton. (99/25) HIT! 4.0 holy damage.",
    "a line of the event console, past its four bytes of colour",
  );
  sure(
    hudInfoLines([2, 0, ...bytesOf("Four things lie in it, \0")]) === null,
    "a tip's part says nothing yet",
  );
  hudInfoLines([2, 1, ...bytesOf("and each player may take one.\0")]);
  sure(
    hudInfoLines([3, ...bytesOf("THE CHEST\0")]) ===
      "THE CHEST: Four things lie in it, and each player may take one.",
    "a tip is told whole when its title comes",
  );
  sure(hudInfoLines([4, 1, ...bytesOf("Deoroot says, hail\0")]).join("|") === "Deoroot says, hail", "speech");
});

// ── a run that hears ──

await testAsync(
  "a map is loaded and entered by what the game says, not by the clock",
  "play: loaded and entered by text",
  async () => {
    const driver = hearingDriver(GAME_SAYS);
    const began = driver.clock();
    const run = await play({ driver, map: "yard", out: inFolder("heard"), mod: GAME, steps: [] });
    const waited = driver.clock() - began;
    sure(waited >= 4000 && waited < 6000, `the run waited ${waited} ms: the map's 4000 and the menu's 300`);
    sure(
      driver.calls.filter((call) => call.startsWith("click")).length === 1,
      "the menu was clicked once: the game answered",
    );
    sure(run.steps[1].heard === "the map is in", "the line that said the map had loaded is kept");
    sure(run.steps[2].heard === "welcome to the yard", "and the one that said the player was in");
    sure(run.passed === true && run.expectations.length === 0, "a run that expects nothing passes");

    // a menu that takes no click until it is drawn: the click is done again
    let clicks = 0;
    const slow = hearingDriver(GAME_SAYS);
    const click = slow.click;
    slow.click = (x, y) => {
      if (++clicks < 3) return void slow.calls.push(`click ${x} ${y}`);
      click(x, y);
    };
    await play({ driver: slow, map: "yard", out: inFolder("slow"), mod: GAME, steps: [] });
    sure(clicks === 3, `a click that is not taken is made again every second: ${clicks} clicks`);

    // a map that never says it has loaded
    const dead = hearingDriver({});
    const said = await refusalOf(() => play({ driver: dead, map: "yard", out: inFolder("dead"), mod: GAME, loads: 3000 })); // prettier-ignore
    sure(
      /^play: the map yard had not loaded after 3 seconds: the game never said \/the map is in\/\. It said nothing meanwhile \(at loading the map\)$/.test(
        said,
      ),
      `it said: ${said}`,
    );
    sure(dead.calls.at(-1) === "close", "and the driver is closed");
  },
);

await testAsync(
  "until waits for a line and stops the run when it never comes; expect and expectNot pass or fail it",
  "play: until and expectations",
  async () => {
    const driver = hearingDriver({
      ...GAME_SAYS,
      "+attack": [
        [700, "You attack a Skeleton. HIT! 2.0 blunt damage."],
        [1900, "You attack a Skeleton. HIT! 4.0 holy damage.", "Hud"],
      ],
      kindle: [[400, "You kindle the lantern."], [15400, "The flame sinks."]], // prettier-ignore
    });
    const out = inFolder("lantern");
    const told = [];
    const run = await play({
      ...{ driver, map: "yard", out, mod: GAME, tell: (line) => told.push(line) },
      steps: [
        { command: "kindle", until: "You kindle", within: 5000, shot: "kindled" },
        { command: "+attack", until: "holy damage", within: 5000 },
        { expect: "HIT! .* holy damage" },
        { expect: "blunt damage", since: "kindled" },
        { expectNot: "The flame sinks" },
        { until: "The flame sinks", within: 20000, shot: "sunk" },
        { expect: "The flame sinks", since: "step", within: 1000 },
        { expect: "The flame sinks" },
        { expectNot: "Script Error" },
      ],
      expect: ["^welcome"],
      expectNot: ["PAGE ERROR"],
    });
    const held = run.expectations.map((each) => `${each.kind}:${each.passed}`).join(" ");
    sure(
      held ===
        "expect:true expect:true expectNot:true expect:false expect:true expectNot:true expect:true expectNot:true",
      `the expectations came out as ${held}`,
    );
    sure(run.passed === false, "one that does not hold fails the run, which goes on to its end");
    sure(run.expectations[3].where === "step 7" && run.expectations[3].line === null, "and says where");
    sure(run.expectations[6].where === "the run", "the run's own expectations are looked at last");
    sure(
      run.expectations[0].line === "You attack a Skeleton. HIT! 4.0 holy damage.",
      "the line that decided is kept",
    );
    sure(run.steps.at(-1).kind === "expectNot", "an expectation is a thing done, with its time");

    const log = readFileSync(run.logFile, "utf8").split("\n");
    sure(
      log.some((line) => /^\[ +\d+\.\d{3}\] console +You kindle the lantern\.$/.test(line)),
      "log.txt has each line with its time and its kind",
    );
    sure(
      log.some((line) => /\] play +PASS {2}expect \/HIT! \.\* holy damage\/ \(step 3\)/.test(line)),
      "the run's own notes are among them, where they happened",
    );
    const lines = readFileSync(run.linesFile, "utf8").split("\n").map((line) => JSON.parse(line)); // prettier-ignore
    const holy = lines.find((line) => /holy/.test(line.text) && line.kind === "Hud");
    sure(
      holy && holy.t > 0 && /^\d{4}-\d\d-\d\dT/.test(holy.time),
      "log.jsonl has them as JSON, a line each",
    );
    sure(
      run.lines.some((each) => each.kind === "Hud" && each.at >= 0),
      "and the run gives them back",
    );
    const result = JSON.parse(readFileSync(run.resultFile, "utf8"));
    sure(
      result.passed === false && result.expectations.length === 8 && result.failure === null,
      "result.json",
    );
    sure(
      existsSync(run.sheet) && smak.unpng(readFileSync(run.sheet)).width > 0,
      "the pictures are on a sheet",
    );

    // a line that never comes stops the run, and says what was heard meanwhile
    const never = hearingDriver({ ...GAME_SAYS, "+attack": [[500, "MISS!"]] });
    let failure = null;
    try {
      await play({
        ...{ driver: never, map: "yard", out: inFolder("never"), mod: GAME },
        steps: [{ expect: "welcome" }, { command: "+attack", until: "HIT!", within: 2000 }, { walk: 100 }],
      });
    } catch (e) {
      failure = e;
    }
    sure(
      /^play: the game never said \/HIT!\/ in the 2 seconds it was given\. The last it said: "MISS!" \(at step 2\)$/.test(
        failure?.message ?? "",
      ),
      `it said: ${failure?.message}`,
    );
    sure(
      failure.expectations.length === 1 && failure.expectations[0].passed,
      "what was expected before it is kept",
    );
    sure(!never.calls.includes("command +forward"), "the steps after it are not done");
    sure(JSON.parse(readFileSync(join(inFolder("never"), "result.json"), "utf8")).passed === false, "and result.json says it failed"); // prettier-ignore
    sure(/no picture named "gate" was taken before/.test(await refusalOf(() => play({ driver: hearingDriver(GAME_SAYS), map: "yard", out: inFolder("mark"), mod: GAME, steps: [{ expect: "x", since: "gate" }] }))), "since names a picture that was taken"); // prettier-ignore
  },
);

await testAsync(
  "a driver that cannot is refused before it is touched: hearing, the view, the mouse, files",
  "play: what a driver cannot",
  async () => {
    const deaf = () => {
      const {
        lines: _lines,
        view: _view,
        look: _look,
        mouseDown: _down,
        put: _put,
        ...rest
      } = hearingDriver();
      return rest;
    };
    const given = { map: "yard", out: inFolder("deaf"), loads: 0 };
    const wrong = [
      [{ steps: [{ until: "x" }] }, /step 1 waits for what the game says, and this driver hears nothing/],
      [{ steps: [{ walk: 10 }, { expect: "x" }] }, /step 2 waits for what the game says/],
      [{ steps: [{ look: 10 }] }, /step 1 sets the view, which this driver cannot/],
      [{ steps: [{ where: true }] }, /step 1 asks where the player is, which this driver does not know/],
      [
        { steps: [{ mouse: "left", ms: 5 }] },
        /step 1 holds a button of the mouse, and this driver has no mouse/,
      ],
      [{ expect: ["x"] }, /an expectation reads what the game says, and this driver hears nothing/],
      [
        { put: [{ path: "maps/a.bsp", bytes: Buffer.alloc(1) }] },
        /this driver cannot put a file into the engine/,
      ],
      [{ put: [{ path: "maps/a.bsp" }] }, /put is a list of \{ path, file \}/],
    ];
    for (const [options, sentence] of wrong) {
      const driver = deaf();
      const said = await refusalOf(() => play({ driver, ...given, ...options }));
      sure(sentence.test(said), said ? `it was refused with: ${said}` : `${sentence} was not refused`);
      sure(
        driver.calls.length === 0,
        `the driver was touched before the refusal: ${driver.calls.join(", ")}`,
      );
    }
    // such a driver turns by time, as before, and a profile's loaded line is waited out by the clock
    const driver = deaf();
    await play({ driver, ...given, loads: 700, steps: [{ turn: 90, wait: 0 }] });
    sure(driver.calls.includes("command +left"), "a turn is a button held where the view cannot be set");
    sure(driver.clock() >= 700, "and a map's loading is waited out by the clock where nothing is heard");
  },
);

await testAsync(
  "the view is set exactly, a place is gone to and made sure of, the mouse is held and let go",
  "play: view, place, mouse",
  async () => {
    const driver = hearingDriver(GAME_SAYS);
    const run = await play({
      ...{ driver, map: "yard", out: inFolder("view"), mod: GAME, pause: 0 },
      steps: [
        { face: 170 },
        { turn: 30 },
        { where: "turned" },
        { look: -20 },
        { goto: [512, 96, 36] },
        { where: "there" },
        { mouse: "left", ms: 400 },
        { mouseDown: "right" },
        { walk: 100 },
        { expect: "^where turned: origin 0 0 36, yaw -160, pitch 0$" },
        { expect: "^where there: origin 512 96 36, yaw -160, pitch -20$" },
      ],
    });
    sure(
      run.passed,
      `where the player is and looks is a line of the log: ${JSON.stringify(run.expectations)}`,
    );
    sure(
      driver.calls.includes('look {"yaw":170}') && driver.calls.includes('look {"yaw":-160}'),
      "a turn is the yaw read, the degrees added, and the yaw set: 170 and 30 is -160",
    );
    sure(!driver.calls.some((call) => /[+-]left/.test(call)), "and no button held by the clock");
    const calls = driver.calls.join("|");
    sure(/mouseDown left\|mouseUp left/.test(calls), "a mouse step holds the button and lets it go");
    sure(
      /mouseDown right\|command \+forward\|command -forward\|mouseUp right\|close$/.test(calls),
      "a button held by mouseDown stays down through the steps after it, and is let go at the run's end",
    );

    const stuck = hearingDriver(GAME_SAYS, { goes: false });
    const said = await refusalOf(() =>
      play({
        driver: stuck,
        map: "yard",
        out: inFolder("stuck"),
        mod: GAME,
        steps: [{ goto: [512, 96, 36] }],
      }),
    );
    sure(
      /^play: the player was to be put at 512 96 36 and is at 0 0 36: does this map have the command the profile's play\.goto names\? \(at step 1\)$/.test(
        said,
      ),
      `a goto that did not arrive says so: ${said}`,
    );
  },
);

// ── a session ──

await testAsync(
  "a session starts the engine once: a second run, another map, steps that stay, files put first",
  "play: a session",
  async () => {
    const driver = hearingDriver(GAME_SAYS);
    const session = playSession({ driver, mod: GAME, pause: 0 });
    sure(/stay goes on from the run before/.test(await refusalOf(() => session.run({ stay: true, out: inFolder("s0") }))), "nothing to stay in yet"); // prettier-ignore
    const first = await session.run({ map: "yard", out: inFolder("s1"), steps: [{ walk: 100 }] });
    const bsp = inFolder("road.bsp");
    writeFileSync(bsp, "a map");
    const second = await session.run({
      ...{ map: "road", out: inFolder("s2"), expect: ["the map is in"] },
      put: [{ path: "game/maps/road.bsp", file: bsp }, { path: "game/save/a.sav", bytes: Buffer.from("abc") }], // prettier-ignore
      steps: [{ command: "noclip" }],
    });
    const third = await session.run({ stay: true, out: inFolder("s3"), steps: [{ map: "yard" }, { expect: "welcome", since: "map" }] }); // prettier-ignore
    sure(driver.calls.filter((call) => call === "ready").length === 1, "the engine was started once");
    sure(!driver.calls.includes("close"), "and is not closed by a run");
    sure(
      first.steps[0].kind === "ready" && second.steps[0].kind === "command",
      "only the first run waits for it",
    );
    const calls = driver.calls.join("|");
    sure(
      /leave\|put game\/maps\/road\.bsp 5\|put game\/save\/a\.sav 3\|command map road/.test(calls),
      "the map is left, the files are put, and then the map is loaded",
    );
    sure(second.passed && second.map === "road", "the second run is in its own map");
    sure(
      !readFileSync(second.logFile, "utf8").includes("map yard") &&
        second.lines.every((each) => each.at >= 0),
      "and its log is its own: nothing of the run before",
    );
    sure(third.passed && third.steps.some((each) => each.part === "enter"), "a map step loads and enters, in the run"); // prettier-ignore
    sure(third.pictures.length === 0 && third.sheet === null, "a run that stays takes no picture unasked");
    sure(
      session.state.runs === 3 && session.state.map === "yard" && session.state.entered,
      "the session's state",
    );
    await session.close();
    sure(driver.calls.at(-1) === "close" && !session.state.up, "close ends it");
  },
);

await testAsync(
  "a session is served to other processes: a run, its lines as it goes, a failure, the close",
  "play: a session served",
  async () => {
    const driver = hearingDriver({ ...GAME_SAYS, kindle: [[300, "You kindle the lantern."]] });
    const session = playSession({ driver, mod: GAME, pause: 0 });
    // a port of its own, away from a session that may be up on this machine
    const served = await serveSession({ session, port: 18098 + Math.floor(Math.random() * 500) });
    try {
      sure((await sessionState(served.address)).up === true, "the engine is up when the session is served");
      const told = [];
      const run = await attachSession(
        served.address,
        { map: "yard", out: inFolder("served"), steps: [{ command: "kindle", until: "kindle the lantern" }, { expect: "You kindle" }] }, // prettier-ignore
        { tell: (line) => told.push(line) },
      );
      sure(run.passed && run.expectations.length === 1 && existsSync(run.logFile), "the run comes back");
      sure(told.length === run.steps.length && /map yard/.test(told[0]), `each thing done is told as it is done: ${told.length}`); // prettier-ignore
      const state = await sessionState(served.address);
      sure(state.map === "yard" && state.runs === 1 && state.busy === false, "the state says where it is");
      let failure = null;
      try {
        await attachSession(served.address, { stay: true, out: inFolder("served2"), steps: [{ until: "never", within: 500 }] }); // prettier-ignore
      } catch (e) {
        failure = e;
      }
      sure(/^play: the game never said \/never\//.test(failure?.message ?? ""), `a run that stops throws here too: ${failure?.message}`); // prettier-ignore
      sure(existsSync(failure.logFile), "with its log named");
      sure(/step 1 has fly, which no step has/.test(await refusalOf(() => attachSession(served.address, { stay: true, out: inFolder("served3"), steps: [{ fly: 1 }] }))), "a wrong step is refused by the session"); // prettier-ignore
    } finally {
      await closeSession(served.address);
      await served.closed;
    }
    sure(driver.calls.at(-1) === "close", "closing the session closes the game");
    sure(/no session answers at/.test(await refusalOf(() => sessionState(served.address))), "and nothing answers there any more"); // prettier-ignore
  },
);

// ── the sheet, the command line ──

test("sheetOf puts pictures side by side, smaller, each under its name", () => {
  const files = ["00_loaded", "01_entered", "02_gate"].map((name, index) => {
    const file = inFolder(`${name}.png`);
    const rgba = new Uint8Array(240 * 120 * 4).fill(40 + index * 80);
    writeFileSync(file, smak.png(240, 120, rgba));
    return file;
  });
  const sheet = smak.unpng(sheetOf(files, { cols: 2, shrink: 3 }));
  sure(
    sheet.width === 160 && sheet.height === 80,
    `two columns of 80 by 40, two rows: ${sheet.width} by ${sheet.height}`,
  );
  const at = (x, y) => sheet.rgba[(y * sheet.width + x) * 4];
  sure(at(120, 35) === 120 && at(40, 75) === 200, "each picture in its place, in the order given");
  sure(at(8, 8) !== 40, "with its name written over its corner");
  sure(/a sheet is made of pictures/.test(refusal(() => sheetOf([]))), "none is refused");
  sure(/cols and shrink are whole numbers over 0/.test(refusal(() => sheetOf(files, { shrink: 0 }))), "a shrink of 0"); // prettier-ignore
});

test("smak play refuses in a sentence: a stay without a session, a put that is no pair, no session there", () => {
  const steps = inFolder("steps.json");
  writeFileSync(steps, JSON.stringify([{ walk: 100, until: "x" }]));
  const cases = [
    [["http://127.0.0.1:1/", "--stay", "--steps", steps], /^play: --stay goes on in the map a session is in/],
    [
      ["http://127.0.0.1:1/", "--map", "a", "--put", "maps/a.bsp"],
      /^play: --put <place in the game's files>=<file>/,
    ],
    [["http://127.0.0.1:1/", "--map", "a", "--expect", "("], /^play: --expect "\(" is no regular expression/],
    [
      ["http://127.0.0.1:1/", "--attach", "--map", "a"],
      /^play: no session answers at http:\/\/127\.0\.0\.1:1\//,
    ],
    [
      ["http://127.0.0.1:1/", "--map", "a", "--steps", steps, "--steps", steps],
      /^play: 2 --steps and 1 --map/,
    ],
    [["orchard.bsp", "--attach", "--map", "a"], /with --attach it is the session's/],
  ];
  for (const [args, sentence] of cases) {
    const run = runRefused(SMAK_CLI, "play", ...args);
    sure(
      run.code === 1 && sentence.test(run.err),
      `smak play ${args.join(" ")} ended with ${run.code}: ${run.err}`,
    );
    sure(!/\n\s+at /.test(run.err), "no stack trace");
  }
});
