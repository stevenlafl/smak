// SMAK checked against itself, with no game files:   node test/selftest.mjs      (npm test)
// A model is made from nothing, then read, changed in every way the kit can change one, checked and drawn.
// Run it first on a new machine: if it passes, Node is new enough and the kit is whole.
//
// The cases are in one file an area, beside this one, and run in the order below. That order matters: the
// first case builds the knife model that the others start from, and a few later cases use what an earlier
// one found. What they share (the temp folder, `test`, `sure`, the knife) is in helper.mjs; the two
// fixture-*.mjs files hold the small models that more than one area uses.
import { finish } from "./helper.mjs";

const areas = [
  "01-format", // a model written from nothing reads back; check; poses; the mesh
  "02-images", // PNG and BMP, a picture with holes, a texture replaced
  "03-change", // meshes swapped and added, bones added, animations replaced and added, textures put inside
  "04-render-and-kits", // render, sheet, strip, uvMap; the axe and bow kits
  "05-workshop", // turned surfaces, creases, ridges, bands, bosses, a leaf, a tube
  "06-bodies", // putBody and carryPicture
  "07-wear", // a head in a helmet, one size to another, graft to the bone above, several models as one
  "08-place", // paint by place, loose pieces, graft by the bones' names
  "09-islands", // a picture's islands, paint by island, soft edges, passes, blur, copyBody
  "10-layers", // layers of a picture: values, distances, regions, busy, layerMap
  "11-commandline", // bin/smak.mjs
  "12-servers", // the viewer and the editor
  "13-editor-colours", // the editor's adjustments for chosen colours
  "14-orbit-and-normals", // render with a distance; copyBody with normals stored as nothing
  "15-obj", // Wavefront .obj files read, stood up and made into models; `smak obj`
  "16-mcp", // the MCP server: the protocol, the guide by section, info, check, render, and run
  "17-library-faults", // a file cut short, skins of two sizes, a texture given twice, a shape's own normals
  "18-tool-faults", // the command lines' wrong arguments, addresses a server cannot read, a taken port
  "20-maps-read", // compiled maps: read, entities changed and put back, contents, visibility, light, textures, .wad files
  "21-maps-make", // brushes, a map written and read, the plan check, the leak hint, the compile where VHLT is installed
  "22-maps-draw", // pictures of a map: views, plans, the source drawn; the map commands; the MCP tools on a map
  "23-maps-walk", // the walk test, entities at their true size, sections, storeys, views through openings
  "24-maps-mods", // entity definitions from an FGD and learned from maps, a mod's profile and rules, the files entities name
  "25-maps-seen", // a map's pictures with the game's files: models textured and posed, sprites, the sky, `{` holes
  "26-maps-play", // the walk test playing more: jumps across gaps, one-way places, slopes too steep to stand on
  "28-maps-profile", // a profile's ways out and the model it gives an entity; --mod on the picture commands
  "27-play", // the play driver: steps made actions, a map played through a fake driver, `smak play`'s refusals
  "29-monster-parts", // a monster's parts: hit boxes, attachments, controllers, an animation's travel and box, the floor's line
  "30-animate", // animations written as poses: turns in the model's axes, a leg bent to its foot, keys, the walk's measures
  "31-items", // a submodel added before the last bodypart and its bases, a piece laid on one that is there, an item's family, `smak item`
  "32-map-faults", // a walked floor at 0 asked as yes or no, entities switched off, markers and wiring, a counter with no brush, scripts placed
  "33-compile-light", // a compile seen to work and stopped at its time, the portals foretold, a draft; the light on a map's floors
  "34-fbx-read", // FBX read: binary (32 and 64 bit, zlib arrays) and text, polygons cut, texture coordinates turned, nodes placed
  "35-glb-read", // glTF read: a .glb and a .gltf with its .bin, a turned node, a picture inside, strips and fans, sparse numbers
  "36-import-model", // a bought model as a prop (true size, fitted, on its base) and as a piece (its grip found or told, a shield's face)
  "37-import-rig", // a file's skeleton, skin and animations made a studio model's, from FBX and from glTF
  "38-import-commandline", // smak import: a file, a prop, a folder with its sheet and table, --anim; smak item with a bought model
  "39-import-faults", // what the readers refuse and say: cut short, old versions, Draco, a .bin not given, a JPEG, wrong options
  "40-play-heard", // the play driver hearing the game: until, expect, the view, a place, a session kept and served, the sheet
  "43-maps-reach", // a body by its name, a ladder off the grid, teleports, walls that give way, why each part of the floor is not walked to, a profile's lists
  "41-play-steps", // the play driver's later steps: from where an until hears, a tap, the view turned to a place, a block repeated, a run that stays
  "42-play-fight", // a fight played by one step: the nearest enemy found, faced and struck, heals, deaths, and what happened counted
  "45-map-small-faults", // stairs with no step level with the upper floor and treads on the grid, hlvis's time said and not foretold, one map's own scripts
  "44-maps-measure", // a map in numbers (widths, headroom, sight) and beside others; maps at one scale; views from starts together, a view of one colour left out
  "46-specs", // models and maps from specs (the tool build): the shape's soundness, layout by words, modules, linings, water, glass
  "47-audio", // sounds: a GoldSrc file written and read, measured, checked, made from a spec, built by the tool
  "48-decompile", // a compiled map made back into a .map (Half-Life's frenzy where installed), recompiled, and measured against its original
  "49-video", // video: a camera path at an even speed, shots made into frames, a GIF of our own, built by the tool
  "50-mod-code", // a mod's classes and keys read from its C++ source, and an FGD written from them
  "51-sprite-layers", // sprites' layers: a glow with no cut, a flare's wedges and rays, a flat beam, tongues, a lit billow, blobs, a reference measured
  "53-texture-places", // where a map's textures are best seen, a material seen under a map's light, the wad preview from there
  "52-sound-shape", // sounds shaped to a curve, squashed to a crest, a crack after it, grains at a period, a picture read back
  "46-reskin", // an island given pixels of its own, a re-skin by rules with its pictures before and after, `smak reskin`, check --source
  "47-sequence-from", // an animation of frames of another, backwards or held; `smak sequence-add --from`
  "48-animate-hold", // a held thing aimed and gripped, a bone held at a turn of its own, the quaternions, a fall kept on the ground, yaw with a named view
  "49-compose", // a piece composed on an imported rig's parts before building; the workshop's skinned body
  "50-play-session-long", // a session's run quiet for long still answered (headers at once, a beat, no fetch); folders laid over, what changed put
  "51-map-bands-open", // a band left empty at a place on purpose, said by a key the bands rule reads: only the true faults told
  "52-play-fight-ways", // a fight that prefers a kind of enemy, sidesteps round a crowd to it, dodges a place it is warned of
  "19-example-and-kit-faults", // the examples' wrong arguments and refused models; the kits' fittings and rings
  "54-carve", // fewer triangles by quadric error (a sphere, a box, a sheet's border), a shape carved from its outlines
  "55-sky", // skies made from words: written as the game's Targa files, read back with no seam, made by a map spec
  "56-reference-textures", // JPEG read; a map's pictures from photographs (valve, literal, aged), a door over one, grain that is not noise
  "57-generate", // the MCP tool generate with a stand-in worker: takes and sidecars, the model kept loaded, a take in a spec, a shape as a mesh part
  "58-materials", // the MCP tool materials and library: pictures, over a small library of the kit's own
  "59-blob", // a blob part: pieces on joints blended into one closed surface, each corner on its nearest piece's bone
  "61-floorplan", // height plans read back into a map's space, storeys over storeys; a spec's floorplan
  "60-props-look", // a tree of crossed leaf cards (masked), a model's pictures against Valve's models' (whites, toy colours)
  "62-reproduce-scoring", // the reproduction harness's scoring: the rubric's tables, caps, the pass rule, judges combined
  "63-mcp-command", // the MCP tool command: the command line's commands on the server's folders, names outside refused, no code under --no-run
  "64-outline-parts", // what of each part a player sees: a costly part that changes no outline warned of, as Valve paints such things
  "65-generated-character", // a generated body on a base: limbs fused across the trunk warned of, its back carried, its pictures pulled to the base's palette, its stance fitted to its own outlines
];

// one after another: each file runs its cases as it is loaded, and the servers' cases wait for their answers
for (const area of areas) await import(`./${area}.mjs`);

finish();
