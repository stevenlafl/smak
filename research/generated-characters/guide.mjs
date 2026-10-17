// A character's guide picture as the tool generate draws it (mcp/generate.mjs guideOf): its base in the
// generated stance, one plain grey, on white.
//
//   node research/generated-characters/guide.mjs <base, e.g. player/gordon/gordon.mdl> <game folder> <out.png>
import { writeFileSync } from "node:fs";
import { aimedBase } from "../../src/spec/model.mjs";
import { readMdl, textureOf, replaceTexture } from "../../src/mdl.mjs";
import { render } from "../../src/render.mjs";
import { png } from "../../src/index.mjs";

const [base, game, out] = process.argv.slice(2);
let src = aimedBase(base, { games: [game] });
readMdl(src).textures.forEach((t, i) => (src = replaceTexture(src, i, { ...textureOf(src, i), palette: new Uint8Array(768).fill(170) }, { quiet: true })));
const drawn = render(src, { seq: 0, frame: 0, view: "front", width: 512, height: 512, background: [255, 255, 255] });
writeFileSync(out, png(drawn.width, drawn.height, drawn.rgba));
