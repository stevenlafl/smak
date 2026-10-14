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
 *   enemies   `[{ name, hp, at: [x, y, z], hits, every }]`: each stands at its place (the middle of its
 *             box), and while it lives and the player is within its reach strikes him for `hits` (5) every
 *             `every` milliseconds (1000), from the menu's click on. A tap aimed at one within reach takes 10
 *             of its health
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
  const view = { yaw: 0, pitch: 0, origin: [...start] };
  const foes = enemies.map((each) => ({ hits: 5, every: 1000, next: null, ...each, at: [...each.at] }));
  const player = { health, most: health, risesAt: null };
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
  /** The game's own time moved on: the enemies strike, a fallen player rises. */
  const tick = (ms) => {
    const until = now + ms;
    for (const foe of foes) {
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
      const nearest = /^nearest (\d+)$/.exec(text);
      if (nearest) {
        const near = alive().filter((foe) => farOf(foe) <= Number(nearest[1])).sort((a, b) => farOf(a) - farOf(b)); // prettier-ignore
        const close = near.filter((foe) => farOf(foe) <= REACH).length;
        const [foe] = near;
        say(foe ? `nearest ${foe.name} hp ${foe.hp} at ${foe.at.join(" ")} far ${Math.round(farOf(foe))} count ${near.length} close ${close}` : "nearest none"); // prettier-ignore
      }
      if (text === "heal me") {
        player.health = player.most;
        say(`health ${player.health}`);
      }
      if (text === "+forward") view.walking = true;
      if (text === "-forward") view.walking = false;
    },
    click(x, y) {
      calls.push(`click ${x} ${y}`);
      said("click");
      // the player is in the game: his health is said, and the enemies wake
      if (!player.entered && foes.length) say(`most health ${player.most}`, 300);
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
      const foe = aimedAt();
      if (!foe) return void say("you miss");
      foe.hp = Math.max(0, foe.hp - 10);
      say(`you hit ${foe.name} for 10`);
      if (foe.hp === 0) {
        say(`you killed ${foe.name}`);
        if (!alive().length) say("all is quiet");
      }
    },
    wait(ms) {
      // walking, he goes the way he looks at 200 units a second
      if (view.walking) {
        const turn = (view.yaw * Math.PI) / 180;
        view.origin[0] += Math.cos(turn) * 0.2 * ms;
        view.origin[1] += Math.sin(turn) * 0.2 * ms;
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
