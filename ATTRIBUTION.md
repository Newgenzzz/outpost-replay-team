# Sources, credits, and licensing status

The [2026 NASA Space Apps participant terms](https://www.spaceappschallenge.org/legal/) require source citations and applicable third-party license documentation. Original challenge content must be freely available without restriction or under an OSI-approved license. The terms specify Apache 2.0 as NASA’s distribution default if the team specifies no qualifying license.

## Approved license for original team materials

> [!NOTE]
> **Apache-2.0 approved on 15 November 2026 for original team materials only.** Third-party software and NASA/NOAA material retain their own terms. See [NOTICE](NOTICE) for scope.

## Licensing status at a glance

| Item | Current status |
| --- | --- |
| Team code, documentation and original media | Apache-2.0 approved ([LICENSE](LICENSE) / [NOTICE](NOTICE)); limited to team-owned rights |
| Public repository and playable deployment | Live & verified at <https://github.com/Newgenzzz/outpost-replay-team> and <https://newgenzzz.github.io/outpost-replay-team/> |
| Runtime third-party notices | Collected & verified for `40` package versions in [public/THIRD_PARTY_NOTICES.txt](public/THIRD_PARTY_NOTICES.txt) |
| Shipped visual/audio media | Procedurally generated in project source code (no bundled external rasters, fonts, or audio files) |
| Development history & prior-work records | Official hackathon build (`Nov 14–15`: `35f3349` / `8ace633`–`HEAD`) distinguished from preserved `Nov 6–9` AI-generated exploratory prototype checkpoints (`fd05999`–`09e9e10`) |
| AI-assistance disclosure | Documented for OpenAI Codex, Google Antigravity & Gemini, Anthropic Claude, and ChatGPT research/ideation (scope noted below) |

## Contents

- [Licensing status at a glance](#licensing-status-at-a-glance)
- [Approved license for original team materials](#approved-license-for-original-team-materials)
- [Scientific sources and media](#scientific-sources-and-media)
- [Direct software dependencies](#direct-software-dependencies)
- [AI assistance and procedural media disclosure](#ai-assistance-and-procedural-media-disclosure)
- [Evidence-based development timeline & eligibility status](#evidence-based-development-timeline--eligibility-status)
- [Unresolved organizer & team questions](#unresolved-organizer--team-questions)

**Approved by the authorized rights-holder representative on 15 November 2026:** [Apache-2.0](LICENSE), with attribution **Copyright 2026 Team Brochachos contributors**. The grant covers original project code, documentation, and procedural visual/audio materials only to the extent the team owns the relevant rights or is authorized to license them. See [NOTICE](NOTICE) for the scope and [the browser-accessible license](public/PROJECT_LICENSE.txt).

Third-party dependencies and incorporated third-party material retain their own licenses and notices. NASA/NOAA data, publications, agency names and marks are excluded from the team's grant and remain subject to their applicable terms. Recorded AI-assisted generation does not automatically establish copyright ownership; no unsupported ownership claim is made for AI output. The earlier candidate text remains in `licensing/Apache-2.0.txt` as a historical review copy. Historical audit entries below describe their then-current approval status; this paragraph records the subsequent approval.

## Scientific sources and media

- [NASA_SCIENCE.md](NASA_SCIENCE.md) credits the published NASA, NOAA, IAU/USGS, and research references, and identifies the values used in the exercise. The in-game Evidence panel and 3D NASA Sensor Deck also credit Zuber et al. (2012, *Nature* — LRO LOLA Shackleton topography), Mazarico et al. (2011) and Gläser et al. (2018) for polar rim illumination, Paige et al. (2010 — Diviner cold traps), Colaprete et al. (2010 — LCROSS Cabeus water ice), NASA CCMC DONKI (optional FLR catalog metadata; explicit empty/unavailable states) and NOAA GOES (the published 207 pfu near-Earth reference), Schwadron et al. (CRaTER), and NASA Mars 2020 Perseverance MEDA / MOXIE / InSight dust optical-depth references for Bonus Mission 2. See [NASA media guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/) for agency media and marks.
- **M1 provenance correction (8 November 2026):** No LOLA/Diviner raster or OSDR RadLab radiation dataset is bundled. The previous claimed May 2024 ISS/lunar traces were unsupported synthetic series and have been removed. The retained 3D scene is procedural teaching art; published research and agency measurements remain separately attributed in NASA_SCIENCE.md. The NASA September 2017 Mars radiation example is a linked reference only; its graphic and data are not redistributed.
- The field specimen cards credit [NASA LRO LOLA](https://science.nasa.gov/mission/lro/lola/), [Apollo 15 Genesis Rock](https://science.nasa.gov/solar-system/moon/genesis-rock/), [NASA’s lunar regolith processing reference](https://ntrs.nasa.gov/citations/20080008755), [LRO instruments including Diviner and CRaTER](https://science.nasa.gov/mission/lro/spacecraft-and-instruments/), and [LCROSS](https://science.nasa.gov/mission/lcross/). These cards describe training analogs and link to agency references.
- All nine historical SVGs formerly in `public/assets/` and unused legacy prototype components were removed. The [15 November provenance follow-up](ASSET_PROVENANCE_2026-11-15.md) recovered matching Antigravity `write_file` content for every historical SVG, supporting an AI-assisted development origin without claiming automatic copyright ownership. The files remain absent from the current game and preserved in Git history. All active visuals are generated procedurally in project source code: 2.5D Phaser sprites and polar horizon art in `src/game/`, the authored procedural 3D crater illustration (not a NASA elevation mesh) in `src/data/shackletonDem.ts` and `src/components/Shackleton3DHologram.tsx`, inline UI SVGs in `src/components/`, the inline SVG favicon in `index.html`, and procedural Web Audio synthesis in `src/utils/soundEffects.ts`. No external raster images, agency emblems, audio recordings, or font files are shipped in `public/`.
- The interface uses Lucide icons, whose package notice credits Feather. CSS names local fonts and uses system fallbacks. The practice copy ships no font files.

## Direct software dependencies

Versions below come from the installed packages and correspond to the lockfile. Preserve applicable upstream notices for redistributed code and check the transitive packages included in any submitted build. `package-lock.json` records the resolved package tree.

| Package | Version | Declared license | Upstream |
| --- | --- | --- | --- |
| `@react-three/drei` | 9.120.4 | MIT | [Project](https://github.com/pmndrs/drei) |
| `@react-three/fiber` | 8.17.10 | MIT | [Project](https://github.com/pmndrs/react-three-fiber#readme) |
| `@tailwindcss/vite` | 4.3.3 | MIT | [Project](https://tailwindcss.com) |
| `@types/canvas-confetti` | 1.9.0 | MIT | [Project](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/canvas-confetti) |
| `@types/react` | 18.3.31 | MIT | [Project](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/react) |
| `@types/react-dom` | 18.3.7 | MIT | [Project](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/react-dom) |
| `@types/three` | 0.187.0 | MIT | [Project](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/three) |
| `@vitejs/plugin-react` | 4.7.0 | MIT | [Project](https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-react#readme) |
| `canvas-confetti` | 1.9.4 | ISC | [Project](https://github.com/catdad/canvas-confetti#readme) |
| `lucide-react` | 0.468.0 | ISC | [Project](https://lucide.dev) |
| `phaser` | 4.2.1 | MIT | [Project](https://phaser.io) |
| `react` | 18.3.1 | MIT | [Project](https://reactjs.org/) |
| `react-dom` | 18.3.1 | MIT | [Project](https://reactjs.org/) |
| `recharts` | 2.15.4 | MIT | [Project](https://github.com/recharts/recharts) |
| `tailwindcss` | 4.3.3 | MIT | [Project](https://tailwindcss.com) |
| `three` | 0.187.0 | MIT | [Project](https://threejs.org/) |
| `typescript` | 5.6.3 | Apache-2.0 | [Project](https://www.typescriptlang.org/) |
| `vite` | 6.4.5 | MIT | [Project](https://vite.dev) |

**GSAP review.** The legacy prototype's two GSAP animations were replaced with browser and Phaser animations, and GSAP was removed from the package and lockfile. The active outpost already used Phaser. The earlier package used the [GSAP Standard No Charge License](https://gsap.com/community/standard-license/), which limits the grant to permitted uses.

The lockfile review also found the build-time `caniuse-lite` dataset (CC BY 4.0) and `webgl-constants` (MIT in its bundled LICENSE; absent from its package metadata). If distributing either package, carry its upstream notice.

**Submission follow-up.** The team license and limited scope were approved on 15 November 2026; the recovered historical SVG writer evidence is documented separately. Confirm remaining prototype authorship/timeline details before submission. Code-generated assets do not by themselves establish authorship or rights to inherited reference inputs. Preserve applicable upstream notices, including those for transitive libraries in the final bundle, and include the source citations with the submission.

**7 November 2026 audit.** Rechecked the official 2026 terms (updated 7 August). The approval and artwork tasks above remain open. [Bundled runtime notices](public/THIRD_PARTY_NOTICES.txt) now collect installed license texts for 40 package versions from the actual production module graph, including nested victory-vendor notices and its [versioned upstream MIT license](licensing/Victory-LICENSE.txt). Regenerate with `node scripts/prepare-notices.mjs` and rebuild after import/dependency changes. Review embedded third-party components before release; this collection grants no team-material license and does not establish inherited art rights. See [COMPETITION_READINESS.md](COMPETITION_READINESS.md).

**M6 review (8 November 2026).** Regenerated runtime notices from the current module graph (40 package versions); no team license was granted. The full official terms returned HTTP 502 in this pass, so final approval must recheck the complete current terms. Written prior-work eligibility clearance and public release approval remain external gates documented in COMPETITION_READINESS.md.

**Visual polish (9 November 2026).** The circular relief crop and presentation base in `src/components/hologramGeometry.ts` are authored procedural display code sampling the existing teaching terrain, not NASA elevation data. Ground colors/lighting were revised in the existing authored artwork. No third-party art, textures, fonts, audio or additional dependencies were imported. Reviewed official Three.js/Phaser guidance; a Kenney CC0 asset kit was considered but not integrated. Existing team-license and inherited-input provenance gates remain unchanged.

## AI assistance and procedural media disclosure

The project distinguishes four categories that must not be conflated:

1. **Genuine NASA / NOAA data & published research:** Manually transcribed published parameters (`BVAD` oxygen demand, `LCROSS` Cabeus ice estimate, Gläser et al. `LOLA` Table 2 rows, NOAA GOES May 2024 207 pfu near-Earth peak), `OSDR VEG-01A` research context, and optional live CCMC DONKI flare-catalog metadata (`FLR`).
2. **Educational simulation & procedural media:** The 216-hour mission simulation, classroom dose scaling, 2.5D Phaser outpost graphics, procedural 3D crater teaching geometry, inline SVGs, and Web Audio adaptive soundtrack (`src/utils/soundEffects.ts`) are generated deterministically or procedurally by project source code. **No standalone AI-generated raster images, voice recordings, music files, or video files** are bundled in `public/`.
3. **AI-assisted programming & documentation (verified in repository records):**
   - **OpenAI Codex:** Verified across commits `fd05999`–`80ae256`, `codex/*` branches, `CODEX_HANDOFF.md`, engine/replay/science/rendering/audio tests, audits, and release preparation (`800ae43`, `2df3358`, `ffd9e6d`).
   - **Google Antigravity & Gemini:** Verified in the M0 Antigravity checkpoint (`86eda74`), the Argon checkpoint (`35f3349`), `SUBMISSION_KIT.md`, and UI/science polish.
   - **Anthropic Claude (via Google Antigravity):** Verified in `5df32e9`, `CLAUDE_HANDOFF.md`, `SUBMISSION_KIT.md`, and the final rover motor Web Audio / blur lifecycle release pass (`649fbf9`, PR `#4`) and final release documentation.
   - **ChatGPT *(team ideation scope)*:** Used in the team's challenge research, brainstorming, and drafting workflow; exact prompts, dates, and whether any direct copy originated there are not recorded in Git metadata and remain noted honestly as uncertain.
4. **External pitch/video media disclosure rule:** If any AI-generated images, narration, music, or video assets are created separately for the submission video or slide deck, NASA Space Apps guidelines require explicit per-asset disclosure and attribution of the generating tool.

## Evidence-based development timeline & provenance notice

- **Team statement on official hackathon development:** Prior to **November 14, 2026**, Team Brochachos researched the NASA Space Apps challenge, discussed ideas, and planned our approach. We consider **November 14–15, 2026** (`35f3349` and `8ace633`–`HEAD`) the period when our team built and finalized the official hackathon submission.
- **Honest separation of earlier exploratory artifacts in Git history:** Repository history also retains earlier AI-generated exploratory prototypes and audit checkpoints from November 6–9 (`fd05999`–`09e9e10`) imported alongside an earlier practice workspace (`outpost-replay-practice`). These earlier AI-generated exploratory drafts are preserved transparently without rewriting history or deleting commits, and should not be mischaracterized as completed team submission development. Where authorship or timing cannot be independently established from Git metadata, the uncertainty is documented explicitly below:

- **A. Pre-November 14 research & preserved AI exploratory checkpoints (`fd05999`–`09e9e10`, Nov 6–9, 2026):**
  - *Pre-`fd05999` unversioned `outpost-replay-practice` directory (before Nov 6, 2026):* `IMPLEMENTATION_LOG.md` notes the supplied directory lacked Git metadata. Nine historical `public/assets/*.svg` files recovered in [ASSET_PROVENANCE_2026-11-15.md](ASSET_PROVENANCE_2026-11-15.md) match Nov 5 Antigravity `write_file` operations; all nine were removed at `86eda74` and are absent from the shipped game. Exact human prompt contributors and original sandbox dates before `fd05999` cannot be established from Git metadata alone.
  - *Exploratory prototype & audit commits `fd05999`–`09e9e10` (Nov 6–9, 2026) and mirrored team-initial commits `88fae9d`–`615de10`:* Commits authored by `Codex <codex@localhost>` (`fd05999`–`80ae256`) and `Kenan22w` (`941ac87`–`09e9e10`) preserve early AI-assisted React/Phaser/Three.js prototypes, removal of legacy prototype SVGs and GSAP code (`86eda74`, `3e318af`), and automated M0–M6 scientific/accounting/rendering audit passes. These commits reflect exploratory prototyping and automated verification experiments rather than the finalized competition build completed during the hackathon.
- **B. Transition checkpoint `35f3349` (Nov 14, 2026 12:50 +0400) *(boundary uncertainty documented)*:**
  - Commit `35f3349` captured uncommitted Gemini Argon working-tree edits (sightline/POV, 2.5D horizon & conduit graphics, 1-click prediction, Cadet card polish) at the start of the Nov 14 Universal Event session. Because `IMPLEMENTATION_LOG.md` records an entry covering those edits dated `11 November 2026` and the pre-checkpoint edits were not individually committed, the exact split between pre-Nov-14 experimentation and Nov 14 session startup cannot be determined solely from Git metadata and is stated transparently here.
- **C. Official hackathon submission development (November 14–15, 2026 · `8ace633` → `HEAD`):**
  - `8ace633` & `6dd15f6`: Repaired horizon teaching geometry, rim camera, lazy 3D error recovery, and promoted Guided Experiment onboarding.
  - `245d498` & `4ad8352`: Protected active mission saves from accidental reset, added blocked-clipboard recovery, clarified strategy names, and added 4-tier NASA provenance badges.
  - `4aec310` & `6977994`: Upgraded the 2.5D mountain horizon cross-section lesson, optional 3D crater toggle, and 7-step Rewind & Compare UX.
  - `d1c4fc2`: Added bounded browser save/resume (`missionProgress.ts`), integrated OSDR `VEG-01A` crop water-stress findings, and migrated live DONKI FLR fetching to `ccmc.gsfc.nasa.gov/DONKI-API/get/FLR`.
  - `8804322`: Simplified Cadet decision layout and surfaced Benefit/Cost trade-offs.
  - `be768ff` & `fdbf20f`: Added original procedural adaptive Web Audio soundtrack, persistent audio controls, Science navigation clarity, and interactive `public/credits.html` disclosures.
  - `f430730`, `800ae43`/`933ffeb`, `2df3358`/`cb953d2`, `ffd9e6d`/`a1a5c3c`: Polished DONKI-to-decision workflow, joined team history into `Newgenzzz/outpost-replay-team`, applied rights-holder-approved Apache-2.0 (`LICENSE` / `NOTICE`), enabled GitHub Pages deployment, and fixed Phaser-to-DOM keyboard handoff (`81` tests).
  - `649fbf9` (PR `#4` → `275af05`) & documentation release pass: Upgraded discrete rover chirps to continuous speed-reactive structure-borne rover motor synthesis (`82` tests), hardened `window.blur` keyboard reset, updated release documentation, and verified the public site in Chromium.

### Transparency & external confirmation scope

- **Public licensing & repository status:** Public release and the Apache-2.0 grant for original team-owned materials were approved on November 15, 2026 (`LICENSE`, `NOTICE`, `public/PROJECT_LICENSE.txt`), and all `40` runtime dependency notices (`public/THIRD_PARTY_NOTICES.txt`) are built into the live deployment at <https://newgenzzz.github.io/outpost-replay-team/>.
- **Organizer review disclosure:** Full Git history (`fd05999`–`HEAD`), pre-Nov-14 exploratory prototype artifacts, and unrecorded sandbox/ChatGPT boundary uncertainties remain open and unaltered in <https://github.com/Newgenzzz/outpost-replay-team> for NASA Space Apps organizers and judges to review alongside the project's formal submission fields.
