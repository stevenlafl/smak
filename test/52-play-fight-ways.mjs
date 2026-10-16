// A fight that chooses and moves: one kind of enemy gone for first (`prefer`), a crowd walked round on the way to
// it (sidesteps), and a place the game warns will be struck stepped out of (`dodge`); each counted in the
// fight's line.
//
// No browser and no game: the enemies of fixture-game.mjs stand in the way of a walk, take a blow swung at
// another behind them, and mark the ground under the player.
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import * as smak from "../src/index.mjs";
import { test, testAsync, sure, tmp } from "./helper.mjs";
import { GAME, GAME_SAYS, gameDriver } from "./fixture-game.mjs";

const { play, playOf, playPartOf, fightLine } = smak.play;
const folder = join(tmp, "play-fight-ways");
mkdirSync(folder, { recursive: true });
const refusal = (run) => {
  try {
    run();
  } catch (e) {
    return e.message;
  }
  return "";
};
const fought = async (name, enemies, steps, mod = GAME) => {
  const driver = gameDriver(GAME_SAYS, { enemies });
  const run = await play({ driver, map: "yard", out: join(folder, name), mod, pause: 0, steps });
  return { run, driver, fight: run.fights[0] };
};

test("a fight's prefer, sidestep and dodge are checked, and a profile says how a game is asked to prefer", () => {
  const [plain, full] = playOf(
    [
      { fight: { chase: 60 }, for: 1000 },
      { fight: { prefer: ["shaman", "bearer"], chase: 60, sidestep: 400, dodge: { line: "marks the ground at (?<x>\\S+) (?<y>\\S+)", far: 120, ms: 900, hold: 0 } }, for: 1000 }, // prettier-ignore
    ],
    { mod: GAME },
  );
  sure(plain.prefer.length === 0 && plain.sidestep === 600 && plain.dodge === null, "unless told: no prefer, sidesteps of 600 ms, no dodge"); // prettier-ignore
  sure(full.prefers.map((each) => each.join()).join("|") === "prefer shaman|prefer bearer" && full.unprefers.join() === "prefer none", "the profile's commands for each word"); // prettier-ignore
  sure(full.sidestep === 400 && full.dodge.far === 120 && full.dodge.ms === 900 && full.dodge.hold === 0, JSON.stringify(full.dodge)); // prettier-ignore
  sure(playOf([{ fight: { dodge: "WARDEN marks" }, for: 10 }], { mod: GAME })[0].dodge.far === 150, "a dodge by its line alone: 150 off");

  const wrong = [
    [{ prefer: "" }, /step 1 prefers "": a word of an enemy's name \("lantern"\), or a list of them/],
    [{ prefer: ["lantern bearer"] }, /prefers \["lantern bearer"\]: a word/],
    [{ sidestep: 300 }, /sidesteps, which a fight does on its way to an enemy farther off than its chase: give chase too/],
    [{ chase: 60, sidestep: -1 }, /sidesteps for -1: a number of milliseconds over 0/],
    [{ dodge: 5 }, /dodges 5: the pattern of the line that warns, or \{ line, far, ms, hold \}/],
    [{ dodge: { line: "x", speed: 2 } }, /dodges with speed, which a dodge has not: line, far, ms, hold/],
    [{ dodge: { line: "at (?<x>\\d+)" } }, /names one of the groups \(\?<x>\.\.\.\) and \(\?<y>\.\.\.\): the place is both, or neither/],
    [{ dodge: { line: "(" } }, /dodges at "\(" is no regular expression/],
    [{ dodge: { line: "x", far: 0 } }, /dodges as far as 0: a distance/],
  ]; // prettier-ignore
  for (const [fight, sentence] of wrong) {
    const said = refusal(() => playOf([{ fight, for: 100 }], { mod: GAME }));
    sure(sentence.test(said), `${JSON.stringify(fight)} was ${said ? `refused with: ${said}` : "not refused"}`);
  }
  const noPrefer = { play: { ...GAME.play, target: { ...GAME.play.target, prefer: undefined } } };
  sure(/step 1 prefers an enemy, and the profile names no way to ask the game for one \(play\.target\.prefer\)/.test(refusal(() => playOf([{ fight: { prefer: "rat" }, for: 100 }], { mod: noPrefer }))), "a game that cannot be asked"); // prettier-ignore
  sure(/mod: play\.target\.prefer is a list of console commands with \{word\} in them/.test(refusal(() => playPartOf({ play: { ...GAME.play, target: { ...GAME.play.target, prefer: "prefer" } } }))), "a profile's prefer that is no commands"); // prettier-ignore
});

await testAsync(
  "prefer: the enemy whose name holds the word is struck first, the nearest after; the line counts it",
  "play: a fight that prefers",
  async () => {
    // a guard on him and a bearer farther off: without prefer the guard falls first
    const pair = () => [
      { name: "guard", hp: 30, at: [60, 0, 36], hits: 1 },
      { name: "bearer", hp: 30, at: [0, 80, 36], hits: 1 },
    ];
    const plain = await fought("plain", pair(), [{ fight: true, until: "all is quiet", within: 20000 }]);
    sure(plain.fight.slain.join() === "guard,bearer" && plain.fight.prefer === undefined, `the nearest first: ${plain.fight.slain}`);
    const liked = await fought("liked", pair(), [{ fight: { prefer: "bearer" }, until: "all is quiet", within: 20000 }]); // prettier-ignore
    sure(liked.fight.slain.join() === "bearer,guard", `the bearer first: ${liked.fight.slain}`);
    sure(liked.fight.prefer.slain === 1 && liked.fight.prefer.rounds === 3, JSON.stringify(liked.fight.prefer));
    const told = liked.driver.calls.filter((call) => /^command prefer/.test(call));
    sure(told.join() === "command prefer bearer,command prefer none", `told once, and undone at the end: ${told}`);
    sure(/; preferred \(bearer\): 1 of the 2 slain, faced in 3 of 6 rounds$/.test(fightLine(liked.fight)), fightLine(liked.fight)); // prettier-ignore

    // two words: the first is nowhere, so the second is asked for; and a word nobody has falls to the nearest
    const listed = await fought("listed", pair(), [{ fight: { prefer: ["shaman", "bearer"] }, until: "all is quiet", within: 20000 }]); // prettier-ignore
    sure(listed.fight.slain.join() === "bearer,guard", `the second word, the first being nowhere: ${listed.fight.slain}`);
    const nobody = await fought("nobody", pair(), [{ fight: { prefer: "shaman" }, until: "all is quiet", within: 20000 }]); // prettier-ignore
    sure(nobody.fight.slain.join() === "guard,bearer" && nobody.fight.prefer.slain === 0, `the nearest when none has the word: ${nobody.fight.slain}`); // prettier-ignore

    // a profile's own function is handed the words
    let handed = null;
    const mod = { play: { ...GAME.play, target: async ({ prefer }) => ((handed = prefer), null) } };
    await fought("function", pair(), [{ fight: { prefer: ["bearer"], quiet: 300 } }], mod);
    sure(handed?.join() === "bearer", `the function was handed ${JSON.stringify(handed)}`);
  },
);

await testAsync(
  "sidesteps: a fight held up by others on the way to the one it chases walks round them",
  "play: a fight round a crowd",
  async () => {
    // a bearer behind a line of three guards that strike nobody: the way to it is shut, and a blow swung at it
    // lands on a guard
    const crowd = () => [
      { name: "bearer", hp: 30, at: [260, 0, 36], hits: 0 },
      ...[-40, 0, 40].map((y, n) => ({ name: `guard${n}`, hp: 5000, at: [110, y, 36], hits: 0 })),
    ];
    const steps = (more) => [{ fight: { prefer: "bearer", chase: 70, ...more }, until: "you killed bearer", within: 30000 }, { where: "end" }]; // prettier-ignore
    const stuck = await fought("stuck", crowd(), [{ fight: { prefer: "bearer", chase: 70, sidestep: false }, for: 15000 }]); // prettier-ignore
    sure(!stuck.fight.slain.length && stuck.fight.dealt.hits > 5 && stuck.fight.sidesteps === undefined, `held up, it strikes the guards: ${fightLine(stuck.fight)}`); // prettier-ignore
    const round = await fought("round", crowd(), steps({}));
    sure(round.fight.slain.join() === "bearer" && round.fight.sidesteps >= 1, `round them, the bearer slain: ${fightLine(round.fight)}`); // prettier-ignore
    sure(round.run.log.some((line) => /step 1: a sidestep to the (right|left), round what stands between him and bearer/.test(line)), "the log says each"); // prettier-ignore
    sure(/; \d+ sidesteps? round others in the way$/.test(fightLine(round.fight)), fightLine(round.fight));
    // a wall of guards too wide to walk round and too strong to cut through: after four sidesteps the bearer is let
    // be for 20 s, the nearest fought, and then the bearer asked for again
    const wall = [{ name: "bearer", hp: 30, at: [260, 0, 36], hits: 0 }, ...[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((n) => ({ name: `guard${n + 4}`, hp: 100000, at: [110, n * 40, 36], hits: 0 }))]; // prettier-ignore
    const shut = await fought("wall", wall, [{ fight: { prefer: "bearer", chase: 70 }, for: 60000 }]);
    sure(!shut.fight.slain.length && shut.fight.prefer.letBe >= 1, `let be: ${fightLine(shut.fight)}`);
    sure(shut.run.log.some((line) => /step 1: bearer is not got at \(4 sidesteps, \d+(\.\d)? off\): the nearest for 20 s/.test(line)), "the log says when"); // prettier-ignore
    sure(/preferred \(bearer\): 0 of the 0 slain, faced in \d+ of \d+ rounds, let be \d+ times?/.test(fightLine(shut.fight)), fightLine(shut.fight)); // prettier-ignore
    const told = shut.driver.calls.filter((call) => /^command prefer/.test(call));
    sure(told.slice(0, 3).join() === "command prefer bearer,command prefer none,command prefer bearer", `the game told to prefer nobody, then the bearer again: ${told.join(", ")}`); // prettier-ignore
    const pressed = (sign) => round.driver.calls.filter((call) => new RegExp(`^command \\${sign}move(left|right)$`).test(call)).length; // prettier-ignore
    sure(pressed("+") === round.fight.sidesteps && pressed("-") === pressed("+"), "by the strafing buttons, let go again");
  },
);

await testAsync(
  "dodge: a line that warns of a blow to a place is stepped away from, and fewer strikes land",
  "play: a fight that dodges",
  async () => {
    // a warden that marks the ground under the player every 3 s and strikes it 1.5 s later; he strikes nobody else
    const warden = () => [{ name: "warden", hp: 100000, at: [60, 0, 36], hits: 0, marks: { every: 3000, delay: 1500, radius: 110, hits: 30 } }]; // prettier-ignore
    const line = "marks the ground at (?<x>-?\\d+) (?<y>-?\\d+)";
    const struck = (run) => run.lines.filter((each) => /the ground strikes you/.test(each.text)).length;
    const stood = await fought("stood", warden(), [{ fight: { chase: 60 }, for: 20000 }]);
    const dodged = await fought("dodged", warden(), [{ fight: { chase: 60, dodge: { line, far: 140 } }, for: 20000 }]);
    sure(struck(stood.run) >= 5, `standing, every mark lands: ${struck(stood.run)}`);
    sure(struck(dodged.run) < struck(stood.run) / 2, `dodging, fewer: ${struck(dodged.run)} against ${struck(stood.run)}`);
    const { dodge } = dodged.fight;
    sure(dodge.warned >= 5 && dodge.dodged + dodge.clear === dodge.warned && dodge.dodged >= 4, JSON.stringify(dodge));
    sure(dodged.run.log.some((each) => /step 1: dodged "warden marks the ground at -?\d+ -?\d+": from \d+(\.\d)? to 1[4-9]\d(\.\d)? off/.test(each)), "each dodge in the log, and how far it took him"); // prettier-ignore
    sure(new RegExp(`; dodged ${dodge.dodged} of ${dodge.warned} warnings`).test(fightLine(dodged.fight)), fightLine(dodged.fight));
    sure(dodged.fight.dealt.hits > 0, "and he fights between");

    // a line with no place: a step to one side, then the other
    const aside = await fought("aside", warden(), [{ fight: { chase: 60, dodge: { line: "marks the ground", ms: 800 } }, for: 9000 }]); // prettier-ignore
    sure(aside.fight.dodge.dodged >= 2 && aside.run.log.some((each) => /dodged .*: a step aside, \d+/.test(each)), fightLine(aside.fight)); // prettier-ignore
  },
);

await testAsync(
  "with chase, an enemy in reach takes three blows a round, and one far off with nobody near is walked at, not struck at",
  "play: a fight's blows by reach",
  async () => {
    // a rat 57 from the eyes: in reach of a chase of 70, three blows a round, two rounds
    const near = await fought("flurry", [{ name: "rat", hp: 60, at: [50, 0, 36], hits: 0 }], [{ fight: { chase: 70 }, until: "all is quiet", within: 20000 }]); // prettier-ignore
    sure(near.fight.blows === 6 && near.fight.rounds === 2, `six blows in two rounds: ${fightLine(near.fight)}`);
    // an archer 700 off: walked at in steps of up to 1.5 s, and no blow until he is near
    const far = await fought("walked", [{ name: "archer", hp: 20, at: [700, 0, 36], hits: 0 }], [{ fight: { chase: 70, radius: 1000 }, until: "all is quiet", within: 20000 }]); // prettier-ignore
    sure(far.fight.slain.join() === "archer" && far.fight.dealt.missed <= 1 && far.fight.blows < far.fight.rounds, `walked at, then struck: ${fightLine(far.fight)}`); // prettier-ignore
    const walks = far.driver.calls.filter((call) => call === "command +forward").length;
    sure(walks <= 4, `in a few long steps: ${walks}`);
  },
);

await testAsync(
  "a fight whose time runs out on a step towards its enemy is ended by its time",
  "play: a fight's time in a chase",
  async () => {
    const { fight } = await fought("timed", [{ name: "archer", hp: 5000, at: [2000, 0, 36], hits: 0 }], [{ fight: { chase: 60, radius: 3000, sidestep: false }, for: 1500 }]); // prettier-ignore
    sure(fight.ended === "time", `ended by ${fight.ended}: ${fightLine(fight)}`);
  },
);
