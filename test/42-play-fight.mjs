// A fight played by one step: the nearest enemy found as the profile finds one, faced and struck until a
// line or a time, the player healed and put back, and what happened counted by the profile's patterns.
//
// No browser and no game: fixture-game.mjs has enemies that stand somewhere, strike on the clock and fall
// to blows that are aimed at them, so every number below is known from how the fight was set.
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import * as smak from "../src/index.mjs";
import masterSword, { hudInfoLines } from "../profiles/mastersword.mjs";
import { test, testAsync, sure, tmp } from "./helper.mjs";
import { GAME, GAME_SAYS, gameDriver, refusalOf } from "./fixture-game.mjs";

const { play, playOf, playPartOf, fightLine } = smak.play;
const folder = join(tmp, "play-fight");
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
const fought = (name, enemies, steps, more = {}) => {
  const driver = gameDriver(GAME_SAYS, { enemies, ...more.game });
  return play({ driver, map: "yard", out: inFolder(name), mod: more.mod ?? GAME, pause: 0, steps }).then((run) => ({ run, driver })); // prettier-ignore
};

test("playOf makes a fight a plain action, and a profile says how one is fought", () => {
  const [plainOne, full] = playOf(
    [
      { fight: true, until: "all is quiet" },
      { fight: { radius: 400, heal: 0.5, post: [300, 0, 36], chase: 80, attack: [{ tap: "right" }] }, for: 60000, shot: "after" },
    ],
    { mod: GAME },
  ); // prettier-ignore
  sure(plainOne.kind === "fight" && plainOne.radius === 768 && plainOne.heal === null && plainOne.post === null, "a plain fight looks 768 round, heals nobody and has no post"); // prettier-ignore
  sure(plainOne.actions.length === 1 && plainOne.actions[0].kind === "tap" && plainOne.actions[0].every === 500, "its blow is the profile's"); // prettier-ignore
  sure(plainOne.until.test("all is quiet") && plainOne.within === 30000 && plainOne.wait === 0, "it ends by its line");
  sure(full.radius === 400 && full.heal === 0.5 && full.chase === 80 && full.for === 60000 && full.shot === "after", "a fight takes its radius, heal, chase and time"); // prettier-ignore
  sure(full.back.join() === "put me at 300 0 36" && full.heals.join() === "heal me", "its post and its heal are the profile's commands"); // prettier-ignore
  sure(full.actions[0].mouse === "right", "and a blow of its own");

  const wrong = [
    [[{ fight: true }], /step 1 fights without an end: until \(a line\), for \(milliseconds\) or quiet in its object says when it stops/],
    [[{ fight: 5, for: 100 }], /step 1 fights 5: true, or an object such as \{ heal: 0\.5, radius: 600 \}/],
    [[{ fight: { speed: 2 }, for: 100 }], /step 1 fights with speed, which no fight has: radius, heal, post, attack, chase, quiet/],
    [[{ fight: { heal: 2 }, for: 100 }], /step 1 heals under 2: a share of the player's health, over 0 and up to 1/],
    [[{ fight: { post: [1, 2] }, for: 100 }], /step 1 is held at \[1,2\]: post is \[x, y, z\]/],
    [[{ fight: { radius: -1 }, for: 100 }], /step 1 looks for an enemy within -1: a distance in the map's units/],
    [[{ fight: { attack: [{ until: "x" }] }, for: 100 }], /step 1 strikes with steps that wait or repeat/],
    [[{ fight: { attack: [{ hit: 1 }] }, for: 100 }], /step 1's blow, step 1 has hit, which no step has/],
    [[{ fight: true, for: 100, every: 50 }], /step 1 has every and fight: what is done again there is the blow itself/],
  ]; // prettier-ignore
  for (const [steps, sentence] of wrong) {
    const said = refusal(() => playOf(steps, { mod: GAME }));
    sure(sentence.test(said), `${JSON.stringify(steps)} was ${said ? `refused with: ${said}` : "not refused"}`);
  }
  sure(/step 1 fights the nearest enemy, and the profile names no way to find one \(play\.target\)/.test(refusal(() => playOf([{ fight: true, for: 100 }]))), "a fight with no way to find an enemy"); // prettier-ignore
  const noHeal = { play: { ...GAME.play, heal: null } };
  sure(/step 1 heals, and the profile does not say how \(play\.heal\)/.test(refusal(() => playOf([{ fight: { heal: 0.5 }, for: 100 }], { mod: noHeal }))), "a heal the profile cannot give"); // prettier-ignore
  const noGoto = { play: { ...GAME.play, goto: null } };
  sure(/step 1 has a post, and the profile names no command that puts the player at a place/.test(refusal(() => playOf([{ fight: { post: [1, 2, 3] }, for: 100 }], { mod: noGoto }))), "a post with no goto"); // prettier-ignore

  const profile = [
    [{ target: "nearest" }, /mod: play\.target is \{ commands, answer, none \}/],
    [{ target: { commands: ["near"], answer: "at (\\d+)" } }, /mod: play\.target\.answer names the place in the groups \(\?<x>\.\.\.\), \(\?<y>\.\.\.\) and \(\?<z>\.\.\.\)/],
    [{ target: { commands: ["near"], answer: "(?<x>.)(?<y>.)(?<z>.)", within: 0 } }, /mod: play\.target\.within is a number of milliseconds over 0/],
    [{ heal: "heal" }, /mod: play\.heal is a list of console commands/],
    [{ eye: "high" }, /mod: play\.eye is how far the eyes are above the player's origin/],
    [{ fight: [] }, /mod: play\.fight is an object such as/],
    [{ fight: { hurt: "x" } }, /mod: play\.fight has hurt, which it does not read: attack, dealt, taken, missed, slain, died, health, maxHealth/],
    [{ fight: { attack: [] } }, /mod: play\.fight\.attack is the steps of one blow/],
    [{ fight: { dealt: "(" } }, /mod: play\.fight\.dealt "\(" is no regular expression/],
  ]; // prettier-ignore
  for (const [part, sentence] of profile) {
    const said = refusal(() => playPartOf({ play: part }));
    sure(sentence.test(said), `${JSON.stringify(part)} was ${said ? `refused with: ${said}` : "not refused"}`);
  }
  const plainGame = playPartOf(undefined);
  sure(plainGame.eye === 28 && plainGame.target === null && plainGame.heal === null, "GOLDSRC: eyes at 28, no way to find an enemy or to heal"); // prettier-ignore
  sure(plainGame.fight.attack[0].button === "attack" && plainGame.fight.dealt === null, "its blow is +attack, and it says nothing of a hit"); // prettier-ignore
});

test("Master Sword's profile reads the helper's answer and the game's lines of a fight", () => {
  // the profile is made from an installed game; its play part needs none of it
  let part;
  try {
    part = playPartOf(masterSword({ folders: [tmp] }));
  } catch (error) {
    return sure(false, `the profile was not made: ${error.message}`);
  }
  const answer = part.target.answer.exec("TRIAL nearest 57 hp 92.00 at (1904.00,720.50,36.00) far 143.21 count 4 close 2 name Living Dead").groups; // prettier-ignore
  sure(answer.x === "1904.00" && answer.y === "720.50" && answer.z === "36.00", "the place of the nearest enemy");
  sure(answer.count === "4" && answer.close === "2" && answer.name === "Living Dead" && answer.hp === "92.00", "how many there are, and who it is"); // prettier-ignore
  sure(part.target.none.test("TRIAL nearest none within 768"), "and that there is none");
  const { dealt, missed, taken, slain, died, health, maxHealth } = part.fight;
  sure(dealt.exec("You attack the Living Dead. (72/12) HIT! 8.9 slash damage.")[1] === "8.9", "a hit dealt");
  sure(missed.test("You attack the Living Dead. (11/12) MISS!") && !dealt.test("You attack the Living Dead. (11/12) MISS!"), "a blow missed"); // prettier-ignore
  sure(taken.exec("The Enraged Skeleton attacks you. (62/30) HIT! 9.2 slash damage.")[1] === "9.2", "a hit taken");
  sure(!taken.test("The Enraged Skeleton attacks you. (15/30) MISS!"), "a miss of theirs is no hit taken");
  sure(slain.exec("You've slain the Awakened Guardian")[1] === "the Awakened Guardian", "an enemy slain");
  sure(died.test("Deoroot has fallen!") && health.exec("HP 313")[1] === "313" && maxHealth.exec("MaxHP 318")[1] === "318", "a death, and his health"); // prettier-ignore
  sure(!health.test("MaxHP 318"), "the most of his health is not his health");
  sure(part.fight.attack[0].tap === "left" && part.heal.join() === "trial heal", "a blow is a tap; health is the helper's to give");
  sure(part.enter[0].command === "ms_didbloomcheck 1" && part.enter[0].wait === 0, "the graphics test is not shown: its cvar is set before the click");
  // a map's ms_text is a box with no title: its text alone, which a fight's until waits for
  const box = [0, 0, ...[..."The round tomb is quiet at last."].map((letter) => letter.charCodeAt(0)), 0];
  sure(hudInfoLines(box) === "The round tomb is quiet at last.", `a box with no title is its text: ${hudInfoLines(box)}`);
});

await testAsync(
  "a fight faces the nearest enemy and strikes until the line, and counts what happened",
  "play: a fight, counted",
  async () => {
    // a rat 60 off with 30 of health falls to three blows of 10; it strikes for 5 once a second
    const { run, driver } = await fought("plain", [{ name: "rat", hp: 30, at: [60, 0, 36] }], [
      { fight: true, until: "all is quiet", within: 20000, shot: "won" },
      { expect: "^fight \\(step 1\\): .* 0 deaths" },
    ]);
    const [fight] = run.fights;
    sure(run.fights.length === 1 && fight.where === "step 1", "one fight, of step 1");
    sure(fight.ended === "line" && fight.line === "all is quiet" && run.steps.find((each) => each.kind === "fight").heard === "all is quiet", `it ended by its line: ${fight.ended}`); // prettier-ignore
    sure(fight.blows === 3 && fight.rounds === 3, `three blows in three rounds: ${fight.blows}, ${fight.rounds}`);
    sure(fight.dealt.hits === 3 && fight.dealt.sum === 30 && fight.dealt.missed === 0, `every blow aimed landed: ${JSON.stringify(fight.dealt)}`); // prettier-ignore
    sure(fight.taken.hits === 1 && fight.taken.sum === 5, `the rat struck once in that time: ${JSON.stringify(fight.taken)}`);
    sure(fight.seconds === 1.5, `three blows of 500 ms: ${fight.seconds} s`);
    sure(fight.slain.join() === "rat" && fight.deaths === 0 && fight.heals === 0, "the rat slain, nobody healed, nobody dead");
    sure(fight.enemies.most === 1 && fight.enemies.mean === 1 && fight.enemies.closeMost === 1 && fight.enemies.none === 0, JSON.stringify(fight.enemies)); // prettier-ignore
    sure(fight.health.least === 95 && fight.health.most === 100, `his health was 95 at its least: ${JSON.stringify(fight.health)}`);
    sure(driver.calls.filter((call) => call === "command nearest 768").length === 3, "the enemy is asked for before each blow");
    // the view was turned to the rat's middle: level along +x, and down to it from the eyes
    sure(driver.calls.some((call) => /^look \{"pitch":-25\.0\d*,"yaw":0\}$/.test(call)), "and faced, yaw and pitch");
    const line = run.lines.find((each) => each.kind === "fight").text;
    sure(line === fightLine(fight), "the fight is a line of the log");
    sure(
      line ===
        'fight (step 1): 1.5 s, ended by the line "all is quiet"; 3 blows in 3 rounds; dealt 3 hits, 30 in all (2.00 hits a second), 0 missed; taken 1 hits, 5 in all (3.33 a second); 0 heals, 0 deaths; slain 1: rat; enemies at once: 1 at most, 1 on average; on the player: 1 at most, 1 on average; health 95 at its least of 100',
      line,
    );
    sure(run.passed && run.expectations[0].passed, "which an expectation can be held to");
    sure(JSON.parse(readFileSync(run.resultFile, "utf8")).fights[0].dealt.sum === 30, "and it is in result.json");
    sure(run.pictures.some((file) => /_won\.png$/.test(file)), "a fight's picture is taken when it has ended");
  },
);

await testAsync(
  "a fight goes from one enemy to the next, heals under a share of health, and puts a fallen player back",
  "play: a fight with heals and deaths",
  async () => {
    // two that strike hard: 20 every 500 ms each; the player is healed under half his health
    const pair = [
      { name: "ogre", hp: 40, at: [60, 0, 36], hits: 20, every: 500 },
      { name: "troll", hp: 40, at: [0, 70, 36], hits: 20, every: 500 },
    ];
    const { run, driver } = await fought("heals", pair, [{ fight: { heal: 0.5 }, until: "all is quiet", within: 30000 }]);
    const [fight] = run.fights;
    sure(fight.slain.join() === "ogre,troll", `the nearer first, then the other: ${fight.slain}`);
    sure(fight.heals >= 2 && fight.deaths === 0, `he was healed ${fight.heals} times and did not die`);
    sure(driver.calls.filter((call) => call === "command heal me").length === fight.heals, "by the profile's command, once a wound");
    sure(fight.enemies.most === 2 && fight.enemies.closeMost === 2 && fight.enemies.mean > 1, `two on him at first: ${JSON.stringify(fight.enemies)}`); // prettier-ignore
    sure(fight.dealt.hits === 8 && fight.dealt.sum === 80, `80 of health struck off in 8 blows: ${JSON.stringify(fight.dealt)}`);
    sure(fight.taken.sum === fight.taken.hits * 20 && fight.taken.hits > 4, `hits of 20 taken: ${JSON.stringify(fight.taken)}`);
    sure(fight.health.least < 50 && fight.health.least > 0, `his health fell under half: ${fight.health.least}`);

    // the same without healing, held at a post: he dies, rises where the map begins and is put back
    const far = pair.map((each) => ({ ...each, at: [each.at[0] + 300, each.at[1], 36] }));
    const died = await fought("deaths", far, [
      { goto: [300, 0, 36] },
      { fight: { post: [300, 0, 36] }, until: "all is quiet", within: 60000 },
      { where: "after" },
    ]);
    const [second] = died.run.fights;
    sure(second.deaths >= 1 && second.ended === "line", `he died ${second.deaths} times and won all the same`);
    sure(second.down >= 2 * second.deaths, `and lay ${second.down} s: two seconds a death`);
    sure(died.driver.calls.filter((call) => call === "command put me at 300 0 36").length === 1 + second.deaths, "put back at his post after each"); // prettier-ignore
    sure(died.run.log.some((line) => /step 2: the player died and has risen, and is put back at 300 0 36/.test(line)), "which the log says"); // prettier-ignore
    sure(/where after: origin 300 0 36/.test(died.run.lines.find((each) => each.kind === "where").text), "he ends at his post");
    sure(/ \d+ deaths? \(\d+(\.\d)? s down\)/.test(fightLine(second)), fightLine(second));
  },
);

await testAsync(
  "a fight ends by its time without stopping the run, chases an enemy out of reach, and waits where there is none",
  "play: a fight by time, and chasing",
  async () => {
    // an enemy that cannot be killed in the time
    const { run } = await fought("time", [{ name: "golem", hp: 5000, at: [60, 0, 36] }], [{ fight: true, for: 3000 }]);
    sure(run.fights[0].ended === "time" && run.fights[0].seconds === 3 && run.fights[0].blows === 6, JSON.stringify(run.fights[0])); // prettier-ignore
    sure(/ended by its time/.test(fightLine(run.fights[0])), "its line says how it ended");
    // one whose line never comes stops the run, as an until does
    const never = await refusalOf(() => fought("never", [{ name: "golem", hp: 5000, at: [60, 0, 36] }], [{ fight: true, until: "all is quiet", within: 2000 }])); // prettier-ignore
    sure(/^play: the game never said \/all is quiet\/ in the 2 seconds its fight was given \(4 passes\)\..*\(at step 1\)$/.test(never), `it said: ${never}`); // prettier-ignore

    // an enemy 400 off is out of a blow's reach (96): unchased it is struck at in vain
    const off = [{ name: "archer", hp: 20, at: [400, 0, 36], hits: 0 }];
    const stood = await fought("stood", off, [{ fight: true, for: 2000 }]);
    sure(stood.run.fights[0].dealt.hits === 0 && stood.run.fights[0].dealt.missed === 4, `four blows at the air: ${JSON.stringify(stood.run.fights[0].dealt)}`); // prettier-ignore
    const chased = await fought("chased", off, [{ fight: { chase: 80 }, until: "all is quiet", within: 20000 }, { where: "after" }]); // prettier-ignore
    sure(chased.run.fights[0].slain.join() === "archer", "chased, it is reached and slain");
    const x = Number(/origin (\S+)/.exec(chased.run.lines.find((each) => each.kind === "where").text)[1]);
    sure(x > 300 && x < 400, `he walked at it and stopped short of it: x ${x}`);
    sure(chased.driver.calls.includes("command +forward") && chased.driver.calls.at(-2) !== "command +forward", "by +forward, let go again");

    // a fight that is over when nobody is left: no line is needed, and one that never comes stops nothing
    const quiet = await fought("quiet", [{ name: "rat", hp: 30, at: [60, 0, 36] }], [
      { fight: { quiet: 1000 } },
      { fight: { quiet: 500 }, until: "never said", within: 60000 },
    ]);
    const [first, second] = quiet.run.fights;
    sure(first.ended === "quiet" && first.slain.join() === "rat" && first.seconds === 2.7, `over a second after the rat fell: ${first.ended}, ${first.seconds} s`); // prettier-ignore
    sure(/ended by no enemy being left/.test(fightLine(first)), fightLine(first));
    sure(second.ended === "quiet" && second.blows === 0 && quiet.run.passed, "with an until that never comes, too");

    // nobody near: the fight waits, asking, until its time
    const alone = await fought("alone", [], [{ fight: { radius: 300 }, for: 1500 }]);
    const [idle] = alone.run.fights;
    sure(idle.blows === 0 && idle.enemies.none === idle.enemies.asked && idle.enemies.asked === 5, `asked five times in 1500 ms and found none: ${JSON.stringify(idle.enemies)}`); // prettier-ignore
    sure(/\(none found in 5 of 5 rounds\)/.test(fightLine(idle)), fightLine(idle));
  },
);

await testAsync(
  "a profile may find the enemy by a function of its own",
  "play: a target by a function",
  async () => {
    // the game answers "foe <name> <x> <y> <z>" to "who": read by the profile's own function
    const asked = [];
    const mod = {
      play: {
        ...GAME.play,
        target: async ({ radius, command, heard, view }) => {
          asked.push(radius);
          await command("who");
          const told = await heard("^foe (\\w+) (\\S+) (\\S+) (\\S+)$|^foe none$", 1000);
          if (!told?.[1]) return null;
          const { origin } = await view();
          return { name: told[1], origin: told.slice(2, 5).map(Number), far: Math.hypot(Number(told[2]) - origin[0]) };
        },
      },
    };
    const driver = gameDriver(GAME_SAYS, { enemies: [{ name: "rat", hp: 20, at: [60, 0, 36] }] });
    const command = driver.command;
    driver.command = (text) => {
      command(text);
      const [foe] = driver.foes.filter((each) => each.hp > 0);
      if (text === "who") driver.say(foe ? `foe ${foe.name} ${foe.at.join(" ")}` : "foe none");
    };
    const run = await play({ driver, map: "yard", out: inFolder("function"), mod, pause: 0, steps: [{ fight: { radius: 200 }, until: "all is quiet" }] }); // prettier-ignore
    sure(run.fights[0].slain.join() === "rat" && run.fights[0].dealt.hits === 2, JSON.stringify(run.fights[0].dealt));
    sure(asked.every((radius) => radius === 200) && asked.length === 2, "the function is handed the radius, a round");
    sure(run.fights[0].enemies.most === 1 && run.fights[0].enemies.closeMost === undefined, "an answer with no count is one enemy");
    // a function that gives what is no place
    const bad = { play: { ...GAME.play, target: () => ({ at: [1, 2, 3] }) } };
    const said = await refusalOf(() => play({ driver: gameDriver(GAME_SAYS), map: "yard", out: inFolder("bad"), mod: bad, steps: [{ faceAt: "target" }] })); // prettier-ignore
    sure(/^play: the profile's play\.target gave \{"at":\[1,2,3\]\}, where \{ origin: \[x, y, z\] \} or null was wanted/.test(said), `it said: ${said}`); // prettier-ignore
  },
);
