// The tool `page`: the person's own pages, which stay up after the call (the viewer, to look at models side by
// side and turning; the editor, to touch up animations, events and textures by hand), started inside the server
// on its folders. One of each at a time; they stop with the server.
import { pathOf } from "./folders.mjs";
import { text } from "./protocol.mjs";

/** The pages up, by kind: { server, said }. */
const pages = new Map();

/** A name of the folders: a file, or a folder. */
function placeOf(folders, name) {
  try {
    return pathOf(folders, name);
  } catch (error) {
    try {
      return pathOf(folders, name, { folder: true });
    } catch {
      throw error;
    }
  }
}

/**
 * The tool. `kind` "view" over `files` (models or folders; the work and models folders unless told), or "edit"
 * over the first of them (a model, or a folder of models; the models folder unless told), its projects and saved
 * models in the work folder. `stop`: the page of that kind closed. `port` in place of the page's own.
 */
export async function page(folders, { kind, files = [], port, stop = false }) {
  if (!["view", "edit"].includes(kind)) throw new Error('kind: "view" (models side by side, turning) or "edit" (the editor)');
  const up = pages.get(kind);
  if (up) {
    await new Promise((done) => up.server.close(done));
    pages.delete(kind);
  }
  if (stop) return [text(up ? `the ${kind === "view" ? "viewer" : "editor"} is stopped` : `no ${kind === "view" ? "viewer" : "editor"} was up`)];
  const said = [];
  const say = (line) => said.push(line);
  let server;
  if (kind === "view") {
    const { view } = await import("../viewer/serve.mjs");
    const roots = files.length ? files.map((name) => placeOf(folders, name)) : [folders.work, folders.models].filter(Boolean);
    server = await view(roots, port, { say });
  } else {
    const { serve } = await import("../editor/serve.mjs");
    const models = files.length ? placeOf(folders, files[0]) : folders.models ?? folders.work;
    server = await serve(models, { port, work: folders.work, say });
  }
  pages.set(kind, { server, said });
  server.unref?.();
  return [text(`${said.join("\n")}\nGive the person this address: the page is on this machine. \`page { kind: "${kind}", stop: true }\` closes it.`)];
}
