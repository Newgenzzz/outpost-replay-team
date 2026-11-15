# GitHub Pages release

The production target is <https://newgenzzz.github.io/outpost-replay-team/>.
The target is playable only after the deployment succeeds; source publication alone does not publish the game website.

## Owner setup

1. As the repository owner, open **Settings → Pages**.
2. Under **Build and deployment → Source**, select **GitHub Actions**.
3. If Actions is disabled, open **Settings → Actions → General**, enable Actions and allow the official `actions/*` actions used by `.github/workflows/pages.yml`.
4. If the `github-pages` environment has deployment restrictions, allow the `main` branch and complete any required review.
5. Open **Actions → Verify and deploy OUTPOST REPLAY → Run workflow**, select `main`, and run it after the release workflow reaches `main`. Future pushes to `main` run it automatically.

The workflow installs the lockfile with Node.js 24, runs the full test suite and TypeScript checks, regenerates and verifies third-party notices, builds the Pages artifact, and deploys only `dist/`. Pull requests build and test but do not deploy. No personal token or application secret is required. The deployment job uses the official Pages actions with `pages: write` and `id-token: write` permissions.

## Build paths

- `npm run dev`: existing local development behavior.
- `npm run build`: portable static build using relative URLs, suitable for Cloudflare Pages Direct Upload.
- `npm run build:pages`: production build with `/outpost-replay-team/` as the base path.
- `npm run preview -- --host 127.0.0.1`: preview the portable build.
- `npm run preview -- --mode github-pages --host 127.0.0.1`: preview the Pages build at `/outpost-replay-team/`.

Vite's `github-pages` mode selects the repository base path. No mission equations, game inputs, audio behavior, scientific values or saved-progress format change between builds.

## Release verification

Check the completed workflow and actual public HTTPS page before reporting success. In a fresh browser, verify the main JavaScript/CSS requests, launch, user-gesture audio activation and master/music/effects controls, Science/Elm and optional 3D, Guided Experiment and Rewind & Compare, EN/AZ, autosave/resume, and `credits.html`. Recheck all six decisions and the Mars bonus. Test 1366×768 and 1600×900, inspect console errors, and verify that failed DONKI requests leave a usable mission and an honest unavailable state.

After deployment, source citations remain linked from Science and the credits page; software notices are at `THIRD_PARTY_NOTICES.txt`. Browser storage belongs to the current origin: a local save is not automatically transferred to the public website.

## Direct Upload fallback

If the owner cannot enable Pages, use `npm ci`, `node scripts/prepare-notices.mjs`, `npm test`, `npm run typecheck`, then `npm run build` to create the portable artifact. Upload the **contents** of `dist/`, with `index.html` at the upload root, using **Cloudflare → Workers & Pages → Create application → Get started → Drag and drop your files**, then **Deploy site**. The dashboard accepts a ZIP or a folder. Do not upload the source checkout, `.git`, `node_modules`, `.env`, recordings or audit logs. See `CLOUDFLARE_DIRECT_UPLOAD.md` for the existing release and rollback checklist.

Keep the previous successful deployment until the new URL passes verification. Source history and the recorded pre-event/event timeline remain in Git. Deployment is separate from NASA submission; this workflow does not submit a project.

Official references: [Vite deployment guide](https://vite.dev/guide/static-deploy.html#github-pages) and [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
