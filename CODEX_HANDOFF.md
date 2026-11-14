# OUTPOST REPLAY · event continuation handoff

Updated 14 November 2026. Continue the existing game, not a new engine or roadmap.

**Latest follow-up:** independent audit on `codex/protect-progress-and-sharing`, starting from confirmed clean HEAD `6977994`. Read [INDEPENDENT_AUDIT_2026-11-14.md](INDEPENDENT_AUDIT_2026-11-14.md) for confirmed defects, fixes, current verification and limits. Added validated versioned input autosave/resume (including Mars), one-time replay-link import, readable EN/AZ guided labels, recorded-result debriefs, accurate science wording and a verified migrated DONKI endpoint. All 63 tests, typecheck, production build and diff check pass. No simulation equation, parameter, score, dependency or license changed. The commit containing this update saves the audited fixes locally; see `git log -1 --oneline`. Organizer/eligibility, learner evaluation, license and approved public-host gates remain open. Earlier verification below is historical.

**Next small development task:** observe 3–5 unfamiliar students (ages 7–12) and an educator playing EN/AZ modes without guidance to identify any remaining friction, and confirm organizer rules/license/public URL before submission.

## Current state

- Workspace: `/home/kanan/Desktop/outpost-replay-practice`.
- Branch: `codex/protect-progress-and-sharing`. Audit baseline `6977994`; earlier preservation baseline `35f3349` retains Argon work and rendering/recovery checkpoint **`8ace633`** follows it. Inspect `git status` and `git log` before editing.
- All earlier M0–M6, science/resource/replay corrections and existing graphics remain in ancestry. No merge, force-push, remote publication or deployment occurred.
- The interrupted Opus geometry failure is resolved; do not resume its old terrain-fitted-ray implementation. Original interrupted files/patch were archived under `/tmp/outpost-recovery-2026-11-14/` (temporary recovery files, not the primary Git backup).

## Implemented event work

1. Procedural 3D relief, props and controls retained. Separate two-height horizon diagram follows the unchanged index with a fixed Sun, explicit partial states and not-to-scale/linear-index limitations. No false ray forced through artistic geometry. Rim camera no longer clips enormous labels; Sun animation preserves orbit.
2. Per-panel lazy retry remounts the error boundary/component; persistent failure offers Reload with an unsaved-progress warning. Transient and persistent HTTP503 chunk failures were exercised in a separate local QA fixture, not added to the product.
3. D2's incorrect36h wording now accurately says hours24–48 in EN/AZ.
4. Launch's primary action is **Start guided experiment**; full mission, science and Mars remain available. Actual D3 battery, science and low-reserve duration are clearer in the guided result. No simulation/score/input-schema/dependency changes.
5. SUBMISSION_KIT.md contains copy-ready project drafts and provisional recording/slide guidance, provenance, disclosure drafts, a learner-check protocol and release gates. Review it with the team; do not assert its unperformed activities as completed.

## Historical verification before this independent audit

- `npm test`: **56 passed** (27simulation,9replay,9science,11rendering). Covers conservation, crops/ice, immutable replay, unequal mission durations, Mars and all-degree horizon/model correspondence.
- `npm run typecheck`, `npm run build`, `git diff --check`: passed. Existing large Phaser chunk warning and Three Clock deprecation remain.
- Local production Chromium, confirmed1366×768 and1600×900; EN/AZ, Cadet/Engineer, both demo strategies and replay, prediction, full-mission entry, walking, rover/driving/dismount, manual D1-B Apply, 3D heights/sites/partial/equal states/restart/rim/orbit/animation. Normal gameplay tab error log empty. Injected failures produce expected errors only in the recovery-test tab.
- Demo anchors:19.9/43.9kWh at hour120; both end216h; scores54/66; whole-mission low reserve97/0h; science−14. Reverse A/B reverses signs. D3-only science gains20/4 and low-reserve1/0h are different quantities.
- Not newly certified: all optional field tasks through the browser, full manual mission route, disabled-WebGL path, physical integrated-GPU FPS/memory, live DONKI success, public-host cold load, user learning outcomes or eligibility.

## Architecture and science

Read CLAUDE_HANDOFF.md for the established architecture/file map and NASA_SCIENCE.md for the source ledger. React18/TypeScript/Vite6/Tailwind4, Phaser4.2.1, Three/Fiber/Drei, Recharts. Static build, Node22+, no backend or private API key required. Deterministic hourly engine and recorded replay inputs are the core invariant.

Published NASA BVAD/LCROSS reference values and LOLA-derived study results are separate from the procedural relief, scripted mission conditions and classroom radiation scaling. NOAA's207pfu is a near-Earth measurement. DONKI FLR is optional catalog context, never proton flux/dose. Greenhouse, fuel-cell chemical closure, battery losses and water recovery remain simplified. Do not call this a validated lunar digital twin or crew-exposure forecast.

## Next actions in order

1. Team: confirm current Universal submission rules/time zone and written prior-work eligibility; approve authorship/license and required source access. No default team permission has been invented.
2. Observe3–5 unfamiliar players and, if possible, an educator using the existing experiment. Record anonymous actual results; choose any further UI fix from observed confusion. Do not claim proven learning gains.
3. Review SUBMISSION_KIT.md, finalize team/AI/resource fields, record actual gameplay under confirmed limits and prepare backup. Do not include identifiable minors in submission media.
4. After explicit publication approval, follow COMPETITION_READINESS.md: regenerate notices, rebuild, upload only `dist/`, retain the prior artifact, verify public HTTPS without login, both languages/modes, full demo and shared replay links. No public URL has been verified in this pass.

Commands: `npm ci` only on a fresh install; otherwise `npm test`, `npm run typecheck`, `npm run build`, `npm run preview`. `node scripts/prepare-notices.mjs` before approved release packaging. Keep notices and source citations.

## Restrictions

Preserve completed work and current art. No new engine, dataset, dependency or media integration merely to increase feature count. Keep simulation/replay deterministic; do not change numerical models or balance without a specific justified request. Never reset/revert other agents' work, commit secrets, force-push, choose a team license, publish or deploy without authorization. Use actual current checks, not historical test claims.

Continuation prompt: “Read CODEX_HANDOFF.md, current Git status and the latest log. Preserve the verified event checkpoints. Address the first unresolved release task using actual organizer/team input; do not rebuild the application or repeat completed research. Report evidence and remaining gates, and save verified local changes without pushing or deploying.”
