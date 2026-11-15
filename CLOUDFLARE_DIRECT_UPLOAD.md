# Cloudflare Pages Direct Upload · OUTPOST REPLAY

Prepared 15 November 2026.

> [!WARNING]
> **Instructions only: no project has been created or uploaded.** Publication still needs the team's authorization and the submission blockers in [the release review](RELEASE_CANDIDATE_2026-11-15.md) resolved.

## Contents

- [The artifact to use](#the-artifact-to-use)
- [Upload after authorization](#upload-after-authorization)
- [Verify the actual public host before submission](#verify-the-actual-public-host-before-submission)

## The artifact to use

Upload the verified **contents of `dist/`**, or the supplied release ZIP, which has `index.html` at its root. Include `credits.html`, `THIRD_PARTY_NOTICES.txt` and the entire `assets/` directory. Do not upload the source workspace, `.git`, `.env`, `node_modules`, recordings, screenshots or audit logs. The release ZIP contains static site files only; its companion manifest records the source commit, file sizes and SHA-256 hashes.

There is no backend, environment variable, API key, database, build service or localhost dependency to configure. The optional public NASA DONKI request is made by the browser; the core mission uses bundled inputs. Build-time dependencies stay on the development machine.

To reproduce from the chosen commit with installed dependencies:

```sh
node scripts/prepare-notices.mjs
npm test
npm run typecheck
npm run build
git diff --check
npm run preview -- --host 127.0.0.1 --port 5219 --strictPort
```

If that port is already serving the verified preview, use it instead of starting a second server. For a fresh checkout, run `npm ci` using the lockfile first. Do not combine files from different builds. Serve over HTTP for local testing; double-clicking `index.html` is not supported. `127.0.0.1` above is a local verification address, not a URL in the release bundle.

## Upload after authorization

Cloudflare's [official Direct Upload guide](https://developers.cloudflare.com/pages/get-started/direct-upload/), checked 15 November 2026, supports a folder or ZIP through its dashboard. Its dashboard limit is 1,000 files and 25 MiB per file; this project's manifest is well below both. A Direct Upload project cannot be converted to Git integration in place.

1. Sign in to Cloudflare and open **Workers & Pages**.
2. Choose **Create application → Get started → Drag and drop your files**. Choose the Pages/static-assets flow if the dashboard presents a separate Workers flow.
3. Enter an available project name, such as `outpost-replay`, and select the verified folder or ZIP. Check that `index.html` is at the upload root and that no asset shows a size/upload error.
4. Only after the team authorizes publication, choose **Deploy site** / **Save and Deploy**. This publishes the build at the provider's assigned `pages.dev` HTTPS URL. No GitHub connection or repository-visibility change is required.
5. For an existing Direct Upload project, choose **Create a new deployment** and the intended production/preview environment. Upload a complete build each time.

Button labels are those in the current official guide; the dashboard may group the Pages choices differently. Do not create a Worker, add a secret, or connect a public repository to work around a missing menu.

## Verify the actual public host before submission

- Open the HTTPS address in a fresh/private browser without a Cloudflare login. Confirm cold load, hard refresh, the assets, credits and software notices.
- Complete the 27-second storyboard and check **19.9 / 43.9 kWh at hour 120**, **97 / 0 h** whole-mission low reserve, and **−14 science points**. Those last two are whole-mission comparisons, not D3-only values.
- Refresh and resume; inspect the same A/B results and prediction. Saves belong to that browser and origin. Local-preview progress does not migrate to `pages.dev`; clearing site data/private browsing can remove progress.
- Copy a replay link and open it in a fresh tab. Confirm it uses the public HTTPS origin, restores both runs and excludes the callsign. Replays use query parameters, not application path routes; do not strip the query string.
- Check EN/AZ, Cadet/Engineer, keyboard focus, movement/rover, all six decisions, Science (`Elm`) & optional 3D close/resume, Mars and mute/music/effects. Repeat the principal views at 1366×768 and 1600×900.
- A failed DONKI call must show an unavailable status and leave the training runs intact. Avoid depending on a live request during the pitch.
- Record the tested URL, source commit and artifact hash in the submission. Do not call the site publicly verified until these host checks are done.

Keep the previous ZIP/manifest for rollback by reuploading that complete artifact. Keep the same local build and a clearly identified recording as presentation backups. This application has no service worker or guaranteed offline first load.
