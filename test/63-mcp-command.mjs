// The MCP tool `command`: the command line's own commands, run on the server's folders. A model's info and a
// picture through it, a name outside the folders refused, what it writes kept to the work folder, and code
// refused on a server that runs none.
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { testAsync, sure, tmp } from "./helper.mjs";
import { toolsFor } from "../mcp/tools.mjs";
import { openFolders } from "../mcp/folders.mjs";
import { buildModelSpec } from "../src/spec/model.mjs";

const work = join(tmp, "command-work");
const models = join(tmp, "command-models");
mkdirSync(models, { recursive: true });
const { mdl } = buildModelSpec({ spec: "smak.model/1", name: "crate.mdl", kind: "prop", parts: [{ id: "box", kind: "box", size: [16, 16, 16], material: "wood" }] });
writeFileSync(join(models, "crate.mdl"), mdl);
const said = (answer) => answer.content.filter((p) => p.type === "text").map((p) => p.text).join("\n");
const refused = async (call) => {
  try {
    await call();
  } catch (error) {
    return error.message;
  }
  return "";
};

await testAsync("command: the command line's commands on the server's folders, its pictures returned", "mcp: command", async () => {
  const folders = openFolders({ work, models });
  const command = toolsFor(folders).find((t) => t.name === "command");
  const info = await command.call({ name: "info", args: ["models:crate.mdl", "--json"] });
  sure(!info.isError && /"name": "crate.mdl"/.test(said(info)), said(info));
  const drawn = await command.call({ name: "sheet", args: ["models:crate.mdl", "-o", "crate.png"] });
  sure(!drawn.isError && existsSync(join(work, "crate.png")) && drawn.content.some((p) => p.type === "image") && /written: crate\.png/.test(said(drawn)), said(drawn));
  const wrong = await command.call({ name: "strip", args: ["models:crate.mdl", "--seq", "nope", "-o", "s.png"] });
  sure(wrong.isError && /no animation nope/.test(said(wrong)), `the command line's own error: ${said(wrong)}`);
  sure(/outside the models and work folders/.test(await refused(() => command.call({ name: "info", args: ["/etc/passwd"] }))), "a path outside refused");
  sure(/outside the models and work folders|outside the work folder/.test(await refused(() => command.call({ name: "sheet", args: ["models:crate.mdl", "-o", "../out.png"] }))), "writing outside refused");
  sure(/a page that stays up/.test(await refused(() => command.call({ name: "view", args: [] }))), "a page is not a call");
  const noRun = toolsFor(folders, { allowRun: false }).find((t) => t.name === "command");
  sure(/runs no code/.test(await refused(() => noRun.call({ name: "reskin", args: ["models:crate.mdl", "rules.mjs", "-o", "x.mdl"] }))), "a module refused under --no-run");
  sure(/runs no code/.test(await refused(() => noRun.call({ name: "layers", args: ["models:crate.mdl", "dark=lum<0.1", "--texture", "x"] }))), "a layers expression refused under --no-run");
});

await testAsync("file: a work file read back as words, a picture or a sound, and a text file written", "mcp: file", async () => {
  const folders = openFolders({ work, models });
  const file = toolsFor(folders).find((t) => t.name === "file");
  const wrote = await file.call({ name: "notes/rules.json", text: '{ "rules": [] }' });
  sure(/written: notes\/rules\.json/.test(wrote[0].text) && existsSync(join(work, "notes", "rules.json")), wrote[0].text);
  sure(/"rules": \[\]/.test((await file.call({ name: "notes/rules.json" }))[0].text), "read back as words");
  const { writeWav } = await import("../src/audio/wav.mjs");
  writeFileSync(join(work, "beep.wav"), writeWav(Float32Array.from({ length: 2205 }, (_, i) => 0.5 * Math.sin(i / 3)), { rate: 22050, bits: 16 }));
  const heard = await file.call({ name: "beep.wav" });
  sure(heard.some((p) => p.type === "audio" && p.mimeType === "audio/wav" && p.data.length > 100), "a sound comes back as audio");
  sure((await file.call({ name: "crate.png" })).some((p) => p.type === "image"), "a picture as a picture");
  sure(/not words, a picture or a sound/.test((await file.call({ name: "models:crate.mdl" }))[0].text), "a model is told, not dumped");
  sure(/outside the work folder|outside the models and work folders/.test(await refused(() => file.call({ name: "../x.txt", text: "x" }))), "writing outside refused");
});

await testAsync("page: the viewer kept up on the server's folders, its address given, then closed", "mcp: page", async () => {
  const folders = openFolders({ work, models });
  const page = toolsFor(folders).find((t) => t.name === "page");
  const up = await page.call({ kind: "view", port: 18998 });
  sure(/smak viewer: http:\/\/127\.0\.0\.1:18998\//.test(up[0].text), up[0].text);
  const listed = await (await fetch("http://127.0.0.1:18998/api/models")).text();
  sure(/crate/.test(listed), `the viewer lists the models folder's crate: ${listed.slice(0, 200)}`);
  sure(/stopped/.test((await page.call({ kind: "view", stop: true }))[0].text), "closed");
  let closed = false;
  try {
    await fetch("http://127.0.0.1:18998/");
  } catch {
    closed = true;
  }
  sure(closed, "nothing answers once it is closed");
});
