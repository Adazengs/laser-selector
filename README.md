# Laser selector

Static Univet laser filter selector. The deployed application is `index.html`.

- Website: https://adazengs.github.io/laser-selector/
- Source: https://github.com/Adazengs/laser-selector
- Checks: https://github.com/Adazengs/laser-selector/actions/workflows/check.yml

## Work locally

Use Node.js 22 or later. Get the source with Git; use the browser to verify the UI.

```sh
git clone https://github.com/Adazengs/laser-selector.git
cd laser-selector
npm ci --ignore-scripts
npm run check
npm run preview
```

`preview` prints its loopback URL and `/__preview` identity URL. It requests a free
port from the OS on each start, reads this checkout's `index.html`, and sends
`Cache-Control: no-store`. Verify the project and SHA-256 from `/__preview` before
testing. Stop the server with Ctrl+C. Only the page and identity endpoint are served.
This reduces cross-project cache collisions; an unexpected page still needs investigation.

## What the check covers

`npm run check` parses the shipped inline JavaScript and handlers, then runs Node's
test runner with jsdom against the actual HTML. External assets are not fetched.
The same command runs on pushes to `main` and pull requests in GitHub Actions.

- Quick Guide and Multiple Wavelength OD controls, including unmatched requirements.
- OD retention when editing wavelengths or switching Single/Range.
- Empty-result guidance and a known positive result (1060–1065 nm, OD 5).
- Separate wavelengths versus a continuous range, and invalid input.
- Preview source identity, loopback binding, cache headers and served-file boundary.

These DOM tests do not measure layout, contrast or real-browser behavior. Follow
[visual verification](docs/visual-verification.md) for desktop/mobile screenshots.
The check workflow reports failures; branch protection and the existing GitHub Pages
deployment settings are managed separately.

## Product behavior

OD is a user requirement. With valid wavelengths, OD 1–9 remain selectable even
when the database has no matching filter. Each result must meet every row; a Range
requires continuous coverage across the entire interval. Separate wavelengths or
bands belong in separate rows. Empty results guide the user to check the actual
laser specifications, narrow an incorrectly broad range, or enter separate rows.

## Publishing and source verification

After publication is authorized, run `npm run check`, inspect the exact diff,
fetch `origin/main`, then commit and push the approved files. Verify both the check
workflow and the Pages deployment for that commit, plus the live behavior.

For file equality, read the page with system curl and compare bytes:

```sh
mkdir -p artifacts
curl --fail --silent --show-error --location https://adazengs.github.io/laser-selector/ -o artifacts/live.html
cmp index.html artifacts/live.html
```

`artifacts/` is ignored. Keep screenshots and the verified URL/commit in the task's
durable output directory and embed the relevant screenshot in the delivery reply.
