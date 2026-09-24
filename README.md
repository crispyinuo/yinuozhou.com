# ZOE.FM — yinuozhou.com

Zoe Zhou's personal site, rebuilt from the old WordPress version as a hand-made static site.
The whole site is a record: sections are tracks, experience is a discography, projects are
albums (solo releases vs. "feat." collabs), and the Play section is a dark stage for dance, choir and songs.

**Things to poke at**
- Press `A`–`K` anywhere (or tap the keys) to play the pocket synth.
- Click the vinyl to drop the needle.
- Drag the skill stickers around.
- Click any album cover for the liner notes and demo.

## Structure

```
index.html   page markup (experience, education, certificates are written inline)
data.js      projects, dance / choir videos, songs, skills — edit here to add things
main.js      synth, stickers, album modal, tabs, now-playing bar
styles.css   everything visual
assets/      images, demo videos (re-encoded to 720p), resume PDF
```

No build step, no dependencies. Run it locally with:

```sh
python3 -m http.server 8000
```

## Adding a project

Append an object to `window.PROJECTS` in `data.js`. `side: "a"` for solo, `side: "b"` for group work
(with `feat: [...]`). Media is either `video` (local mp4), `youtube` (video id) or just the cover image.

## Deploying

Served by GitHub Pages from `main`. To point `yinuozhou.com` here, add a `CNAME` file containing
`yinuozhou.com`, set the custom domain in the repo's Pages settings, and update the DNS records
at your registrar (A records to GitHub Pages IPs, or a CNAME for `www`).
