The sound is built and the build says OK: `work:sound/doors/doormove1.wav`, 11025 Hz, 8-bit mono, 5.04 s, so it can go in the mod's `sound/doors/` folder under the original's name. Nobody has listened to it, and the tool can't judge how it sounds, so it needs a listen in the game.

**Measured against the description**

| Band | Target | Made |
|---|---|---|
| under 150 Hz | 20% | 22% |
| 150 to 600 Hz | 35% | 37% |
| 600 to 2000 Hz | 30% | 30% |
| 2000 to 5000 Hz | 13% | 10.5% |
| over 5000 Hz | 2% | 0% |

- **Event:** a steady grinding level from about 0.1 s, with a louder 4.0 to 4.5 s judder, a 50 to 85 Hz thump at 4.05 s, and a fade to silence over the last 0.4 s. No clean slam.
- **Squeal:** four 320 to 560 Hz upward sweeps at 0.2, 1.4, 2.6 and 3.8 s.
- **Scrape:** granular grit in 300 to 2000 Hz for the whole length.

**Choices I made**

- **Base:** the body is take 1 (seed 1) of the generator's four takes, cut to 140 Hz and above, with a notch at 350 Hz. The takes were too low on their own: the best one had 56% under 150 Hz.
- **Length:** the file measures 5.037 s, not 5.04 s, because the source take is 5 s long. The 33 samples short are not audible.
- **8-bit:** kept on purpose, since the original is 8-bit. The build warns that 8-bit adds a hiss under the quiet tail. If the hiss sounds wrong in the game, drop `bits` to 16.
- **Class:** left out. The class list has no door entry, and the server was given no game folders, so there was no game reference to draw beside it or score against. Every comparison above is against the description's numbers, not the original file.
- **The tool's "attack 3966 ms"** is its time-to-peak figure, which fits the rising swell into the judder; it does not mean a slow fade-in. The fade-in itself is 0.1 s.

**Licence:** the take comes from woosh-dflow, CC-BY-NC 4.0 (non-commercial weights). You said to accept that for this test. The sound carries it, so it is not cleared for a commercial mod.

**Not saved:** the spec was passed inline, so the recipe lives only in this session. Say if you want it written to a `.json` in the work folder so the file can be rebuilt.
