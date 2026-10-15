// A session's long runs and the folders laid over the game's: a run that says nothing for longer than a client
// would wait is still answered, and what changed in a folder since the session had it is put into the engine.
//
// No browser and no game: a session of our own that only waits, and the fake game of fixture-game.mjs, which
// writes down what is put into it.
import { mkdirSync, writeFileSync } from "node:fs";
import { createServer, request } from "node:http";
import { join } from "node:path";
import * as smak from "../src/index.mjs";
import { testAsync, sure, tmp, runRefused, SMAK_CLI } from "./helper.mjs";
import { GAME, GAME_SAYS, gameDriver, refusalOf } from "./fixture-game.mjs";

const { serveSession, attachSession, playSession } = smak.play;
const folder = join(tmp, "play-session-long");
mkdirSync(folder, { recursive: true });
const inFolder = (name) => join(folder, name);
const port = () => 18600 + Math.floor(Math.random() * 400);
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

/** A session whose run says nothing for `quiet` milliseconds, then passes. */
const slowSession = (quiet) => {
  const state = { up: false, map: null, entered: false, runs: 0 };
  return {
    state,
    ready: async () => void (state.up = true),
    close: async () => void (state.up = false),
    async run({ map, out, tell }) {
      await sleep(quiet);
      tell?.("the long step has ended");
      state.runs++;
      return { map, out, took: quiet, passed: true, pictures: [], sheet: null, steps: [], expectations: [], fights: [], lines: [], log: [] }; // prettier-ignore
    },
  };
};

/** The raw answer of a POST, line by line, with when its headers came. */
const rawRun = (address, body) =>
  new Promise((done, failed) => {
    const began = Date.now();
    const asked = request(new URL("/run", address), { method: "POST" }, (answer) => {
      const headers = Date.now() - began;
      let text = "";
      answer.on("data", (chunk) => (text += chunk));
      answer.on("end", () => done({ headers, lines: text.split("\n").filter(Boolean).map((line) => JSON.parse(line)) }));
    });
    asked.on("error", failed);
    asked.end(JSON.stringify(body));
  });

await testAsync(
  "a run that says nothing for long is answered: its headers at once, a beat while it is quiet, and its result",
  "play: a long run in a session",
  async () => {
    const served = await serveSession({ session: slowSession(1500), port: port(), beat: 200 });
    try {
      const raw = await rawRun(served.address, { map: "yard", out: inFolder("raw") });
      sure(raw.headers < 500, `the headers came before the run had said anything: after ${raw.headers} ms`);
      const beats = raw.lines.filter((line) => line.beat !== undefined);
      sure(beats.length >= 4 && beats.length <= 8, `a beat every 200 ms of 1500 quiet ones: ${beats.length}`);
      sure(raw.lines.at(-1).result?.passed === true && raw.lines.at(-2).tell === "the long step has ended", "and then what the run said, and its result"); // prettier-ignore

      // the client: no beat is told, and the run's answer is not read with fetch (undici stops at 300 s of silence)
      const told = [];
      const fetched = [];
      const fetchBefore = globalThis.fetch;
      globalThis.fetch = (url, options) => (fetched.push(String(url)), fetchBefore(url, options));
      let run;
      try {
        run = await attachSession(served.address, { map: "yard", out: inFolder("attached") }, { tell: (line) => told.push(line) }); // prettier-ignore
      } finally {
        globalThis.fetch = fetchBefore;
      }
      sure(run.passed === true && run.took === 1500, `the run's result: ${JSON.stringify(run)}`);
      sure(told.join("|") === "the long step has ended", `only what the run said is told: ${told.join("|")}`);
      sure(!fetched.some((url) => url.endsWith("/run")), `the run was not asked with fetch: ${fetched.join(", ")}`);
    } finally {
      await served.close();
    }
    sure(/play: beat is a number of milliseconds over 0, not 0/.test(await refusalOf(() => serveSession({ session: slowSession(1), port: port(), beat: 0 }))), "a beat of nothing is refused"); // prettier-ignore
  },
);

