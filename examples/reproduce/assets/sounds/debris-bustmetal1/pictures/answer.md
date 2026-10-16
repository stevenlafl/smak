The sound is built and the build says OK, with no warnings. It is written to the server's work folder as `work:sound/debris/bustmetal1.wav`, which takes the game's place when put in `<mod>/sound`. I could not listen to it, so please listen in the game before you judge it.

The final version is built from synthesis layers only: a shaped noise burst for the impact and a bell-ratio ring for the metal. I also tried a generated take (woosh-dflow, CC-BY-NC 4.0 weights). None of the four takes had its hit at the start, and the best one came out too bright and then sounded like a steady tone. I dropped it, so the licence does not apply to the final file.

```
measure             original   made     
length              0.87 s     0.87 s   
loudest             0.046 s    0.045 s  (attack)
fall 20 dB          0.441 s    0.454 s  (T20)
centroid            1896 Hz    1936 Hz  
<150 Hz             0%         0%       
150-600 Hz          10%        15%      
600-2k Hz           47%        43%      
2k-5k Hz            41%        41%      
>5k Hz              2%         1%       
crest               about 12.4 12.5 dB  
onsets              0          0        
```

Choices I made that you may want to change:
- **Bit depth:** 16-bit, not the original's 8-bit. The build warned that 8-bit adds audible hiss under the quiet tail. The rate is still 11025 Hz.
- **Class:** `metal hit`. The original's `debris` class is not in the list of classes the build knows. The build's general metal-hit ranges disagree with the original's measured numbers in several places (for example, it wants a centroid near 1.4 kHz), and I followed the original's numbers.
- **Spec:** it is inline in this session and not saved to a file. I can save it into the project if you want it kept.
