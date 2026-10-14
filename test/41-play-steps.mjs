// The play driver's steps that came of a map rebuilt with it: from where an `until` hears, a tap of the
// mouse, the view turned to a place, a block of steps done again, and a run that stays where it is.
//
// No browser and no game: the driver is fixture-game.mjs's, with a clock of its own.
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import * as smak from "../src/index.mjs";
import { test, testAsync, sure, tmp } from "./helper.mjs";
import { GAME, GAME_SAYS, gameDriver, refusalOf } from "./fixture-game.mjs";

const { play, playOf, playSession } = smak.play;
const folder = join(tmp, "play-steps");
mkdirSync(folder, { recursive: true });
const inFolder = (name) => join(folder, name);
const refusal = (run) => {
  try {
    run();
  } catch (e) {
    return e.message;
  }
  return "";
};
const plain = ({ step: _step, ...rest }) => JSON.stringify(rest);

test("playOf makes a tap, a place to face and a block to repeat plain actions", () => {
  const [tap, taps, tapped, at, enemy, block] = playOf(
    [
      { tap: "left" },
      { tap: "right", times: 3, every: 400, ms: 100, wait: 50 },
      { tap: "left", until: "HIT", within: 5000 },
      { faceAt: [100, 0, 64] },
      { faceAt: "target", radius: 300 },
      { repeat: [{ faceAt: "target" }, { tap: "left" }], until: "dies", within: 9000, shot: "dead" },
    ],
    { mod: GAME },
  );
  sure(
    plain(tap) === '{"kind":"tap","mouse":"left","ms":200,"times":1,"every":700,"wait":500,"shot":null}',
    `a tap is down 200 ms, and what is left of its 700 is waited after it: ${plain(tap)}`,
  );
  sure(
    plain(taps) === '{"kind":"tap","mouse":"right","ms":100,"times":3,"every":400,"wait":50,"shot":null}',
    `a tap takes times, every, ms and its own wait: ${plain(taps)}`,
  );
  sure(
    tapped.until.test("HIT!") && tapped.every === 700 && tapped.wait === 0 && tapped.since === "step",
    "a tap with until is tapped again as often as it taps, and hears from its own beginning",
  );
  sure(plain(at) === '{"kind":"faceAt","place":[100,0,64],"wait":1000,"shot":null}', plain(at));
  sure(enemy.kind === "faceAt" && enemy.target === true && enemy.radius === 300, plain(enemy));
  sure(
    block.kind === "repeat" && block.actions.length === 2 && block.actions[1].kind === "tap",
    "a repeat holds its steps as actions",
  );
  sure(block.until.test("it dies") && block.within === 9000 && block.times === null && block.for === null, "with its end"); // prettier-ignore
  sure(block.wait === 0 && block.shot === "dead", "no wait after a block unless told; a picture when it has ended");
  const [only, did] = playOf([{ until: "x" }, { command: "y", until: "x", since: "deed" }]);
  sure(only.since === "deed" && did.since === "deed", "a step that only waits hears from the last that did a thing");
});

