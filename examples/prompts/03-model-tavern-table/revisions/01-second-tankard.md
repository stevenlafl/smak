# 03 / 01 "Add a second tankard next to the first" (a change request on a model)

## The prompt (20 words)

> Nice table. Can you add a second tankard right next to the first one, same kind? Leave the rest alone.

## The rubric (written before the spec)

| # | Item | Must | Score |
| --- | --- | --- | --- |
| 1 | A second tankard of the same kind, with its handle, beside the first, on the table | yes | 2 |
| 2 | Nothing else moved (the change report) | yes | 2 |
| 3 | Still clean: no holes, nothing floating | yes | 2 |

**Score: 6 of 6 (100%). Passes.**

## How the request became the change

- Two parts added: `tankard_2`, whose `right` side is put on the first tankard's `left` side 1 apart
  (`attach: { to: "tankard", toAt: "left", at: "right", offset: [0, 1, 0] }`), and its handle, as the
  first's is put on the first.
- Report: `parts added: tankard_2 (...); handle_2 (...)`; `8 parts are where they were`. The close look
  (result-01-second-tankard/picture-2) shows the two tankards side by side with their handles.
