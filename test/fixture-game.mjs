// A game that is not there, for the play driver's cases (41 and 42): a driver with a clock of its own (a wait
// moves it on and takes no time), a game that says what it is told to say, and, when asked for, enemies that
// stand somewhere, strike the player and fall to his blows. What is tested with it is what `play` does with
// what it hears and reads; that the real driver drives a real game is not (it wants Playwright and a build of
// the engine).
import { writeFileSync } from "node:fs";
import * as smak from "../src/index.mjs";

/** How near a blow has to be aimed, in degrees, and how far it reaches. */
const AIMED = 4;
const REACH = 96;
/** A blow swung at one out of reach lands on another within reach and this many degrees of the view; nobody
 * walks nearer than BODY to an enemy's middle (they stand in the way). */
const SWING = 30;
const BODY = 32;
/** The player's eyes above his origin, as GOLDSRC has it. */
const EYE = 28;

/**
 * The made-up game's profile: a map says "the map is in", its menu is clicked until it says "welcome"; it
 * has a command that puts the player at a place, one that names the nearest enemy and one that heals.
 */
export const GAME = {
  name: "smakgame",
  play: {
    enter: [{ click: [100, 200], every: 1000, until: "^welcome", within: 9000 }],
    say: ["say {text}"],
    loads: 20000,
    loaded: "the map is in",
    goto: ["put me at {x} {y} {z}"],
    heal: ["heal me"],
    target: {
      commands: ["nearest {radius}"],
      prefer: ["prefer {word}"],
      unprefer: ["prefer none"],
      answer: "^nearest (?<name>\\w+) hp (?<hp>\\d+) at (?<x>\\S+) (?<y>\\S+) (?<z>\\S+) far (?<far>\\S+) count (?<count>\\d+) close (?<close>\\d+)$",
      none: "^nearest none",
    },
    fight: {
      attack: [{ tap: "left", ms: 100, every: 500 }],
      dealt: "^you hit \\w+ for (\\d+)",
      missed: "^you miss",
      taken: "hits you for (\\d+)",
      slain: "^you killed (\\w+)",
      died: "^you died",
      health: "^health (\\d+)$",
      maxHealth: "^most health (\\d+)$",
    },
  },
};
export const GAME_SAYS = { "map yard": [[4000, "the map is in"]], click: [[300, "welcome to the yard"]] };

/**
 * A driver with a clock and a game that speaks.
 *   says      `{ "<command>": [[after ms, text, kind], ...] }`: the lines the game says that long after a
 *             command is given ("click" for a click, "tap" for a tap of the mouse, "mouseDown" for a press)
 *   enemies   `[{ name, hp, at: [x, y, z], hits, every, marks }]`: each stands at its place (the middle of its
 *             box), and while it lives and the player is within its reach strikes him for `hits` (5) every
 *             `every` milliseconds (1000), from the menu's click on. A tap aimed at one within reach takes 10
 *             of its health; one aimed at one out of reach lands on another within reach and SWING degrees of
 *             the view, if there is one. Nobody walks through an enemy (BODY). `marks: { every, delay,
 *             radius, hits }`: it marks the ground under the player ("<name> marks the ground at <x> <y>") that
 *             often from the click on, and `delay` later strikes there: the player within `radius` of it is hit
 *             ("the ground strikes you for <hits>"), else "the ground is struck: nobody". `prefer <word>` makes
 *             `nearest` answer with the nearest whose name holds the word, when there is one
 *   health    the player's health, and the most of it (100). At 0 he dies: "you died", he is put at
 *             `start`, and rises two seconds later with his health whole
 *   start     where the player begins and rises ([0, 0, 36])
 * It writes its calls down (`calls`), keeps a view and a place, and a picture is a real PNG.
 */
