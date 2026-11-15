# OUTPOST REPLAY · release-candidate review · 15 November 2026

Starting checkpoint: clean `be768ff`, branch `codex/protect-progress-and-sharing`, ancestor confirmed. This review prepares a **local technical release candidate**. It does not authorize publication, clear organizer eligibility, grant a license, or submit a project. No push, deployment, visibility change, history rewrite or scientific-model change is performed.

> [!IMPORTANT]
> **Historical release-candidate checkpoint — superseded by final public release.** Later commits added team-approved Apache-2.0 licensing ([LICENSE](LICENSE) / [NOTICE](NOTICE)), public publication at <https://github.com/Newgenzzz/outpost-replay-team>, continuous rover motor audio & keyboard hardening (`649fbf9`), and verified GitHub Pages deployment at <https://newgenzzz.github.io/outpost-replay-team/>. See [README.md](README.md) and [ATTRIBUTION.md](ATTRIBUTION.md) for current release status and corrected development-history disclosures.

## Contents

- [First-minute judge experience](#first-minute-judge-experience)
- [Official challenge and NASA-resource verification](#official-challenge-and-nasa-resource-verification)
- [Public-release readiness and focused correction](#public-release-readiness-and-focused-correction)
- [Final verification and artifact](#final-verification-and-artifact)
- [Remaining submission blockers](#remaining-submission-blockers)
- [GitHub repository strategy](#github-repository-strategy)

## First-minute judge experience

The existing launch screen names the crew/power/science objective, makes **Start guided experiment** primary, and labels the fictional training setting. Five actions reach prediction, decision, observation, rewind and comparison: start the guide, start the shadow test, predict backup, choose drilling, rewind. Prediction is optional; four actions suffice without it. The observed comparison leads with **19.9/43.9 kWh at hour 120**, names the benefit/cost and explains battery → water recycling. No blocking first-minute confusion was demonstrated, so no general redesign or new game system was justified. This is an expert walkthrough, not evidence that unfamiliar students understood it within 60 seconds.

Use [the 27-second storyboard](DEMO_27_SECONDS.md); keep the longer 3-minute script for questions. Avoid beginning a short pitch with the optional 3D scene, live catalog or Mars: they delay the controlled experiment.

## Official challenge and NASA-resource verification

The [official 2026 challenge Details](https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/) and [Resources tab](https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/?tab=resources) were read directly in Chromium on 15 November after the text-fetch tool returned errors. The objectives explicitly target ages **7–12**. They encourage real NASA open data, permit curated archived data, and ask for clear in-tool attribution. **Neither inspected tab specifies a fixed minimum dataset count or requires integrating every listed resource.** Do not invent a three-dataset rule or claim organizer certification. Additional team-event submission requirements still need checking.

The Resources tab lists NASA Open APIs, DONKI, OSDR, RadLab and Mars Trek, plus two CSA educational resources. An API portal is not a distinct dataset. Current use is:

| Official listed resource | Exact evidence and connection to this game | Honest scope |
| --- | --- | --- |
| **DONKI** | [NASA notification 20240516-7D-001 / #30944](https://ccmc.gsfc.nasa.gov/DONKI/view/Alert/30944/1) records the May 10, 2024 GOES >10 MeV threshold crossing at 13:35 UTC. `nasaTelemetry.ts` cites it; D5 and the DONKI deck show the archive alongside shielding choices. `nasaSpaceWeather.ts` optionally fetches recent FLR IDs, classes, times and record links for catalog comparison. | Two uses of one source, not two datasets. Archived context is available without a live fetch. FLR metadata does not drive the storm or provide pfu/dose. The 207 pfu peak is sourced separately to NOAA. |
| **OSDR** | [VEG-01A payload record](https://osdr.nasa.gov/bio/repo/data/payloads/VEG-01A), reopened directly: ISS lettuce May 8–June 10, 2014; water stress and crew watering. `ISS_VEGGIE`, the D2 source card and BVAD/OSDR deck explain why water planning matters for D2-C crops. | A real archived research finding, qualitatively connected to the decision. No omics files, fitted growth curve or astronaut dosimetry are imported. Game crop age/cost/yield are assumptions. |
| **NASA Open APIs** | The project uses NASA's documented direct public CCMC DONKI endpoint. | Umbrella portal, not an additional independent dataset. No personal API key is shipped. |
| **RadLab** | Not integrated. | Do not claim ISS dose traces, RadLab-derived shielding or measured lunar astronaut doses. |
| **Mars Trek** | Not integrated. | Mars is an educational scenario; no Trek imagery/terrain product is processed. |

DONKI and OSDR are the two directly connected resources from the official list; this is a traceable implementation claim, not proof of final eligibility. The full source list is available in the game and [NASA_SCIENCE.md](NASA_SCIENCE.md).

Additional NASA-derived/reference inputs have these distinct roles:

| Source | Code → gameplay chain | Limits / verification |
| --- | --- | --- |
| [BVAD, Table 3-22, printed p.45 / PDF p.59](https://ntrs.nasa.gov/api/citations/20180001338/downloads/20180001338.pdf#page=59) | `ECLSS_BASELINES.o2KgPerCrewDay = 0.82` → `resources.ts` → two-person hourly oxygen demand. | Published short-mission reference-crewmember model, not a measurement of the fictional crew. Source table reopened. |
| [Gläser et al., NASA NTRS 20170007365](https://ntrs.nasa.gov/citations/20170007365) | Two published 2 m site rows in `lunarSiteIntelligence.ts`: S 85.5%/66 h and C1 88%/112 h → `sitePowerPlanning.ts` → average generation and storage lesson. | Published LOLA-derived illumination modeling, separate from D3's scripted 72 h. Record/abstract reopened; PDF retrieval timed out this session. Table transcription retains its earlier documented verification and tests; no new raw-data validation is claimed. |
| [LCROSS scientific summary, p.15](https://ntrs.nasa.gov/api/citations/20250006445/downloads/SMD-LUN-102_RevA_authors.pdf#page=15) | `LCROSS_CABEUS.waterIceMassFraction` → `resources.ts` → extraction feedstock analog for D4-A. | Previously verified Cabeus estimate, reused with assumed training feedstock/recovery. Not a Shackleton ice detection or newly reprocessed spectrum. |
| [NOAA PRF 2541, p.1](https://www.ngdc.noaa.gov/stp/space-weather/swpc-products/weekly_reports/PRFs_of_SGD/2024/05/prf2541.pdf) | Observed 207 pfu near-Earth peak → default recorded scenario amplitude → fictional storm and shielding comparison. | Report reopened; NOAA is not NASA. Timing/shape/dose scale are assumptions; no direct flare-class conversion. |
| LRO/Diviner, Mazarico, NASA-STD-3001, ISS ECLSS and Mars mission references | Explain terrain, cold traps, engineering constraints and the separation between career exposure references and the classroom warning. | Citations/research context do not turn the procedural terrain or Mars balance into measured data or validate the model. See the existing science ledger for previously checked values and limits. |

## Public-release readiness and focused correction

- **Credentials:** a local pattern/path scan found no candidates in 91 tracked files, 433 reachable Git blobs across 39 commits, or the initial eight built files. Patterns covered private keys, common provider tokens, JWTs, credential URLs and literal credential assignments. No sensitive tracked filenames were found. This is a bounded check, not a guarantee against every possible secret format. Final artifact checks are recorded below.
- **No local services:** Vite uses relative asset paths; source has one optional external fetch (public NASA DONKI). There is no proxy, server function, VITE secret or required localhost URL. The local preview address is only for verification. No source maps or development dependencies belong in the upload.
- **NASA failure:** the optional query has a 4.5 s abort, response validation, distinct live/empty/unavailable states and no fabricated replacement records. Existing automated tests cover failed HTTP, offline rejection and invalid payloads; outcomes use recorded inputs independently.
- **Saves/replay:** bounded version-1 browser saves store inputs and recalculate results. Existing tests cover corrupt/future saves, drafts, preparations, predictions and both runs. Refresh/resume is checked in the browser. Storage is origin-specific; local progress will not move automatically to a public domain.
- **Accessibility:** English default, labeled native controls, keyboard dialog navigation, a Cadet explanation layer and visible warning cues remain. EN/AZ desktop checks are listed below. No complete screen-reader/mobile/WCAG certification is claimed.
- **Disclosures:** the initial build shipped software notices but provided no direct UI path to those notices or an AI/media disclosure. Added `public/credits.html` and a small bilingual launch link, and updated them alongside `ATTRIBUTION.md` to record OpenAI Codex, Google Antigravity & Gemini, Anthropic Claude, and team-reported ChatGPT (scope pending confirmation), procedural code media vs. external AI-media labeling rules, the evidence-based pre-event (`fd05999`–`09e9e10` / `35f3349`) vs. Nov 14–15 (`8ace633`–HEAD) timeline, and the then-pending team-license status. No inherited rights or unverified contributions were invented.
- **Notices:** regenerated from the actual runtime module graph: 40 package versions, no notice text change. No asset/dependency/license grant added. At that point, the source tree's candidate Apache text remained a draft outside the deployment artifact; the later approved [LICENSE](LICENSE) and [NOTICE](NOTICE) replaced it.

The official [2026 participant terms](https://www.spaceappschallenge.org/legal/), updated August 7, were read in-browser this session. They require rights to submitted materials, source credits and applicable third-party license documentation, and discuss unrestricted/OSI original-content terms and NASA's Apache default. This review does not choose a project license or resolve authorship. The [event page](https://www.spaceappschallenge.org/2026/) gives November 15, 11:59 PM local time; confirm the Universal/team event's applicable time zone and submission form. A 27-second storyboard does not establish an official video-duration limit.

## Final verification and artifact

Baseline: **79/79 tests**, TypeScript and production build passed. Final post-change checks and artifact details are recorded here after completion.

## Remaining submission blockers

1. Team/rights-holder confirmation of project licensing and inherited code/art provenance. No root project license had been approved at the time of this review; Apache-2.0 was subsequently approved for original team materials, while exact authorship/provenance details still need confirmation.
2. Written organizer determination about pre-event work, plus correct registration/team event and an accurate event-work description. Repository reports of clearance are not the written evidence.
3. Complete earlier AI tools/models/scope and all submission references confirmed by the team; current draft names are not silently treated as verified.
4. Current team-event deadline/time zone, required project fields, video/link rules and source-access requirements checked in the actual submission form. No assumed 27/30-second global limit.
5. Explicit publication authorization, then public HTTPS/source access as required and real host verification. A private GitHub backup and local preview do not satisfy a playable public URL.
6. Rehearsal/listening on the actual presentation laptop and final recorded-file review. No learner study or physical-device audio/GPU certification has been performed.

There is no demonstrated need for another graphics/audio/gameplay redesign. Resolve the external blockers, publish only the chosen artifact after authorization, verify that exact host, and enter the tested links and references in the official project form. No submission-complete or public-ready claim is made prematurely.

## GitHub repository strategy

Published repository: <https://github.com/Newgenzzz/outpost-replay-team> (formerly referenced during earlier drafting as `Kenan22w/outpost-replay-team`).

Keep the complete preserved commit graph rather than creating a fresh history-less repository so provenance (`fd05999`–`09e9e10` exploratory checkpoints, `35f3349` transition checkpoint, `8ace633`–`HEAD` Nov 14–15 hackathon build) remains transparent. Repository publicity, Apache-2.0 licensing (`LICENSE`), and verified GitHub Pages deployment (<https://newgenzzz.github.io/outpost-replay-team/>) are now active.
