# M6 competition readiness · 8 November 2026

Baseline: `c3a849c`, containing M0–M4. M6 continues on `codex/m6-competition-readiness`. No public release, push or merge is authorized by this document. M5 is not started. Earlier audit versions remain in Git history.

## Release gates

- **Organizer confirmation required:** this project was developed before the event. Obtain written confirmation from the appropriate organizers about reuse, eligibility and disclosure of prior code, including the Antigravity and Codex work. A previous log reports approval for practice-code reuse; the written approval and its scope were not available for verification. Do not treat that report as global judging clearance. Keep commit history and identify work completed during the event.
- **Team rights approval required:** Apache-2.0 remains a candidate, not an active project license. Rights holders must confirm authorship, scope and copyright names before adding a root LICENSE. Procedural/code-generated artwork still needs team provenance confirmation; being generated in source does not establish ownership of inherited code or reference inputs. Do not restore the removed unverified SVG assets.
- **Publication approval required:** select the reviewed commit/artifact, approve publication, then verify a public HTTPS demo and any required source access. A private team repository alone does not establish open-source submission compliance.
- **Real laptop and final guide checks required:** rehearse on the actual integrated-GPU laptop and public connection. Verify the final 2026 submission/video requirements and local pitch rules with the selected Local Lead.

## Official requirements and verification limits

