# Tim-ial Pursuit

A tiny browser-based "get to know your teammate" game for an offsite. Tim has lost his memories. Walk through the dungeon, talk to six dwellers, recover six pieces of himself, and escape.

Built with vanilla HTML5 Canvas + JavaScript. No build step, no dependencies.

## Run locally

Just open `index.html` in a browser. That's it.

```sh
open index.html
```

(For full asset/audio loading reliability you can also serve it through any static server — `python3 -m http.server` works.)

## Deploy

Hosted as a static site on Netlify. Any push to `main` auto-redeploys via the Netlify GitHub integration. Configuration lives in `netlify.toml`.

## Editing the content

All player-facing text lives in `content.js`. For the offsite host's convenience, the same content is mirrored in `content-template.csv` so you can fill in your answers in a spreadsheet.

Long memories paginate across multiple dialogue boxes — see the comment block at the top of `content.js`.

## Controls

- Arrow keys to move
- Space to interact (open doors, talk, advance dialogue)
- M to mute audio
