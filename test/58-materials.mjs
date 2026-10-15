// The MCP tool `materials` and "library:" pictures, over a small library of the kit's own making (the real one is
// Poly Haven's CC0 textures, fetched by generators/fetch-materials.mjs): searched, seen, refused outside it, and
// a .wad's texture made from one through the tool build.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test, testAsync, sure, tmp } from "./helper.mjs";
import { toolsFor } from "../mcp/tools.mjs";
import { openFolders, pathOf } from "../mcp/folders.mjs";
import { openMaterials } from "../mcp/materials.mjs";
import { png } from "../src/image.mjs";

const folder = join(tmp, "library");
mkdirSync(folder, { recursive: true });
// two surfaces: a rusty one (warm blotches) and a cracked concrete (grey with dark lines); PNG bytes in a .jpg name,
// as the readers go by a file's first bytes
const picture = (f) => png(64, 64, Buffer.from(Array.from({ length: 64 * 64 }, (_, i) => f(i % 64, Math.floor(i / 64))).flat()));
writeFileSync(join(folder, "rusty_plate.jpg"), picture((x, y) => ((x * 7 + y * 13) % 17 < 6 ? [150, 80, 30, 255] : [120, 118, 112, 255])));
writeFileSync(join(folder, "cracked_concrete.jpg"), picture((x, y) => (Math.abs(x - y) < 2 || x === 40 ? [40, 40, 42, 255] : [128 + ((x * y) % 9), 126, 122, 255])));
writeFileSync(join(folder, "materials.json"), JSON.stringify([
  { name: "cracked_concrete", title: "Cracked Concrete", categories: ["concrete", "wall"], tags: ["cracked", "grey"], size: [79, 79], file: "cracked_concrete.jpg", source: "test", licence: "CC0" },
  { name: "rusty_plate", title: "Rusty Plate", categories: ["metal"], tags: ["rust", "plate"], size: [20, 20], file: "rusty_plate.jpg", source: "test", licence: "CC0" },
]));

await testAsync("materials: a library searched and seen, its pictures read as library:<name> and nothing outside it", "materials", async () => {
  const folders = openFolders({ work: join(tmp, "library-work") });
  folders.materials = openMaterials(folder);
  const tools = Object.fromEntries(toolsFor(folders).map((t) => [t.name, t]));
  const found = await tools.materials.call({ match: "rust" });
  sure(/1 of 2 materials holding "rust"/.test(found[0].text) && /library:rusty_plate: Rusty Plate; 20 x 20 units across/.test(found[0].text), found[0].text);
  const seen = await tools.materials.call({ match: "", show: ["cracked_concrete", "library:rusty_plate"] });
  sure(seen[1]?.type === "image", "a sheet of their pictures");
  const none = await tools.materials.call({ match: "marble" });
  sure(/0 of 2/.test(none[0].text) && /The categories: concrete, metal, wall/.test(none[0].text), none[0].text);
  for (const [name, said] of [["library:../materials.json", /no material/], ["library:nothing", /no material nothing/]]) {
    let message = "";
    try {
      pathOf(folders, name);
    } catch (error) {
      message = error.message;
    }
    sure(said.test(message), `${name}: ${message}`);
  }
  let written = "";
  try {
    pathOf(folders, "library:rusty_plate", { write: true });
  } catch (error) {
    written = error.message;
  }
  sure(/only read/.test(written), written);
  // a .wad's texture made from the library's concrete through build
  const built = (await tools.build.call({ spec: { spec: "smak.wad/1", name: "lib.wad", textures: [{ name: "lib_wall", size: [64, 64], material: { base: "plaster", picture: "library:cracked_concrete", size: 79 } }] } }))[0].text;
  sure(/^OK/.test(built) && /lib_wall: valve: .*library|texture LIB_WALL|lib_wall/i.test(built), built.split("\n").slice(0, 6).join(" | "));
  const without = toolsFor(openFolders({ work: join(tmp, "library-work") }));
  sure(!without.some((t) => t.name === "materials"), "no library, no tool");
});