await testAsync(
  "a session that goes away in a run is a sentence, not a hang",
  "play: a session gone in a run",
  async () => {
    // a server that is a session until its run has begun, and then is gone (its process ended)
    const server = createServer((asked, answer) => {
      if (asked.url === "/") return answer.end(JSON.stringify({ smak: "play session", up: true }));
      answer.writeHead(200, { "content-type": "application/x-ndjson" });
      answer.write(`${JSON.stringify({ tell: "begun" })}
`);
      setTimeout(() => asked.socket.destroy(), 300);
    });
    const at = port();
    await new Promise((done) => server.listen(at, "127.0.0.1", done));
    try {
      const said = await refusalOf(() => attachSession(`http://127.0.0.1:${at}`, { map: "yard", out: inFolder("gone") }));
      sure(/^play: the session at http:\/\/127\.0\.0\.1:\d+ went away during the run \(\w+\)$/.test(said), `it said: ${said}`);
    } finally {
      server.close();
    }
  },
);

await testAsync(
  "a folder laid over the game's: what changed in it since the session had it is put, and nothing else",
  "play: a folder laid over, changes put",
  async () => {
    const laid = inFolder("assets");
    mkdirSync(join(laid, "models/monsters"), { recursive: true });
    writeFileSync(join(laid, "models/monsters/guard.mdl"), "a guard");
    writeFileSync(join(laid, "models/lamp.mdl"), "a lamp");
    const driver = gameDriver(GAME_SAYS);
    const session = playSession({ driver, mod: GAME, pause: 0, over: [{ path: "msc", folder: laid }] });
    const puts = () => driver.calls.filter((call) => call.startsWith("put "));
    const run = (name, more = {}) => session.run({ map: "yard", out: inFolder(name), steps: [], sheet: false, ...more }); // prettier-ignore
    const over = [{ path: "msc/", folder: laid }];

    await run("over1", { over });
    sure(puts().length === 0, `nothing changed since the session began, nothing is put: ${puts()}`);
    // a model rebuilt (another size) and one new: both put, under the place the folder is laid at
    await sleep(20);
    writeFileSync(join(laid, "models/monsters/guard.mdl"), "a guard, rebuilt");
    writeFileSync(join(laid, "models/monsters/bearer.mdl"), "a bearer");
    const second = await run("over2", { over });
    const put = puts().map((call) => call.split(" ")[1]).sort();
    sure(put.join() === "msc/models/monsters/bearer.mdl,msc/models/monsters/guard.mdl", `the two changed: ${put}`);
    sure(driver.calls.indexOf("leave") < driver.calls.findIndex((call) => call.startsWith("put ")), "after the map was left, as a put is"); // prettier-ignore
    sure(second.log.some((line) => /over msc: 2 files of .* changed since the session had them: models\/monsters\/bearer\.mdl, models\/monsters\/guard\.mdl/.test(line)), "which the log says"); // prettier-ignore
    const before = puts().length;
    await run("over3", { over });
    sure(puts().length === before, "put once: the session has them now");
    // a run without over puts nothing of it, and the change waits for the next run that names it
    writeFileSync(join(laid, "models/lamp.mdl"), "a lamp, lit");
    await run("over4");
    sure(puts().length === before, "a run that does not name the folder puts nothing of it");
    await run("over5", { over });
    sure(puts().slice(before).join() === "put msc/models/lamp.mdl 11", `the change waited: ${puts().slice(before)}`);

    // a folder the session never marked is marked by the run that first names it
    const other = inFolder("sounds");
    mkdirSync(other, { recursive: true });
    writeFileSync(join(other, "bell.wav"), "ding");
    const fresh = await run("over6", { over: [{ path: "msc/sound", folder: other }] });
    sure(puts().length === before + 1 && fresh.log.some((line) => /over msc\/sound: .* is new to the session: marked now, and nothing of it put/.test(line)), "a folder new to the session: marked, nothing put"); // prettier-ignore
    writeFileSync(join(other, "bell.wav"), "dong!");
    await run("over7", { over: [{ path: "msc/sound", folder: other }] });
    sure(puts().at(-1) === "put msc/sound/bell.wav 5", `and its change put the next time: ${puts().at(-1)}`);

    const wrong = await refusalOf(() => run("over8", { over: [{ path: "msc", folder: inFolder("none") }] }));
    sure(/play: over: .*none is no folder, to lay over msc/.test(wrong), `it said: ${wrong}`);
    const shape = await refusalOf(() => run("over9", { over: ["msc"] }));
    sure(/play: over is a list of \{ path, folder \}/.test(shape), `it said: ${shape}`);
    const command = runRefused(SMAK_CLI, "play", "http://127.0.0.1:1", "--attach", "--map", "yard", "--over", "msc");
    sure(command.code === 1 && /--over <place in the game's files>=<folder>, not msc/.test(command.err), command.err);
  },
);
