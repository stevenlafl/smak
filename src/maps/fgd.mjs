// Entity definitions read from .fgd files: the text an editor (Worldcraft, Hammer, J.A.C.K., TrenchBroom) is
// told a game's entities by. A map's entities are text, and the game reads from them only what its code asks
// for: a class it does not have is dropped, a key it never asks for does nothing, and neither says a word.
// The definitions are the nearest thing to that code which can be read: with them `checkPlan` and `checkBsp`
// tell a class that does not exist, a key its class does not have and a value of the wrong kind.
//
// The format (Valve's, as Worldcraft 3.3 and later write it):
//
//   @include "halflife.fgd"
//   @BaseClass size(-16 -16 -36, 16 16 36) color(0 255 0) = PlayerClass [ ... ]
//   @PointClass base(PlayerClass, Targetname) studio("models/player.mdl") = info_player_start : "A start" []
//   @SolidClass base(Targetname) = func_door : "A door"
//   [
//     speed(integer) : "Speed" : 100
//     lip(integer) : "Lip"
//     locked_sound(choices) : "Locked sound" : 0 = [ 0 : "None"  2 : "Access denied" ]
//     spawnflags(flags) = [ 1 : "Starts open" : 0   256 : "Use only" : 0 ]
//   ]
//
// A definition is plain data, and so is what comes of several put together (`definitionsOf`):
//
//   definitions   { from: [words], fgd: true, maps: 0, classes: { name: a class } }
//   a class       { kind: "point" | "solid", defined: true, description, size: { mins, maxs } | null,
//                   model, sprite, keys: { name: a key } }      with the keys of its bases among its own
//   a key         { type, description, default, choices: ["0", "2"] | null, flags: [1, 256] | null,
//                   labels: { "0": "None", "2": "Access denied" } (for choices and flags) }
//
// What a mod's FGD says is what its author wrote down, not what the game does: FGDs forget classes and keys,
// and give a key a kind its values never have. `learnEntities` (learn.mjs) reads the same from the mod's own
// maps, and the two are used side by side.
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, basename } from "node:path";

// ── the text ───────────────────────────────────────────────────────────────
const QUOTE = '"';
const COMMENT = "//";
/** The letters that are a word of their own wherever they stand. */
const MARKS = ["@", "=", "[", "]", "(", ")", ":", ",", "+"];
/** The three kinds of class, as the file names them. */
const KINDS = { baseclass: "base", pointclass: "point", solidclass: "solid" };
/** What is written before a key's first `:` and is not its type: said of it, and passed over. */
const KEY_WORDS = ["readonly", "report"];
/** The types whose values are named in a list after the key. */
const LISTED_TYPES = ["choices", "flags"];
/** How deep one file may include another before it is taken to include itself. */
const DEEPEST_INCLUDE = 16;

/** The words of an FGD: `[{ word, text: true for one in quotes, line }]`. */
function wordsOf(text) {
  const words = [];
  let line = 1;
  let at = 0;
  while (at < text.length) {
    const letter = text[at];
    if (letter === "\n") line++;
    if (letter <= " ") at++;
    else if (text.startsWith(COMMENT, at)) while (at < text.length && text[at] !== "\n") at++;
    else if (letter === QUOTE) {
      let end = text.indexOf(QUOTE, at + 1);
      if (end < 0) end = text.length;
      const word = text.slice(at + 1, end);
      words.push({ word, text: true, line });
      line += word.split("\n").length - 1;
      at = end + 1;
    } else if (MARKS.includes(letter)) {
      words.push({ word: letter, text: false, line });
      at++;
    } else {
      let end = at;
      while (end < text.length && text[end] > " " && text[end] !== QUOTE && !MARKS.includes(text[end])) end++;
      // a comment ends a word too
      const comment = text.slice(at, end).indexOf(COMMENT);
      if (comment > 0) end = at + comment;
      words.push({ word: text.slice(at, end), text: false, line });
      at = end;
    }
  }
  return words;
}

/** A reader over the words: what is next, and taking it. */
function readerOf(words, name) {
  let at = 0;
  const reader = {
    get done() {
      return at >= words.length;
    },
    get line() {
      return (words[at] ?? words[words.length - 1])?.line ?? 1;
    },
    /** Whether the next word is this mark (never a word in quotes). */
    is: (mark) => at < words.length && !words[at].text && words[at].word === mark,
    peek: () => words[at],
    take: () => words[at++],
    /** Takes the next word when it is this mark; says whether it was. */
    took: (mark) => (reader.is(mark) ? (at++, true) : false),
    expect(mark, where) {
      if (!reader.took(mark))
        throw new Error(
          `${name}: line ${reader.line}: ${JSON.stringify(mark)} was expected ${where}, not ${JSON.stringify(words[at]?.word ?? "the end of the file")}`,
        );
    },
    /** Text in quotes, with what `+` joins to it; null when the next word is not in quotes. */
    text() {
      if (!words[at]?.text) return null;
      let whole = words[at++].word;
      while (reader.is("+") && words[at + 1]?.text) {
        whole += words[at + 1].word;
        at += 2;
      }
      return whole;
    },
  };
  return reader;
}

