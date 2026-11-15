# OUTPOST REPLAY · submission working kit

Prepared 14 November 2026. Copy-ready drafts below require the team's review. This document does not certify eligibility, grant a license, authorize publication, or claim that a public demo or learner study exists.

## Confirm before submitting

- Check the current **Universal Event** organizer messages and project form for the deadline time zone, required fields, video/slide limits, language and AI disclosure requirements. The [2026 event page](https://www.spaceappschallenge.org/2026/) lists the general November 15, 11:59 PM local-time closing time; the applicable Universal time zone must be confirmed. Direct retrieval of the current Universal/resources pages failed during this review. The earlier 30-second / seven-slide / equally weighted rubric claims are **not independently verified current Universal requirements**.
- Obtain written confirmation about reuse of work completed before the event. Retain the actual Git history and distinguish prior development from event work; do not relabel earlier work as created during the weekend.
- Resolve team authorship and license approval, then complete the source/material documentation in [ATTRIBUTION.md](ATTRIBUTION.md). The candidate Apache-2.0 text is not an active project license.
- Review the [2026 participant terms](https://www.spaceappschallenge.org/legal/), including source citations, third-party rights and media restrictions. Recognizable names, voices and likenesses of minors must not appear in the submission. Use anonymous learner observations; do not record or publish children's identities.

## Project-page drafts

**Title:** OUTPOST REPLAY — Predict. Decide. Rewind. Explain.

**Summary:** OUTPOST REPLAY is an English–Azerbaijani mission trainer in which students manage a fictional lunar outpost and explore competing needs for power, life support, shielding, food and scientific work. Players predict an outcome, apply an engineering choice, rewind it, and compare two runs while preserving their other recorded inputs. Resource forecasts and matched-time comparisons make the cost of each choice visible. Published NASA research and reference parameters are credited separately from the game's educational assumptions.

**Problem and audience:** Young learners encounter spaceflight as either a simplified adventure or a technical subject with unfamiliar units. Our target audience is students aged 7–12, with a Cadet interface for plain-language guidance and an Engineer interface for quantitative inspection by educators and judges. These are design targets, not measured evidence of suitability or learning gains.

**Challenge relevance:** [Build a Junior Astronaut Mission Trainer](https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/) asks for interactive experiences that make competing outpost engineering demands tangible and fun. Our six-decision lunar exercise combines exploration and station preparation with explicit resource consequences. A bonus Mars scenario is available, but the submission demonstration concentrates on one complete lunar experiment.

**Innovation:** Rewind & Compare turns a mission choice into a reproducible counterfactual experiment. Run A records scenario settings and preparations at each phase. Run B can change one choice while retaining the other recorded inputs. The interface explains trade-offs at matching mission times and identifies changed preparations or unequal-duration runs. Students can ask not only “Did I succeed?” but “What changed, and why?”

**Demonstrated example:** In the existing default Guided Demo, keeping the drill running leaves 19.9 kWh at hour 120; changing D3 to backup fuel cells leaves 43.9 kWh at that same hour. Both runs finish at hour 216. Across the whole mission, time below the 20 kWh reserve threshold changes from 97 hours to zero, while science decreases by 14 points. Scores are 54 and 66. These are deterministic game-model results, not real outpost forecasts. Recheck these values in the exact release build before recording.

**Impact and next evaluation:** The bilingual interface is intended to make the same engineering experiment accessible to English- and Azerbaijani-speaking learners. Next we will observe first-time players and educators, measure completion and assistance, and ask learners to explain one benefit and one cost. No classroom effectiveness, measured learning gain or adoption claim is made yet.

**Technical approach:** Static React/TypeScript/Vite application, with a Phaser 2.5D world, a Three.js teaching illustration, deterministic resource accounting and recorded replay inputs. The core exercise uses bundled inputs and does not depend on a successful live API request. A first load still requires a served build; no installable offline app is claimed.

## NASA and other scientific resources used

The project uses selected, manually transcribed published values and references, not a raw instrument-data processing pipeline. See [NASA_SCIENCE.md](NASA_SCIENCE.md) for the full methodology and limitations.

| Resource | What it contributes | Provenance and limit |
| --- | --- | --- |
| [NASA BVAD, Table 3-22](https://ntrs.nasa.gov/api/citations/20180001338/downloads/20180001338.pdf) | 0.82 kg O₂ per crew-day used in the oxygen ledger. | Published reference-crewmember research parameter; actual metabolism varies. |
| [NASA OSDR VEG-01A](https://osdr.nasa.gov/bio/repo/data/payloads/VEG-01A) | A 33-day ISS lettuce trial and its water-stress observations explain why crop care and water planning matter in D2-C. | Research context, not a fitted biological model. The pre-grown tray, five additional powered days, water and energy costs, and yield are training assumptions. |
| [Gläser et al., NASA NTRS](https://ntrs.nasa.gov/citations/20170007365) | S/C1 planner: 85.5%/88.0% mean visible solar disk and 66/112 h longest modeled shadow, at 2 m over 2017–2037. | Published illumination modeling from LOLA-derived terrain. The planner adds assumed load and storage calculations; it is separate from the fictional mission profile. |
| [NASA LRO LOLA](https://science.nasa.gov/mission/lro/lola/) and [Mazarico et al.](https://ntrs.nasa.gov/citations/20120010094) | Explain how terrain measurements support models of polar illumination and local horizons. | The 3D crater is procedural teaching art, not NASA elevation samples or a georeferenced reconstruction. Its indices are not annual illumination or electrical-output predictions. |
| [LCROSS](https://pds.nasa.gov/ds-view/pds/viewBundle.jsp?identifier=urn%3Anasa%3Apds%3Alcross_impactor&version=1.0) / [NASA scientific summary](https://ntrs.nasa.gov/api/citations/20250006445/downloads/SMD-LUN-102_RevA_authors.pdf#page=15) | The central 5.6% water-ice mass estimate supplies a feedstock analog. | Estimate derived from the Cabeus impact ejecta. Applying it to a fictional Shackleton training batch and choosing recovery efficiency are assumptions. |
| [NOAA GOES report PRF 2541](https://www.ngdc.noaa.gov/stp/space-weather/swpc-products/weekly_reports/PRFs_of_SGD/2024/05/prf2541.pdf) | The default storm amplitude borrows the observed 207 pfu near-Earth proton peak on May 10, 2024. | A NOAA measurement near Earth, not NASA lunar-base telemetry. Pulse timing, shape and lunar dose conversion are educational assumptions. |
| [NASA CCMC DONKI](https://ccmc.gsfc.nasa.gov/tools/DONKI/) | Optional live solar-flare catalog context, with links to returned records. | Flare class is catalog metadata; it is not converted into proton flux or dose and does not rewrite a mission. Live access can fail. |
| [NASA-STD-3001 Vol. 1](https://standards.nasa.gov/standard/NASA/NASA-STD-3001-VOL-1) | Distinguishes NASA exposure standards from the classroom warning. | The game's 0.015 mSv·h⁻¹·pfu⁻¹ scaling, shielding factors and calculated doses cannot establish real astronaut exposure or standards compliance. |

Other boundaries to state honestly: lossless battery storage, simplified loads, pre-grown crop trays, abstracted fuel-cell/ISRU reactants and instantaneous water recovery. Resource conservation within this model does not validate real hardware or biological performance. The fictional 72-hour reduced-light interval is not a measured Shackleton event.

## AI and prior-work disclosure drafts

**AI use — team must confirm the exact tools and scope:** “Repository records document assistance from OpenAI Codex (`fd05999`–`80ae256`, `codex/*` branches, audits, tests and release preparation), Google Antigravity and Gemini (`86eda74`, `35f3349` and UI/science polish), and Anthropic Claude through Google Antigravity (`5df32e9`, `CLAUDE_HANDOFF.md`, `SUBMISSION_KIT.md`). The team's workflow also included ChatGPT for challenge research/drafting *(exact scope and dates require team confirmation)*. All graphics and Web Audio music/effects in the app are procedurally generated in code; no standalone AI-generated image, audio or video files are bundled. We reviewed generated code against primary NASA/NOAA citations and automated tests. Tool assistance does not validate scientific assumptions. If any AI-generated media is added to external slides or video, it must be explicitly labeled with its generating tool.”

**Prior work — organizer review required:** “The project continues from the pre-event `outpost-replay-practice` repository (unversioned practice folder before Nov 6, commits `fd05999`–`09e9e10` on Nov 6–9, and transition checkpoint `35f3349` at the start of Nov 14 with a Nov 11 log entry whose pre-event vs. event split requires team confirmation). Hackathon-weekend commits `8ace633` through HEAD (Nov 14–15) cover horizon diagram repair, guided experiment onboarding, progress protection/persistence, strategy/provenance clarity, OSDR/DONKI updates, adaptive procedural audio, `Science` (`Elm`) navigation/UI clarity and credits documentation. See `ATTRIBUTION.md` and `public/credits.html`. Written organizer confirmation is required for pre-event code eligibility before submission.” Replace this with the actual written determination; do not claim the entire codebase was written on Nov 14–15 or imply permission has already been verified.

**Publication fields to complete:** official team name; approved source URL; tested playable URL; exact release commit; video/slides link; applicable license; confirmed Universal deadline/time zone; complete resource and AI-tool list. A private team repository alone does not establish open-source submission compliance.

## GitHub Repository Release Strategy (`Kenan22w/outpost-replay-team`)

**Recommendation:** **Keep (and optionally rename in GitHub Settings) `Kenan22w/outpost-replay-team` rather than creating a fresh repository without history.**

- **Why keep/rename `Kenan22w/outpost-replay-team`:** Renaming or keeping the existing repository with `README.md` branded as `# OUTPOST REPLAY — Team Brochachos` preserves the full, honest commit log (`fd05999`–`09e9e10` pre-event work, `35f3349` transition checkpoint, `8ace633`–`HEAD` hackathon-weekend work), branches, and attribution records. Creating a brand-new single-commit repository on November 15 to hide pre-event history (`fd05999`–`09e9e10`) would misrepresent development dates and violate honest Space Apps disclosure standards.
- **When a separate team/org mirror would ever be justified:** Only if collaboration permissions require transferring to a Team Brochachos GitHub organization that cannot fork or transfer the existing repository; even then, transfer via GitHub Settings or mirror complete history (`git push --mirror`) while retaining `ATTRIBUTION.md` and `public/credits.html`.
- **Action status:** No repository rename, visibility change (`private` → `public`), push, or deployment has been executed automatically. Team & rights-holder approval plus organizer pre-event clearance are required first.

## Provisional 30-second recording

This is an editing template, **not a verified official duration requirement**. Adapt only after checking the current Universal guide. Use actual gameplay, readable captions and the same tested build. Do not present generated footage as working gameplay or NASA observations.

| Time | Screen | Narration |
| --- | --- | --- |
| 0–6 s | Outpost, then the existing guided experiment entry. | “A Moon base needs both science and survival. OUTPOST REPLAY lets students test the trade-off.” |
| 6–14 s | D3 drilling result: 19.9 kWh at hour 120. | “Predict, choose, and inspect the result. Keeping the drill running leaves 19.9 kilowatt-hours.” |
| 14–24 s | Rewind D3, compare 43.9 kWh and the science cost. | “Rewind one decision. Backup power leaves 43.9, but earns less science. Other planned choices stay fixed.” |
| 24–30 s | Comparison, brief EN/AZ and evidence labels. | “English and Azerbaijani. NASA-informed resources, clearly labeled assumptions. Learn by explaining what changed.” |

Keep a longer [three-minute rehearsal](JUDGE_DEMO.md) for conversations or a backup walkthrough. Export captions, check readability on a small screen, and verify any recording-link access without signing in.

## Optional seven-slide outline

This is a planning option, not a verified official slide allowance: (1) learner/problem; (2) one question and prediction; (3) D3 decision and result; (4) rewind comparison with benefit and cost; (5) NASA evidence chain and limits; (6) bilingual access and honest pilot findings, if collected; (7) tested demo/source links, team contributions and next evaluation.

## Small learner check · not yet performed

Ask 3–5 unfamiliar players, with suitable permission, to start a short experiment, make a prediction, reach a comparison and explain one benefit and one cost. Avoid coaching until they request help. Record anonymous participant IDs, time to first comparison, assistance needed, what confused them and their actual explanation. Also ask whether higher average illumination guarantees a smaller battery requirement using the existing site planner. Invite an educator to review language and scope if available.

Report the sample size and raw observations, including failures. Do not invent testimonials, infer established learning gains from this small exercise, or publish identities/recordings of children. Use the most common observed obstacle to choose one final usability fix.

## Release gates and final check

- [ ] Current Universal requirements, prior-work eligibility and team registration confirmed.
- [ ] Team license/authorship approved; all scientific resources, dependencies and any added media attributed.
- [ ] Exact release source passes `npm test`, `npm run typecheck`, `npm run build` and `git diff --check`; current results recorded rather than copied from an older checkpoint.
- [ ] Production Chromium checks cover EN/AZ, Cadet/Engineer, 1366×768 and 1600×900, walking/rover, six decisions, hologram, Guided Demo and replay. Known limits are reported.
- [ ] Team explicitly approves public release. Follow [COMPETITION_READINESS.md](COMPETITION_READINESS.md): rebuild notices, upload only `dist/`, retain the previous artifact and verify unauthenticated HTTPS and fresh replay links.
- [ ] Submission text, recording/slides, source and playable links agree with the same release commit. No secrets, unsupported claims, unapproved media, fabricated pilot results or implied NASA endorsement.
- [ ] Keep the local HTTP preview and an accurately labeled recording/screenshots as backup. Confirm the project was actually submitted on the official platform before the applicable deadline.

No public release or submission is performed by preparing this kit.
