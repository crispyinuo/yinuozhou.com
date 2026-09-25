# yinuozhou.com

Zoe Zhou's personal site: a quiet sea beneath ink-wash mountains, rendered live with three.js.

Scrolling moves the day along. Dawn is the introduction, morning is experience, the golden
afternoon is work, dusk is play, and night is contact. Touch the water to leave a ripple, and
turn on sound in the top-right corner to make each ripple ring a soft chime.

## Structure

```
index.html   page markup (experience, education, certificates are written inline)
data.js      projects, dance / choir videos, songs — edit here to add things
main.js      page behaviour: project & media modal, lists, header state, water chimes
scene.js     the three.js scene: sky, stars, mountains, water shader, ripples, time of day
styles.css   typography and layout
assets/      images, demo videos (re-encoded to 720p), résumé PDF
```

No build step. three.js loads from jsDelivr through an import map. Run it locally with:

```sh
python3 -m http.server 8000
```

Without WebGL, the page falls back to a static gradient and stays fully readable.

## Adding a project

Append an object to `window.PROJECTS` in `data.js`. Media is either `video` (local mp4),
`youtube` (video id) or just the cover image. `feat` lists collaborators and `award` notes a prize.

## Tuning the scene

The times of day are the `KEYS` array at the top of `scene.js`, one entry per section:
sky, horizon, sun position, water and mountain colours. Mountain layers live in `LAYERS`.

## Deploying

Served by GitHub Pages from `main`. To point `yinuozhou.com` here, add a `CNAME` file containing
`yinuozhou.com`, set the custom domain in the repo's Pages settings, and update the DNS records
at your registrar (A records to GitHub Pages IPs, or a CNAME for `www`).
