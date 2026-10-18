// The server's prompts: the starting messages a client offers a person in its menu ("make a sound"). Each one
// sends the client's model to the workflow for that kind of asset in docs/WORKFLOWS.md, which says what to ask
// first, where to stop and show the person, and how to take their notes; the prompt itself says no more.

/** Each kind a person may start from: its prompt's name, what it makes, and its section of the workflow. */
const KINDS = [
  { name: "make-model", what: "a model (a prop or other thing that stands in the world)", topic: "prop" },
  { name: "make-weapon", what: "a weapon", topic: "weapon" },
  { name: "make-character", what: "a character or creature", topic: "character" },
  { name: "make-map", what: "a map", topic: "map" },
  { name: "make-sound", what: "a sound", topic: "sound" },
  { name: "make-textures", what: "textures for a map (a .wad)", topic: "texture" },
  { name: "make-sprite", what: "a sprite", topic: "sprite" },
];

/** The words of the message a kind's prompt starts with, the person's own words added when given. */
export const messageOf = ({ what, topic }, asked) =>
  [
    `I want to make ${what} for my GoldSrc mod.${asked ? ` ${asked.trim()}` : ""}`,
    `Read guide { doc: "workflow", topic: "${topic}" } and work through it with me: ask me only what you need first,`,
    "show me the result at each checkpoint and wait for my answer before the next step, and change only what I name.",
  ].join(" ");

/** The prompts as protocol.mjs's `serve` takes them. */
export const PROMPTS = KINDS.map((kind) => ({
  name: kind.name,
  title: `Make ${kind.what.replace(/ \(.*\)$/, "")}`,
  description: `Start making ${kind.what} with SMAK, step by step, shown at each checkpoint`,
  arguments: [{ name: "request", description: "what you want, in your own words (optional)", required: false }],
  message: (args) => messageOf(kind, args.request),
}));
