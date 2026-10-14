# 03 / 02 "Make the candle twice as tall" (a change request on a model)

## The prompt (18 words)

> And make the candle twice as tall, still burning on top. Everything else stays where it is.

## The rubric (written before the spec)

| # | Item | Must | Score |
| --- | --- | --- | --- |
| 1 | The candle twice as tall (4 to 8), its flame still on its top | yes | 2 |
| 2 | Only the candle and its flame changed (the change report) | yes | 2 |
| 3 | Still clean | yes | 2 |

**Score: 6 of 6 (100%). Passes.**

## How the request became the change

- The candle's `height` from 4 to 8; the flame is attached to the candle's top, so it goes up with it with no
  change of its own. The spec's `size.height` follows (37 to 41), the candle being the highest thing.
- Report: `parts moved or resized: candle from ...35.3 to ...39.3; flame from 35.2..37.2 to 39.2..41.2`;
  `8 parts are where they were` (the second tankard and its handle among them).
