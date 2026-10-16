The crowbar hit is built and passes the build as OK, at `work:sound/weapons/cbar_hit1.wav`. Put it at `<mod>/sound/weapons/cbar_hit1.wav` and the game plays it in place of its own, with no code.

**What I made**

- **Source:** I asked the local text-to-sound model (woosh-dflow) for "a crowbar striking a metal surface, one sharp metallic clang with a short ring", with four takes (seeds 0 to 3). I chose seed 1, the take with one clean hit and a short ring. Seed 0 had two hits, and seed 3 started almost a second late.
- **Shaping:** The take is cut at its hit (0.085 s in), trimmed to 0.9 s, and darkened with a low-pass at 3 kHz and a dip at 2.5 kHz. A 6 ms burst of high-passed white noise is added at the very start for the metal crack, and a short room gives it some space. It is mono, 22050 Hz, 16-bit, peak -0.5 dBFS, 0.8 s long.
- **Spec:** the final spec is in this conversation. I did not save it as a file, so tell me if you want it kept in the project.

**Warnings the build still gives**

- It dies to -20 dB in 0.1 s. The game's metal hits take at least 0.24 s. It will sound drier than the original.
- Its brightness is 2126 Hz, against the game's 1074 to 1654 Hz. It is still too bright.
- Its flatness is 0.017, against the game's 0.16 to 0.28. The take is too pure, so the clang is less noisy than the game's.

The build's checks find these faults; they cannot say how it sounds. Whether it is as good as the game's own is for the modder to judge by ear in the game. If it sounds too dry or too bright, the spec's `filter` and `finish.room` are where to change it.

**Licence:** the take is from woosh-dflow, under CC-BY-NC 4.0 (non-commercial). You said the test accepts the local generators' licences, non-commercial included. That covers this test only. Before the mod is released or used commercially, the take would need replacing or a different licence.