export function gameDriver(says = {}, { enemies = [], health = 100, start = [0, 0, 36], goes = true } = {}) {
  const calls = [];
  const heard = [];
  const due = [];
  // it begins at the true time and runs ahead of it: a line's time is then after the run's beginning
  let now = Date.now();
  const view = { yaw: 0, pitch: 0, origin: [...start], moving: {} };
  const foes = enemies.map((each) => ({ hits: 5, every: 1000, next: null, ...each, at: [...each.at], marks: each.marks && { ...each.marks } })); // prettier-ignore
  const player = { health, most: health, risesAt: null, prefer: null };
  const say = (text, after = 0, kind = "console") => due.push({ at: now + after, kind, text });
  const said = (word) => {
    for (const [after, text, kind = "console"] of says[word] ?? []) say(text, after, kind);
  };
  const farOf = (foe) => Math.hypot(...foe.at.map((value, axis) => value - view.origin[axis]));
  const alive = () => foes.filter((foe) => foe.hp > 0);
  /** The enemy the view is on, within reach of a blow. */
  const aimedAt = () =>
    alive().find((foe) => {
      const [dx, dy, dz] = foe.at.map((value, axis) => value - view.origin[axis] - (axis === 2 ? EYE : 0));
      const yaw = (Math.atan2(dy, dx) * 180) / Math.PI;
      const pitch = (Math.atan2(dz, Math.hypot(dx, dy)) * 180) / Math.PI;
      const turned = Math.abs(((yaw - view.yaw + 540) % 360) - 180);
      return farOf(foe) <= REACH && turned <= AIMED && Math.abs(pitch - view.pitch) <= AIMED;
    });
  /** One within reach and SWING degrees of the view: whom a blow swung at another lands on. */
  const inTheWay = () =>
    alive().find((foe) => {
      const [dx, dy] = foe.at.map((value, axis) => value - view.origin[axis]);
      const turned = Math.abs(((((Math.atan2(dy, dx) * 180) / Math.PI - view.yaw + 540) % 360) - 180));
      return farOf(foe) <= REACH && turned <= SWING;
    });
  /** The game's own time moved on: the enemies strike and mark the ground, a fallen player rises. */
  const tick = (ms) => {
    const until = now + ms;
    for (const foe of foes) {
      // a mark under him, and the strike there after its delay
      const marks = foe.marks;
      if (marks && player.entered && foe.hp > 0) {
        marks.next ??= player.enteredAt + marks.every;
        while (marks.next <= until) {
          const at = [Math.round(view.origin[0]), Math.round(view.origin[1])];
          due.push({ at: marks.next, kind: "console", text: `${foe.name} marks the ground at ${at[0]} ${at[1]}` });
          (marks.strikes ??= []).push({ at: marks.next + marks.delay, spot: at });
          marks.next += marks.every;
        }
      }
      for (const strike of marks?.strikes ?? []) {
        if (strike.at > until || strike.done) continue;
        strike.done = true;
        // where he is when it strikes: the moves of the wait are made before its tick
        const off = Math.hypot(view.origin[0] - strike.spot[0], view.origin[1] - strike.spot[1]);
        if (off <= marks.radius && player.risesAt === null) {
          player.health = Math.max(1, player.health - marks.hits);
          due.push({ at: strike.at, kind: "console", text: `the ground strikes you for ${marks.hits}` });
          due.push({ at: strike.at, kind: "console", text: `health ${player.health}` });
        } else due.push({ at: strike.at, kind: "console", text: "the ground is struck: nobody" });
      }
      for (;;) {
        if (!player.entered || foe.hp <= 0 || player.risesAt !== null || farOf(foe) > REACH) {
          foe.next = null;
          break;
        }
        foe.next ??= now + foe.every;
        if (foe.next > until) break;
        player.health = Math.max(0, player.health - foe.hits);
        due.push({ at: foe.next, kind: "console", text: `${foe.name} hits you for ${foe.hits}` });
        due.push({ at: foe.next, kind: "console", text: `health ${player.health}` });
        if (player.health === 0) {
          due.push({ at: foe.next, kind: "console", text: "you died" });
          player.risesAt = foe.next + 2000;
          view.origin = [...start];
        }
        foe.next += foe.every;
      }
    }
    if (player.risesAt !== null && player.risesAt <= until) {
      player.health = player.most;
      due.push({ at: player.risesAt, kind: "console", text: `health ${player.health}` });
      player.risesAt = null;
    }
    now = until;
  };
  const picture = smak.png(6, 6, new Uint8Array(6 * 6 * 4).fill(200));
  return {
    calls,
    foes,
    player,
    view,
    say,
    clock: () => now,
    ready: () => void calls.push("ready"),
    command(text) {
      calls.push(`command ${text}`);
      said(text);
      const place = /^put me at (-?[\d.]+) (-?[\d.]+) (-?[\d.]+)$/.exec(text);
      if (place && goes) view.origin = place.slice(1).map(Number);
      const prefer = /^prefer (\S+)$/.exec(text);
      if (prefer) player.prefer = prefer[1] === "none" ? null : prefer[1].toLowerCase();
      const nearest = /^nearest (\d+)$/.exec(text);
      if (nearest) {
        const near = alive().filter((foe) => farOf(foe) <= Number(nearest[1])).sort((a, b) => farOf(a) - farOf(b)); // prettier-ignore
        const close = near.filter((foe) => farOf(foe) <= REACH).length;
        const liked = player.prefer && near.find((foe) => foe.name.toLowerCase().includes(player.prefer));
        const foe = liked || near[0];
        say(foe ? `nearest ${foe.name} hp ${foe.hp} at ${foe.at.join(" ")} far ${Math.round(farOf(foe))} count ${near.length} close ${close}` : "nearest none"); // prettier-ignore
      }
      if (text === "heal me") {
        player.health = player.most;
        say(`health ${player.health}`);
      }
      const button = /^([+-])(forward|back|moveleft|moveright)$/.exec(text);
      if (button) view.moving[button[2]] = button[1] === "+";
    },
    click(x, y) {
      calls.push(`click ${x} ${y}`);
      said("click");
      // the player is in the game: his health is said, and the enemies wake
      if (!player.entered && foes.length) say(`most health ${player.most}`, 300);
      if (!player.entered) player.enteredAt = now;
      player.entered = true;
    },
    keyDown: (key) => void calls.push(`keyDown ${key}`),
    keyUp: (key) => void calls.push(`keyUp ${key}`),
    press: (key) => void calls.push(`press ${key}`),
    mouseDown(button) {
      calls.push(`mouseDown ${button}`);
      view.pressedAt = now;
      said("mouseDown");
    },
    mouseUp(button) {
      calls.push(`mouseUp ${button}`);
      said("tap");
      if (!foes.length || player.risesAt !== null) return;
      const foe = aimedAt() ?? inTheWay();
      if (!foe) return void say("you miss");
      foe.hp = Math.max(0, foe.hp - 10);
      say(`you hit ${foe.name} for 10`);
      if (foe.hp === 0) {
        say(`you killed ${foe.name}`);
        if (!alive().length) say("all is quiet");
      }
    },
    wait(ms) {
      // walking, he goes the way his buttons say at 200 units a second, and slides along whoever is in the way
      const { forward, back, moveleft, moveright } = view.moving;
      const [ahead, left] = [(forward ? 1 : 0) - (back ? 1 : 0), (moveleft ? 1 : 0) - (moveright ? 1 : 0)];
      if (ahead || left) {
        const turn = (view.yaw * Math.PI) / 180;
        const length = Math.hypot(ahead, left);
        const way = [(Math.cos(turn) * ahead - Math.sin(turn) * left) / length, (Math.sin(turn) * ahead + Math.cos(turn) * left) / length]; // prettier-ignore
        const free = (at) => alive().every((foe) => Math.hypot(foe.at[0] - at[0], foe.at[1] - at[1]) >= BODY);
        for (let went = 0; went < ms; went += 10)
          for (const axis of [0, 1]) {
            const next = [...view.origin];
            next[axis] += way[axis] * 0.2 * Math.min(10, ms - went);
            if (free(next)) view.origin = next;
          }
      }
      tick(ms);
    },
    shot(file) {
      calls.push(`shot ${file}`);
      writeFileSync(file, picture);
    },
    view: () => ({ yaw: view.yaw, pitch: view.pitch, origin: [...view.origin] }),
    look(to) {
      calls.push(`look ${JSON.stringify(to)}`);
      Object.assign(view, to);
      return { yaw: view.yaw, pitch: view.pitch, origin: [...view.origin] };
    },
    put: (path, bytes) => void calls.push(`put ${path} ${bytes.length}`),
    leave: () => void calls.push("leave"),
    lines(from = 0) {
      const ripe = due.filter((each) => each.at <= now).sort((a, b) => a.at - b.at);
      for (const each of ripe) due.splice(due.indexOf(each), 1);
      heard.push(...ripe);
      return heard.slice(from);
    },
    log: () => heard.map((each) => each.text),
    close: () => void calls.push("close"),
  };
}

/** What a run throws, as its sentence; "" when it throws nothing. */
export const refusalOf = async (run) => {
  try {
    await run();
  } catch (error) {
    return error.message;
  }
  return "";
};