[Official 2026 event page](https://www.spaceappschallenge.org/2026/) indexed content retrieved 8 November lists November 14–15, teams up to six, and submission through the team's Project tab, closing November 15 at 23:59 local time. Confirm which event/time zone applies to the team. Registration and project submission are separate actions.

[Official challenge](https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/) asks for an interactive lunar or Martian outpost game balancing life support, shielding, power and food. OUTPOST REPLAY addresses these through six engineering decisions and reproducible comparison, with a separate Mars bonus. Do not imply NASA endorsement or validation of this educational model.

[2026 participant terms](https://www.spaceappschallenge.org/legal/) indexed text identifies the August 7 update and source-credit obligations. Direct retrieval returned HTTP 502 during M6; the complete licensing clauses were not freshly reverified. The previous audit's OSI-license/Apache-default interpretation in ATTRIBUTION.md needs final rights-holder review against the current full terms. Source citations and applicable third-party notices must accompany the submission. No current global video duration/slide limit was verified; local-event and older/staging rules must not be presented as global requirements. Check consent/media and AI-disclosure rules before recording or submitting.

## Scientific evidence and claims

| Topic | Release interpretation |
| --- | --- |
| Terrain and illumination | The hologram is procedural, exaggerated teaching terrain, not a LOLA DEM. Mazarico's [NASA NTRS abstract](https://ntrs.nasa.gov/citations/20120010094) was reopened and confirms a location-specific 240-day sunlit interval and approximately 1.5-day maximum total darkness. These do not describe the game's entire rim or its 72-hour shadow. |
| S/C1 planning | 85.5%/66 h and 88%/112 h are published modeled results transcribed from Gläser Table 2, documented and verified during M1. The [NTRS record](https://ntrs.nasa.gov/citations/20170007365) timed out in M6; no new transcription or measurement was made. |
| Solar/battery | 12 kWh/day full light, 10 kWh/day base load, 100 kWh capacity and 15%/40% shadow output are training assumptions. Hourly allocation, curtailment and unserved demand are tested. Site planning excludes heater/storage losses. |
| Crew/crops/extraction | BVAD oxygen is a reference parameter; water stress, rations, five remaining powered crop days, harvest and extraction efficiency are assumptions. LCROSS Cabeus's 5.6% estimate is a fictional-batch analog, not a Shackleton measurement. All five cores now contribute feedstock. |
| Radiation | GOES 207 pfu is a near-Earth observed peak. DONKI FLR supplies flare metadata only. The lunar storm, 0.015 coefficient, shielding and background are assumptions. Estimates are not operational astronaut doses; NASA's career reference is distinct from the game's warning. |
| Replay | Run A/B record complete scenario and phase settings. One-change demonstrations isolate D3. Confounded setups are labeled; unequal final durations suppress final inventory deltas. |

[NASA_SCIENCE.md](NASA_SCIENCE.md) is the source/methodology ledger; it contains the agency/paper links and provenance limits. M6 corrects a residual English hourly-chart caption that called scripted events LRO/GOES events and D4 Cadet wording that asserted real ice at the fictional site. Equations, datasets and outcomes are unchanged. Mars bonus parameters remain educational scenario values; this pass does not claim a new exhaustive Mars scientific validation.

## Attribution and release contents

`public/` contains only THIRD_PARTY_NOTICES.txt. Active visuals and audio are implemented in project code; there are no shipped external image, font or audio files. Agency/paper links are references, not redistributed terrain or radiation archives. [ATTRIBUTION.md](ATTRIBUTION.md) inventories sources, dependencies and unresolved team rights.

Regenerated notices from the current production module graph: **40 runtime package versions**, including Three/Fiber/Drei and embedded Victory notices. Preserve those notices and the source citations. The collector now keys packages by name and version, retaining both bundled scheduler versions instead of silently overwriting one. The collector fails if a package has no license file; this is a useful check, not a legal audit of every embedded component. Development-package distribution has a broader notice scope than dist/. Ship neither node_modules nor private configuration.

## Static deployment runbook · execute publication only after approval

Recommend [Cloudflare Pages Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/) of the built `dist/` folder using the dashboard. Official documentation was reopened in M6. No CLI installation or public repository is needed. A Direct Upload project cannot later switch to Git integration in place.

1. Resolve the release gates. From the approved source commit with existing dependencies, run:
   ```sh
   node scripts/prepare-notices.mjs
   npm test
   npm run typecheck
   npm run build
   npm run preview -- --host 127.0.0.1 --port 5218 --strictPort
   ```
   On a fresh machine, use the lockfile with `npm ci` first (Node 22+). Rebuild after notices change. Record the source commit and retain the exact dist/ folder and its file hashes.
2. Inspect **every** dist/ file. Upload only dist/ contents, never the workspace, Git metadata, environment files, credentials, node_modules or QA artifacts. `base: './'` supports relative assets; there is no backend, private API key or server function. Replay uses query parameters, not server routes. Do not put secrets into VITE variables.
3. After explicit approval, create the provider project and upload that folder. No deployment was performed in M6.
4. Verify the public HTTPS URL without login: cold load/hard refresh, all assets and notices, both modes/languages, WASD/click movement, rover, all six Apply actions, Science/3D close/resume, Guided Demo, and a copied replay URL opened in a fresh tab. Recheck 1366×768 and 1600×900. Test live DONKI failure without substituting invented data. Enter the actual tested URL in the submission.
5. For updates, retain the previous artifact and publish a complete replacement; do not mix old HTML and new hashed chunks. Roll back by redeploying the retained verified artifact. A final public-host test remains mandatory after any change.

### Backup demonstration

Keep the same dist/ and dependencies on the presentation laptop; run local preview and serve over HTTP rather than double-clicking index.html. The mission and scripted scenarios do not require live NASA data. External reference links and optional DONKI still require internet. No service-worker/offline-install capability is claimed. Keep a prerecorded walkthrough and screenshots as a secondary backup, with consent and source credits.

## Judge walkthrough · internal 2–3 minute rehearsal

1. **Problem (20 s):** “Young astronauts must balance competing engineering needs. Our bilingual trainer lets them test a decision, then rewind it while preserving the rest of the experiment.” Show Cadet language, then Engineer units.
2. **Evidence (25 s):** open Science/3D. Say “This crater is a procedural teaching illustration. Published NASA-derived illumination studies are separate; mission lighting and dose factors are educational assumptions.” Close the deck.
3. **Experiment (50 s):** start Guided Demo, apply the starting plan, choose Keep drilling, then Rewind D3 and compare. Drilling leaves 19.9 kWh at hour 120; backup leaves 43.9 kWh. Both end at hour 216. Scores are 54/66; low-reserve exposure is 97/0 hours; backup sacrifices 14 science points.
4. **Learning (25 s):** ask “Why does protecting battery power also protect water recovery?” Show the resource graph and preserved input settings. Distinguish a controlled experiment from a scientifically validated lunar forecast.
5. **Close (15 s):** show EN/AZ and explain optional calibration, crops, extraction and prediction in manual play. State that the model is an educational prototype; do not claim student learning gains without a study.

This rehearsal duration is not an official video allowance. Submission synopsis: “OUTPOST REPLAY turns outpost engineering into reproducible experiments: students operate a lunar base, predict a resource consequence, rewind one choice, and compare matched-time outcomes while inspecting the distinction between observed data, research models, and classroom assumptions.”

## Submission checklist

- [ ] Written prior-work/eligibility clarification retained; team registered with the correct event and membership.
- [ ] Full current terms, deadline/time zone, required project fields, video/slide limits and AI disclosure checked. Local pitch language/duration confirmed separately.
- [ ] Team license and asset authorship approved; source access and third-party notices suitable for submission.
- [ ] NASA/NOAA/paper references and scientific limitations transferred into the project form.
- [ ] Public demo approved, published and verified without login; final URL and source commit recorded.
- [ ] Video recorded under confirmed rules with rights/consents, credits and accurate claims.
- [ ] Actual laptop/network, keyboard navigation, EN/AZ and both modes rehearsed; backup recording/local preview ready.
- [ ] Final tests/build pass for the exact released commit; all required fields submitted and submission status confirmed on the official site.

See IMPLEMENTATION_LOG.md for actual M6 checks and limitations. Technical local readiness does not clear the external release gates above.
