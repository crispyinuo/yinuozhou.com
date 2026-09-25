# yinuozhou.com

Zoe Zhou's personal site: a tiny low-poly garden floating in the air, seen from above and
rendered live with three.js. Every building on the island is a section of the site:

| Building      | Section    |
| ------------- | ---------- |
| Cottage       | About      |
| Workshop      | Experience |
| Greenhouse    | Projects   |
| Reading nook  | Education  |
| Gazebo        | Play       |
| Mailbox       | Contact    |

The garden is the menu. Hover a building to lift it, and click it: the camera glides over and the
section opens as a full reading page, with tabs to move between sections and a way back to the garden.
Each page header has its building turning on a little island of its own, and low-poly keepsakes
(trees, flowers, a potted plant, books, a lantern, the cat, a letter) are rendered from the same
models into images that decorate the pages.
A cat strolls round the fountain, the chimney smokes and the trees sway.

## Structure

```
index.html   intro, dock, icon sprite, and every section page's content (all real HTML)
data.js      projects, dance / choir videos, songs — edit here to add things
main.js      section pages & tabs, dock, deep links (#work, #play…), project & media modal
scene.js     the three.js island, the page-header diorama and the rendered keepsakes
styles.css   typography and layout
assets/      images, demo videos (re-encoded to 720p), résumé PDF
```

No build step. three.js loads from jsDelivr through an import map. Run it locally with:

```sh
python3 -m http.server 8000
```

Without WebGL, the dock and section pages still work over a plain background.

## Adding a project

Append an object to `window.PROJECTS` in `data.js`. Media is either `video` (local mp4),
`youtube` (video id) or just the cover image. `feat` lists collaborators and `award` notes a prize.

## Changing the garden

Colours live in `C` at the top of `scene.js`. Buildings and where they sit are in `LANDMARKS`,
and each has its own small block below that builds it from boxes, cones and spheres.

## Deploying

Served by GitHub Pages from `main`. To point `yinuozhou.com` here, add a `CNAME` file containing
`yinuozhou.com`, set the custom domain in the repo's Pages settings, and update the DNS records
at your registrar (A records to GitHub Pages IPs, or a CNAME for `www`).
