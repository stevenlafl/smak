I built the lamp, and the build passed every check on the first try. The file is **`work:street_lamp.mdl`**. The spec it was built from is `work:street_lamp.spec.json` and the six-side picture is `work:street_lamp-sheet.png`.

It stands 109 units tall, against the 110 you asked for. It's made as a prop, so it stands on the floor, and it uses 1,208 triangles across 2 textures.

How I made each thing you asked for:

| You asked for | What I made |
| --- | --- |
| Cast iron | All the metal parts are dark grey-black iron with a little rust. |
| Heavy round base that steps in going up | A round base 20 across and 12 high, with three hard-edged steps (radius 10, then 7.5, then 5.5) and a short rounded neck where the post starts. |
| Tall slim post, tapering a little | A round post from 12 up to about 103, 4.4 thick at the bottom and 2.8 at the top. |
| Small ball on the very top | A ball 6 across, sitting on the post and reaching 109. |
| Curved arm out to one side near the top | The arm leaves the post at about 85, curves up and out toward the front to a height of about 100, then bends down at its end, about 24 units out from the post. |
| Lantern on a short chain | Two iron links in a chain hang from the arm's tip. They hook into a ring on top of the lantern roof. |
| Small square iron frame | An iron floor and top plate with four corner posts. The lantern is about 8 across and 10 high, plus the roof. |
| Yellow glass on all four sides | A warm yellow glass panel on every side, inside the frame. |
| Little pointed roof | A four-sided pointed roof with a small knob at its peak. I also added a little point under the lantern floor. |
| Glass glows at night | The glass is marked fullbright, so the game draws it at full brightness whatever the light around it. |

Limits:
- **The light around it:** the glass glowing doesn't light up the street. A model can't give off light in GoldSrc. For that, put a `light` entity in the map at the lantern, about 24 units out from the post and 81 up from the floor.
- **The arm's shape:** the arm is a bent tube, so its curve looks a little angular up close. There are no decorative scrolls on it, since you didn't ask for any.
- **How it looks in the game:** my pictures use a simple stand-in for lighting. I haven't seen the lamp in the game.
