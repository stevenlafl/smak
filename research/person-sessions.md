# Blind sessions: a person and a maker through the MCP server

The test of docs/WORKFLOWS.md and the server's prompts: a fresh Haiku maker with only the SMAK MCP server, started as
`~/stignored/smak-mcp/.mcp.json` starts it (models and wads from Half-Life's `valve`, the compilers, both FGDs,
`--generators`, `--materials`) but on a work folder of its own and with `--no-run`, and a second Haiku agent playing
the person: a brief only it knows, brief answers, one note or an approval per checkpoint, "ship it" at the end. The
person reads the PNGs the maker writes; it cannot hear, so a sound is judged by its picture and numbers.

Harness: `examples/reproduce/session.mjs <prop|sound|character> [--turns 8] [--out dir] [--resume]`. Records (words
only, no game files) in `examples/reproduce/sessions/`: `session.json` (every turn, its tool calls, time, cost,
tokens) and `transcript.md`.

## Results, 2026-10-17 (kit 2772254 to 5a44923)

```
session        maker turns  tool calls  shipped       reported cost  tokens priced at Haiku 5.5
prop (crate)   8 (cap)      43          no            $0.29          $0.055
sound (door)   8            33          yes, round 7  $0.20          $0.039
character a    3            12          (harness)     $0.05          $0.016
character b    8 (cap)      38          no            $0.31          $0.064
all                                                    $0.85          $0.17
```

"Reported" is the CLI's `total_cost_usd`; the last column prices the logged tokens at Haiku 5.5's $0.10 in, $0.50
out, cache reads at a tenth and writes at 1.25 times input. Character a ended at round 3 on a harness fault (below).

## What each maker did

**Prop.** Read the workflow first (its first call), asked one question (size), then stopped at every checkpoint the
workflow names: the shape (24 triangles, sheet shown, asked before painting), the paint (library wood), the crate
beside a game model. Each round changed only what the note named and said what changed. Rounds 5 to 8 went to the
wood: too orange, then grey like stone, then a grainier photo whose short staggered boards read as flooring; the
maker said so itself before the person did. Not shipped in 8; the library had no long straight crate planks with
visible grain, and the texture is blocky at 24 triangles' size.

**Sound.** Never read the workflow: it called `generate` at once with a prompt of its own ("followed by a short
reverberating echo"), asked nothing, chose a take itself and left out the Woosh takes for their non-commercial
licence (the result text says that choice is the person's). It told the person the spectrograms were "not saved to
disk": they came back inline only, which the person never saw. From round 3 it worked well: a spec built on the
take, every note acted on (crest 21 to 10 dB, the tail cut, a body tone added and kept), numbers reported plainly.
Shipped at round 7. At "ship it" it did not copy the file into place (`file` with `to`) and asked for a destination.

**Character.** Read the character workflow first and stopped at the picture checkpoint (`only: "picture"`,
turnaround, two seeds). Picked Gordon's player skeleton after finding barney.mdl keeps its animations in
barney01-03.mdl, which the kit cannot read (true). Run a: the person called the first pictures plastic toys; the
redraw was realistic; then the person asked for a holster and sleeve patches to go and two redraws kept them: a
note the picture model does not follow. Run b: four picture rounds to an approved guard, then the mesh from it
(round 5) matched the picture well, with the build's warning of 26 triangles joining arms to trunk. Asked to fix
that, the maker left the mesh route for blob pieces (rounds 6, 7: head buried in the shoulders, cap floating) and a
carved body (round 8: head right, forearms as slabs), each written over `guard.mdl`, so the best build was gone.

## What changed because of them

- generate writes the takes' picture (`gen/<name>_takes.png`), a sound or music build its picture beside its spec,
  and generate's sound answer says the takes go to the person to choose (ca1a2c5).
- Steven, on seeing the character pictures: the image generator is fine for tests; what matters is that a picture
  the person gives is used in its place and every step can be done on its own. So: `file` copies in the person's
  own asset from anywhere on their disk; `generate` takes `back`; a picture not drawn by the kit is built with pose
  fit instead of the kit's stance; kind `paint` paints the sides of any mesh; WORKFLOWS.md says each step takes
  their file and offers a picture edit for a note the generator ignores (5a44923).
- WORKFLOWS.md: each round's result under its own name, and a fault mended on the approved route (a new picture
  with the arms apart), not by changing route.
- The harness took "ship it" inside "don't ship it until" and "before I say ship it" as the go-ahead; it now wants
  the words alone on the reply's last line, and `--resume` goes on from where a session stopped.

## Open

- The sound maker skipped the workflow although the instructions name it; the prop and character makers read it.
  Whether generate's new line brings the sound maker to the person's choice is untested (the change landed after
  the session's takes).
- The MCP prompts (prompts/list, prompts/get) are tested by protocol only: these sessions began from the person's
  plain words, which is the harder path.
- A Haiku person is pickier about some things than Steven would be and blind to others (it cannot hear); its
  verdicts are a stand-in for his.
