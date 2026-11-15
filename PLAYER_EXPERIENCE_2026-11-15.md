# OUTPOST REPLAY — focused player-experience improvements

Baseline: clean `d1c4fc2`, branch `codex/protect-progress-and-sharing`. This session addresses three observed presentation weaknesses; it does not repeat the independent technical/science audit.

> [!NOTE]
> **Historical `d1c4fc2` presentation report — later superseded by public release.** Public source (<https://github.com/Newgenzzz/outpost-replay-team>), Apache-2.0 licensing ([LICENSE](LICENSE) / [NOTICE](NOTICE)), adaptive + rover audio upgrades (`be768ff`, `649fbf9`), and verified GitHub Pages hosting (<https://newgenzzz.github.io/outpost-replay-team/>) are now live. No formal student learning-gain study has been conducted. See [Remaining weaknesses and release-candidate assessment](#remaining-weaknesses-and-release-candidate-assessment).

## Contents

- [What was unclear](#what-was-unclear)
- [Three improvements](#three-improvements)
- [Changed files](#changed-files)
- [Verification performed](#verification-performed)
- [Remaining weaknesses and release-candidate assessment](#remaining-weaknesses-and-release-candidate-assessment)

## What was unclear

1. **Guided instructions competed with the immediate task.** The opening explained D1/D2, a berm, D3 and hour 48 in long paragraphs. The learner needed a shorter objective, a clear transition into the shadow test and a readable first result.
2. **Cadet alternatives appeared after extensive briefing.** In the production D5 console at 1366×768, A/B/C cards began at approximately y=768 while the Apply footer was visible. Crew advice, NASA context and a second shielding selector preceded the main choices.
3. **The comparison hid its cost below the first screen.** The completed seven-step guide and prediction recap preceded matched-hour results. The whole-mission science cost required scrolling. Showing both alternatives without their cost weakened the intended learning loop.

## Three improvements

- **A shorter guided experiment.** Plain EN/AZ prompts explain the crew's need for power, the automatic starting setup, reduced sunlight, prediction and the alternative trial. “Start the shadow test” and “Rewind & try the other plan” name their actions directly. The first result emphasizes the recorded battery value and hour; science and low-reserve duration explicitly say they cover the shadow. Azerbaijani energy units stay with their value.
- **Choices first in Cadet mode.** The existing essential scenario and D3 prediction remain before A/B/C. The existing crew/science briefing is available in a native disclosure after the cards. Radio, sources, OSDR, the D5 shielding selector and scientific caveats are retained. Engineer mode keeps the expanded briefing. The persistent Apply footer, preparation controls and forecasts are unchanged. D5 cards now begin at approximately y=333 at the same viewport, exposing choices and key resource consequences immediately.
- **Comparison first, then explanation.** Existing matched-hour cards and whole-mission consequence chips now lead Rewind & Compare. They use one mode-appropriate strategy label rather than duplicate sentences. Benefit/Cost and Fayda/İtki state the consequence directly. Cadet mode names the B-versus-A comparison in plain language; Engineer retains the delta notation. The learning principle follows the consequences, and the completed step guide can be expanded. Prediction feedback, differing-setup/unequal-time notices and downstream explanations remain available.

Presentation reuses existing panels, results and components. No graphics asset, dependency, engine, simulation equation, parameter, decision outcome, NASA reference, saved-input format or replay calculation was added or changed.

## Changed files

- `src/App.tsx`: comparison order, existing step-guide disclosure, mode passed to comparison.
- `src/components/DecisionCard.tsx`: Cadet briefing/choice order; original briefing content reused.
- `src/components/DeltaSummary.tsx`: mode-appropriate strategy text, benefit/cost wording and result order.
- `src/components/JudgeTourBanner.tsx`: shorter bilingual prompts, action names and result typography.
- `README.md`, `JUDGE_DEMO.md`: current action labels and prediction step in the rehearsal.
- `CODEX_HANDOFF.md`: current checkpoint and verification reference.
- This report.

## Verification performed

- `npm test`: **63/63 passed** (27 simulation, 16 replay/persistence/feedback, 9 science, 11 rendering). No new logic bug was fixed, so no source-text or implementation-mirroring test was added for these reversible presentation edits.
- `npm run typecheck`, `npm run build`, `git diff --check`: passed. The existing large Phaser bundle warning remains.
- Production Chromium at **1366×768 and 1600×900**, **EN and AZ**: guided entry, prediction, first result, rewind and comparison. Both strategy orders were checked. Existing 19.9/43.9 kWh endpoints and the 14-point science difference remained. Benefit/cost chips fit on the first comparison screen: approximately y=452–563 at 1366×768, depending on language and strategy order. No horizontal page overflow or guided-action clipping was found.
- All **six** Cadet consoles in each language/size combination (24 console checks): A/B/C visible on opening, selecting B updates the persistent Apply action, expandable briefing works, D2 OSDR/D5 provenance remains available, Engineer toggle retains selection and full briefing. Native guide disclosure was exercised.
- A save produced before these changes was restored byte-for-byte. Guided progress also resumed after refresh in the final build at all four language/size combinations.
- Screenshots were inspected, including D5 before/after, both-language comparisons and the narrowed Azerbaijani battery/unit layout. Temporary QA scripts and captures are under `/tmp/outpost-polish-*`; they are not shipped game assets.

- Final interaction checks: D2 exercise state survived Cadet/Engineer switching; applying D2-B changed the selected branch phase while preserving Run A and every other recorded phase. Arrow movement, rover boarding and keyboard dismount worked. Sunlight height controls, Sun animation, optional 3D canvas and Mars entry/close/reopen passed smoke checks. These were targeted preservation checks, not an exhaustive repeat of the prior audit.

All browser checks in this session reported no console errors or uncaught page errors. The unchanged full Mars route, every field collectible, disabled WebGL and real-GPU performance were not retested. This is not evidence that unfamiliar children understand the lesson unaided.

## Remaining weaknesses and release-candidate assessment

The highest-value remaining work is an observed first-time learner check: can an unfamiliar child predict, choose, read the result, rewind and explain one benefit and one cost without coaching? Some optional material remains technical; a bilingual educator should review the wording with learners. Real laptop/GPU performance and public-host loading are not established by local software-WebGL tests.

The game is suitable for a **local technical release candidate**. Public release remains conditional on the existing team/organizer/license gates and verification of the approved artifact on its real host and presentation laptop. This session does not grant publication approval or certify eligibility. No push, deployment, license change or history rewrite was performed.
