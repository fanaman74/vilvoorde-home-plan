# Vilvoorde home plan

Interactive 3D house and garden viewer built with Three.js. Rotate the model,
switch between four levels and the garden, show full-height walls and roofs,
and export a PNG or GLB. Geometry and dimensions are approximate.

## Open the webpage

The deployed viewer is at https://fanaman74.github.io/vilvoorde-home-plan/.
The generated `docs/index.html` is self-contained and can also be opened
directly in a browser. There are no runtime CDN requests or API credentials.

## Develop

Requires Node.js 22 or newer.

```sh
npm ci
npm run build
npm run dev
```

Open http://127.0.0.1:4173. Edit `work/model/viewer.js` for geometry or
`work/model/style.css` for presentation, then rebuild and refresh.
The build writes `docs/index.html` and the downloadable standalone copy
`outputs/house-3d-viewer.html`.

For access from another device on the same network, set `HOST=0.0.0.0`
before starting, then use this computer's LAN address and port 4173.

## Publish updates

GitHub Pages serves the committed `/docs` directory on `main`.
Run `npm run build`, commit the updated source and `docs/index.html`,
then push to `main`. GitHub Pages republishes the webpage.
The repository includes only the viewer and build tooling; reference photos,
raw map records, local logs and generated review images are excluded.

## Home Assistant

To embed the hosted viewer, add a manual dashboard card:

```yaml
type: iframe
title: House 3D
url: https://fanaman74.github.io/vilvoorde-home-plan/
aspect_ratio: 80%
```

For local hosting, copy `docs/index.html` to
`/config/www/house-3d-viewer.html` on Home Assistant and use
`url: /local/house-3d-viewer.html`. Restart Home Assistant if the `www`
directory was just created.

The current viewer shows the model only. Live light control is not implemented;
it requires mapping Home Assistant entity IDs to lights in the scene.

## Browser verification

```sh
npx playwright install chromium
npm run check:web
```

The check opens the page over HTTP, switches floors, exercises the garden
controls, checks phone layout and verifies PNG and GLB downloads. On Windows
with Edge installed, use `BROWSER_CHANNEL=msedge` to use Edge instead.

## Attribution

The bundled Three.js license is included in `docs/THIRD-PARTY-NOTICES.txt`.
The original source plans and photographs are not included in this repository.