/** Numbers from the words between two brackets: `-16 -16 -36` gives three. */
const numbersOf = (list) => list.map((each) => Number(each.word)).filter(Number.isFinite);

/** What stands in the brackets after a class's property (`size(...)`), as words; commas kept. */
function inBrackets(reader, where) {
  const inside = [];
  reader.expect("(", where);
  while (!reader.done && !reader.is(")")) inside.push(reader.take());
  reader.expect(")", where);
  return inside;
}

/** The list after a key of `choices` or `flags`: `[{ value, text, on }]`. */
function listedValues(reader) {
  const values = [];
  reader.expect("[", "before a key's values");
  while (!reader.done && !reader.is("]")) {
    const value = reader.take().word;
    let text = "";
    let on;
    if (reader.took(":")) text = reader.text() ?? "";
    if (reader.took(":")) on = reader.take()?.word;
    values.push({ value, text, on });
  }
  reader.expect("]", "after a key's values");
  return values;
}

/** One key of a class: `name(type) : "what it is" : default : "more" = [ values ]`. */
function keyOf(reader) {
  const name = reader.take().word;
  const type = inBrackets(reader, `after the key ${name}`)
    .map((each) => each.word)
    .join("")
    .toLowerCase();
  while (!reader.done && !reader.peek().text && KEY_WORDS.includes(reader.peek().word.toLowerCase()))
    reader.take();
  const key = { name, type, description: "", default: undefined, choices: null, flags: null };
  if (reader.took(":")) key.description = reader.text() ?? "";
  if (reader.took(":")) {
    // a default may be left out between two colons
    if (!reader.is(":") && !reader.is("=") && !reader.is("]")) {
      const word = reader.peek();
      key.default = word.text ? reader.text() : reader.take().word;
    }
  }
  if (reader.took(":")) reader.text();
  if (reader.took("=")) {
    const values = listedValues(reader);
    // what each value or bit is called ("Texture", "Starts open"): what a person, or an agent, chooses by
    key.labels = Object.fromEntries(values.filter((each) => each.text).map((each) => [each.value, each.text]));
    if (type === "flags") {
      key.flags = values.map((each) => Number(each.value)).filter(Number.isFinite);
      const on = values.filter((each) => Number(each.on)).reduce((sum, each) => sum + Number(each.value), 0);
      if (on) key.default = String(on);
    } else key.choices = values.map((each) => each.value);
  } else if (LISTED_TYPES.includes(type)) {
    // a list that was never written: the key is there and any value passes
    key[type] = type === "flags" ? [] : null;
  }
  return key;
}

/** One class, from the word after its `@`. */
function classOf(reader, kind, name) {
  const made = {
    kind,
    bases: [],
    size: null,
    model: null,
    sprite: null,
    description: "",
    keys: {},
    line: reader.line,
  };
  while (!reader.done && !reader.is("=")) {
    const property = reader.take().word.toLowerCase();
    const inside = reader.is("(") ? inBrackets(reader, `after ${property}`) : [];
    const names = inside.filter((each) => each.text || each.word !== ",");
    if (property === "base") made.bases.push(...names.map((each) => each.word));
    else if (property === "size") {
      const comma = inside.findIndex((each) => !each.text && each.word === ",");
      const mins = numbersOf(comma < 0 ? inside : inside.slice(0, comma));
      const maxs = comma < 0 ? mins.map((value) => -value) : numbersOf(inside.slice(comma + 1));
      if (mins.length === 3 && maxs.length === 3)
        made.size = {
          mins: mins.map((value, axis) => Math.min(value, maxs[axis])),
          maxs: mins.map((value, axis) => Math.max(value, maxs[axis])),
        };
    } else if (property === "studio") made.model = names[0]?.word ?? made.model;
    else if (property === "sprite" || property === "iconsprite") made.sprite = names[0]?.word ?? made.sprite;
  }
  reader.expect("=", `before the name of a ${kind} class`);
  if (reader.done) throw new Error(`${name}: line ${reader.line}: a class with no name`);
  made.name = reader.take().word;
  if (reader.took(":")) made.description = reader.text() ?? "";
  if (!reader.took("[")) return made;
  while (!reader.done && !reader.is("]")) {
    // a key begins with its name and a bracket; anything else is passed over (an editor's `input`, `output`)
    const next = reader.peek();
    if (reader.is("@")) break;
    if (next.text) {
      reader.take();
      continue;
    }
    const key = keyOf(reader);
    made.keys[key.name] = key;
  }
  reader.expect("]", `at the end of the class ${made.name}`);
  return made;
}

/**
 * The classes of one FGD's text, as the file has them: `{ classes: { name: { kind, bases, size, model,
 * sprite, description, keys } }, includes: ["halflife.fgd"] }`. `kind` is "point", "solid" or "base" (a class
 * others are made of, which no map uses). A class's keys are its own only: `definitionsOf` adds those of its
 * bases. `name` is the file's, for the sentence when its text cannot be read (with the line).
 */
