// The words leg's input: a fresh agent looks at the pictures of an original (inputs.mjs) and writes the
// description a person would give, for someone who will never see them. It may read that one folder of
// pictures and nothing else. The words are ours and are kept: <id>/words.md.
//
//   node examples/reproduce/describe.mjs [subject ...]
import { writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { HERE, SUBJECTS } from "./lib.mjs";
import { runAgent } from "./agents.mjs";

const wanted = process.argv.slice(2);
const chosen = (id) => !wanted.length || wanted.includes(id);
const RULES = `Do not name the game, the file, the series, the company or where it comes from, and do not guess
them: describe only what the pictures show. Write it as plain text (short paragraphs and lists), and reply with
the description alone: no preamble, no notes about yourself.`;

const jobs = [
  ...SUBJECTS.models.filter((m) => chosen(m.id)).map((m) => {
    const input = join(HERE, m.id, "input");
    return {
      id: m.id,
      read: input,
      prompt: `You are looking at pictures of one object made for a video game. Someone who will never see these
pictures must build it again as a 3D game model from your words alone, and will be judged against it from
every side: its outline, size, each part, the colours and materials, and the markings on its surfaces.
Write the description they need: its overall shape and size; each part, with its shape, its size against the
whole, where it is and what colour and material it is; the markings, lettering, stripes, lights or glows and
wear, and where each is; what each side looks like. At most 400 words.
${RULES}
The pictures are in ${input}: sides.png (front, left, back, right, top and below, all to one scale),
front-left.png, front-right.png, back-left.png and back-right.png. Its size is in size.txt there.`,
    };
  }),
  ...SUBJECTS.maps.filter((m) => chosen(m.id)).map((m) => {
    const input = join(HERE, m.id, "input");
    return {
      id: m.id,
      read: input,
      prompt: `You are looking at pictures of one map (a level) made for a multiplayer first-person game. Someone
who will never see these pictures must build it again from your words alone, and will be judged against it:
its layout, the size and place of each area, the floor heights, stairs, ledges and drops, where the players
start and where the weapons and items are, the textures and light, and what it looks like from inside.
Write the description they need, with measurements in the game's units (the plan has a scale bar: 256
units; a player is 72 tall and 32 wide), at most 1200 words.
${RULES}
The pictures are in ${input}: plan.png (from above, with floor heights written on the floors and every entity
marked with a number and its class, listed beside it), storeys.png (a plan of each storey side by side),
section-x.png and section-y.png (cut upright through its middle, west to east and south to north) and views.png
(from inside, at a player's eye, from the places to start and the largest rooms).`,
    };
  }),
];

// all at once: each is a process of its own
const results = await Promise.all(
  jobs.map(async (job) => {
    const out = join(HERE, job.id, "words.md");
    if (existsSync(out) && !process.argv.includes("--again")) return { id: job.id, skipped: true };
    const r = await runAgent({ prompt: job.prompt, read: job.read, hours: 0.5 });
    writeFileSync(out, `${r.answer.trim()}\n`);
    return { id: job.id, words: r.answer.split(/\s+/).length, seconds: r.seconds, error: r.error };
  }),
);
for (const r of results) console.log(r.skipped ? `${r.id}: words.md already there (--again to write it again)` : `${r.id}: ${r.words} words, ${r.seconds} s${r.error ? `, ${r.error}` : ""}`);