test("a wrong tap, faceAt or repeat is refused in a sentence that names it", () => {
  const wrong = [
    [[{ tap: "thumb" }], /step 1 names the mouse's button "thumb": left, right, middle/],
    [[{ tap: "left", times: 0 }], /step 1 does it 0 times: a whole number over 0/],
    [[{ tap: "left", ms: 900 }], /step 1 holds the button 900 ms and taps every 700: a tap is over before the next/],
    [[{ walk: 100, times: 2 }], /step 1 has times, which goes with tap or repeat only/],
    [[{ faceAt: [1, 2] }], /step 1 faces \[1,2\]: \[x, y, z\], a place in the map's units, or "target"/],
    [[{ faceAt: [1, 2, 3], radius: 9 }], /step 1 has radius, which goes with faceAt: "target" only/],
    [[{ repeat: [], times: 1 }], /step 1 repeats \[\]: a list of steps/],
    [[{ repeat: [{ walk: 100 }] }], /step 1 repeats without an end: until \(a line\), times \(a count\) or for \(milliseconds\)/],
    [[{ repeat: [{ walk: 100 }], times: 2, every: 100 }], /step 1 has every and repeat: what is done again there is the block itself/],
    [[{ repeat: [{ walk: 100 }, { stroll: 1 }], times: 2 }], /step 1\.2 has stroll, which no step has/],
    [[{ walk: 100, for: 2000 }], /step 1 has for, which goes with repeat or fight only/],
    [[{ until: "x", since: "a b" }], /step 1 reads since "a b": run, map, step, deed, or the name of a picture/],
  ]; // prettier-ignore
  for (const [steps, sentence] of wrong) {
    const said = refusal(() => playOf(steps, { mod: GAME }));
    sure(sentence.test(said), `${JSON.stringify(steps)} was ${said ? `refused with: ${said}` : "not refused"}`);
  }
  sure(
    /step 1 faces the nearest enemy, and the profile names no way to find one \(play\.target\)/.test(
      refusal(() => playOf([{ faceAt: "target" }])),
    ),
    "the nearest enemy with no profile's way to find one is refused: the engine has none",
  );
});

await testAsync(
  "an until that only waits hears from the last step that did a thing; one that does a thing, from its own beginning",
  "play: from where an until hears",
  async () => {
    // the altar says two lines in one instant, and a third while the step is still at its wait
    const says = {
      ...GAME_SAYS,
      "use altar": [[500, "the altar sinks"], [500, "the dead get up"], [900, "a door opens"]], // prettier-ignore
      strike: [[200, "HIT"]],
    };
    const driver = gameDriver(says);
    const run = await play({
      ...{ driver, map: "yard", out: inFolder("heard"), mod: GAME },
      steps: [
        { command: "use altar", until: "the altar sinks", wait: 1000 },
        { until: "the dead get up", within: 2000 },
        { until: "a door opens", within: 2000 },
        { command: "strike", wait: 500 },
        { where: "here" },
        { until: "HIT", within: 1000 },
      ],
    });
    const heard = run.steps.filter((each) => each.part === "steps").map((each) => each.heard ?? null);
    sure(heard[1] === "the dead get up", "a line said in the same instant as the one the step before waited for is heard"); // prettier-ignore
    sure(heard[2] === "a door opens", "and one said while the step before was at its wait");
    sure(heard[5] === "HIT", "a step that only reads between them moves nothing on");

    // no until stops at a line another has stopped at: two waits for a hit want two hits
    const twice = gameDriver({ ...GAME_SAYS, strike: [[200, "HIT"]] });
    const said = await refusalOf(() =>
      play({
        ...{ driver: twice, map: "yard", out: inFolder("twice"), mod: GAME },
        steps: [{ command: "strike", wait: 0 }, { until: "HIT", within: 1000 }, { until: "HIT", within: 1000 }],
      }),
    );
    sure(/^play: the game never said \/HIT\/ in the 1 seconds it was given\..*\(at step 3\)$/.test(said), `it said: ${said}`); // prettier-ignore

    // a step that does a thing is not answered by what was said before it did it, unless it asks to be
    const stale = (since) =>
      refusalOf(() =>
        play({
          ...{ driver: gameDriver({ ...GAME_SAYS, strike: [[200, "HIT"]] }), map: "yard", mod: GAME },
          out: inFolder(`stale-${since}`),
          steps: [
            { command: "strike", wait: 500, shot: "struck" },
            { command: "idle", until: "HIT", within: 1000, ...(since ? { since } : {}) },
          ],
        }),
      );
    sure(/never said \/HIT\/.*\(at step 2\)/.test(await stale()), "a line said before the step began is not its answer");
    sure((await stale("deed")) === "", 'since: "deed" reads from the step before');
    sure((await stale("run")) === "", 'since: "run" from the run\'s beginning');
    sure(/never said \/HIT\//.test(await stale("struck")), "and a picture's name from when it was taken");
    sure(/no picture named "nosuch" was taken before, to read since/.test(await stale("nosuch")), "a picture never taken"); // prettier-ignore
  },
);

await testAsync(
  "a tap presses and lets go, times over; the view is turned to a place from the player's eyes",
  "play: tap and faceAt",
  async () => {
    const driver = gameDriver({ ...GAME_SAYS, tap: [[0, "swing"]] }, { enemies: [{ name: "rat", hp: 30, at: [200, 200, 36] }] }); // prettier-ignore
    const began = driver.clock();
    const run = await play({
      ...{ driver, map: "yard", out: inFolder("tap"), mod: GAME, pause: 0 },
      steps: [
        { tap: "left", times: 3, every: 400, ms: 100 },
        { goto: [100, 100, 36] },
        { faceAt: [200, 100, 164] },
        { where: "up" },
        { faceAt: [100, 0, 64] },
        { where: "level" },
        { faceAt: [100, 100, 500] },
        { where: "over" },
        { faceAt: "target", radius: 500 },
        { where: "rat" },
      ],
    });
    const mouse = driver.calls.filter((call) => call.startsWith("mouse")).join(" ");
    sure(mouse === "mouseDown left mouseUp left mouseDown left mouseUp left mouseDown left mouseUp left", mouse);
    const taps = run.lines.filter((line) => line.text === "swing").map((line) => line.at);
    sure(taps.length === 3 && taps[1] - taps[0] === 400 && taps[2] - taps[1] === 400, `three taps 400 ms apart: ${taps}`);
    sure(run.steps.find((each) => each.kind === "tap").took >= 0 && driver.clock() - began > 0, "and timed");
    const where = Object.fromEntries(run.lines.filter((line) => line.kind === "where").map((line) => [/where (\w+)/.exec(line.text)[1], line.text])); // prettier-ignore
    // from (100, 100, 36 + 28) to (200, 100, 164): 100 along +x and 100 up
    sure(/yaw 0, pitch 45$/.test(where.up), `a place 100 on and 100 over the eyes is 45 degrees up: ${where.up}`);
    sure(/yaw -90, pitch 0$/.test(where.level), `a place at the eyes' height is level: ${where.level}`);
    sure(/yaw -90, pitch 89$/.test(where.over), `straight overhead the yaw stays, and the pitch is held at 89: ${where.over}`);
    // the rat's middle is at (200, 200, 36): 100, 100 on and 28 under the eyes
    sure(/yaw 45, pitch -11\.2$/.test(where.rat), `the nearest enemy is faced where the profile says it is: ${where.rat}`);
    sure(driver.calls.includes("command nearest 500"), "asked of the game by the profile's command, with the radius");

    // an enemy too far to be found
    const none = await refusalOf(() =>
      play({ driver: gameDriver(GAME_SAYS, { enemies: [{ name: "rat", hp: 30, at: [900, 0, 36] }] }), map: "yard", out: inFolder("none"), mod: GAME, steps: [{ faceAt: "target", radius: 300 }] }), // prettier-ignore
    );
    sure(/^play: there is no living enemy within 300 of the player to face \(at step 1\)$/.test(none), `it said: ${none}`);
    // a game that does not answer
    const silent = { ...GAME, play: { ...GAME.play, target: { commands: ["whois {radius}"], answer: "(?<x>\\d+) (?<y>\\d+) (?<z>\\d+)", within: 500 } } }; // prettier-ignore
    const mute = await refusalOf(() =>
      play({ driver: gameDriver(GAME_SAYS), map: "yard", out: inFolder("mute"), mod: silent, steps: [{ faceAt: "target" }] }), // prettier-ignore
    );
    sure(/^play: the game did not answer "whois 768" in 0\.5 seconds \(the profile's play\.target\): does this map have that command\?/.test(mute), `it said: ${mute}`); // prettier-ignore
  },
);

await testAsync(
  "a block is repeated until a line, a count or a time, and stops the run when its line never comes",
  "play: repeat",
  async () => {
    // the third knock is answered
    let knocks = 0;
    const driver = gameDriver(GAME_SAYS);
    const command = driver.command;
    driver.command = (text) => {
      command(text);
      if (text === "knock" && ++knocks === 3) driver.say("who is there", 100);
    };
    const run = await play({
      ...{ driver, map: "yard", out: inFolder("repeat"), mod: GAME, pause: 0 },
      steps: [
        { repeat: [{ command: "knock", wait: 300 }, { walk: 200, wait: 0 }], until: "who is there", within: 9000 },
        { repeat: [{ command: "wave", wait: 100 }], times: 4 },
        { repeat: [{ command: "hum", wait: 250 }], for: 1000 },
        { repeat: [{ command: "call", wait: 500 }], until: "nobody answers", for: 2000 },
        { repeat: [{ command: "sing", wait: 500 }], until: "nobody answers", times: 2 },
        { expect: "who is there" },
      ],
    });
    const count = (word) => driver.calls.filter((call) => call === `command ${word}`).length;
    sure(knocks === 3, `knocked ${knocks} times: the line ended the block`);
    sure(count("+forward") === 2, "in the middle of a pass: the steps after the line's are not done");
    sure(count("wave") === 4, `times: ${count("wave")} passes`);
    sure(count("hum") === 4, `for: ${count("hum")} passes of 250 ms in 1000`);
    sure(count("call") === 4 && count("sing") === 2, "until with for or times ends at whichever comes first, and stops nothing"); // prettier-ignore
    const blocks = run.steps.filter((each) => each.kind === "repeat");
    sure(blocks.length === 5 && blocks[0].heard === "who is there", "a block is a step done, with the line it ended at");
    const inner = run.log.filter((line) => / 1\.1 {2}\{"command":"knock","wait":300\}$/.test(line)).length;
    sure(inner === 3, "each pass's steps are in the log");
    sure(run.log.some((line) => /step 1: repeated 3 times$/.test(line)), "and how often it went round");
    sure(run.log.some((line) => /step 4: repeated 4 times, and the game did not say \/nobody answers\/$/.test(line)), "or that its line did not come"); // prettier-ignore
    sure(run.passed, "the run passed");

    const never = await refusalOf(() =>
      play({
        ...{ driver: gameDriver(GAME_SAYS), map: "yard", out: inFolder("never"), mod: GAME, pause: 0 },
        steps: [{ repeat: [{ command: "knock", wait: 500 }], until: "who is there", within: 2000 }],
      }),
    );
    sure(
      /^play: the game never said \/who is there\/ in the 2 seconds its repeat was given \(4 passes\)\. .*\(at step 1\)$/.test(never),
      `it said: ${never}`,
    ); // prettier-ignore
    // a block whose steps take no time still comes to its end
    const quick = await play({
      ...{ driver: gameDriver(GAME_SAYS), map: "yard", out: inFolder("quick"), mod: GAME, pause: 0 },
      steps: [{ repeat: [{ where: "here" }], for: 500 }],
    });
    sure(quick.steps.at(-1).kind === "repeat", "a pass that takes no time is waited after");
    // a failure inside a block names the step of the block
    const inside = await refusalOf(() =>
      play({
        ...{ driver: gameDriver(GAME_SAYS), map: "yard", out: inFolder("inside"), mod: GAME, pause: 0 },
        steps: [{ repeat: [{ wait: 100 }, { until: "never", within: 300 }], times: 2 }],
      }),
    );
    sure(/never said \/never\/ .*\(at step 1\.2\)/.test(inside), `it said: ${inside}`);
  },
);

await testAsync(
  "a run that stays is not taken out of its map by a file put",
  "play: stay and put",
  async () => {
    const driver = gameDriver(GAME_SAYS);
    const session = playSession({ driver, mod: GAME });
    await session.run({ map: "yard", out: inFolder("stay-1"), steps: [] });
    const told = [];
    const stayed = await session.run({
      ...{ stay: true, out: inFolder("stay-2"), steps: [{ where: "still" }] },
      put: [{ path: "game/scripts.pak", bytes: new Uint8Array(5) }],
      tell: (line) => told.push(line),
    });
    sure(!driver.calls.includes("leave"), "the map is not left");
    sure(driver.calls.includes("put game/scripts.pak 5"), "the file is put all the same");
    sure(session.state.entered === true && stayed.passed, "and the run goes on in the map");
    sure(told.some((line) => /^put while staying: the map is not left/.test(line)), "which the run says");
    sure(/put while staying/.test(readFileSync(stayed.logFile, "utf8")), "in its log too");
    // a run that loads a map leaves the one before, as ever
    await session.run({ map: "yard", out: inFolder("stay-3"), steps: [], put: [{ path: "a", bytes: new Uint8Array(1) }] }); // prettier-ignore
    sure(driver.calls.includes("leave"), "a run that loads its map leaves the last first");
    await session.close();
  },
);