export function readFgd(text, { name = "the FGD" } = {}) {
  if (typeof text !== "string")
    throw new Error('readFgd: the text of an .fgd file (readFileSync(file, "latin1"))');
  const reader = readerOf(wordsOf(text), name);
  const classes = {};
  const includes = [];
  while (!reader.done) {
    if (!reader.took("@")) {
      // what stands between two classes and is none: passed over
      reader.take();
      continue;
    }
    if (reader.done) break;
    const word = reader.take().word.toLowerCase();
    if (word === "include") {
      const file = reader.text();
      if (file) includes.push(file);
    } else if (KINDS[word]) {
      const made = classOf(reader, KINDS[word], name);
      // a class given twice: the later one stands, as in the editors
      classes[made.name] = made;
    } else if (reader.is("(")) inBrackets(reader, `after @${word}`);
  }
  return { classes, includes };
}

/** A file of a folder by its name, whatever the case it is written in; null when it is not there. */
function fileIn(folder, name) {
  // the folder's own list is asked, so that the file comes back under the name it has there
  const files = existsSync(folder) ? readdirSync(folder) : [];
  const wanted = name.toLowerCase();
  const found = files.includes(name) ? name : files.find((each) => each.toLowerCase() === wanted);
  if (found) return join(folder, found);
  // a name with a folder in it
  return existsSync(join(folder, name)) ? join(folder, name) : null;
}

/**
 * An FGD read from its file, with the files it includes (looked for beside it), the included first:
 * `{ classes, files, missing }`. `files` is every file read, `missing` the included files that were not
 * found (a mod's FGD often includes a `halflife.fgd` that its author had and did not ship).
 */
export function loadFgd(file, { depth = 0, seen = new Set() } = {}) {
  if (depth > DEEPEST_INCLUDE) throw new Error(`loadFgd: ${file} is included by itself`);
  const read = readFgd(readFileSync(file, "latin1"), { name: basename(file) });
  if (!Object.keys(read.classes).length && !read.includes.length)
    throw new Error(
      `${basename(file)}: no class in it (@PointClass, @SolidClass, @BaseClass): not an .fgd file`,
    );
  seen.add(file.toLowerCase());
  const classes = {};
  const files = [];
  const missing = [];
  for (const include of read.includes) {
    const found = fileIn(dirname(file), include);
    if (!found) missing.push(include);
    else if (!seen.has(found.toLowerCase())) {
      const inner = loadFgd(found, { depth: depth + 1, seen });
      Object.assign(classes, inner.classes);
      files.push(...inner.files);
      missing.push(...inner.missing);
    }
  }
  Object.assign(classes, read.classes);
  files.push(file);
  return { classes, files, missing };
}

/** A class with the keys, the size and the model of its bases: its own stand over theirs. */
function resolved(classes, name, path = []) {
  const own = classes[name];
  const made = { size: null, model: null, sprite: null, keys: {} };
  if (!own || path.includes(name)) return made;
  for (const base of own.bases) {
    const inherited = resolved(classes, base, [...path, name]);
    Object.assign(made.keys, inherited.keys);
    made.size = inherited.size ?? made.size;
    made.model = inherited.model ?? made.model;
    made.sprite = inherited.sprite ?? made.sprite;
  }
  for (const [key, value] of Object.entries(own.keys)) {
    const { name: _name, ...rest } = value;
    made.keys[key] = { ...rest, defined: true };
  }
  made.size = own.size ?? made.size;
  made.model = own.model ?? made.model;
  made.sprite = own.sprite ?? made.sprite;
  return made;
}

/**
 * Entity definitions from FGDs, as the checks take them: every class a map can use, with the keys of its
 * bases among its own. `sources` are what `readFgd` or `loadFgd` gave, or the paths of .fgd files; a class
 * that two give is the later one's. `from` names them in the sentences.
 *
 * It returns `{ from, fgd: true, maps: 0, classes: { name: { kind, defined: true, description, size, model,
 * sprite, keys } } }`: plain data, which `JSON.stringify` keeps whole.
 */
export function definitionsOf(...sources) {
  const all = {};
  const from = [];
  for (const source of sources.flat()) {
    const read = typeof source === "string" ? loadFgd(source) : source;
    if (!read?.classes)
      throw new Error("definitionsOf: an .fgd file's path, or what readFgd or loadFgd gave");
    Object.assign(all, read.classes);
    if (typeof source === "string") from.push(...read.files.map((file) => basename(file)));
  }
  const classes = {};
  for (const [name, own] of Object.entries(all)) {
    if (own.kind === "base") continue;
    classes[name] = { kind: own.kind, defined: true, description: own.description, ...resolved(all, name) };
  }
  return { from: from.length ? from : ["an FGD"], fgd: true, maps: 0, classes };
}
