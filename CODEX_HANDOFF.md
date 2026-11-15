# OUTPOST REPLAY · event continuation handoff

Updated 15 November 2026. Continue the existing game, not a new engine or roadmap.

> [!IMPORTANT]
> **Local checkpoint; later commits add the approved license and GitHub Pages work.** This handoff made no push, publication or deployment. Recheck Git history for current repository and deployment state. Eligibility and public-host verification remain open.

**Latest follow-up:** original adaptive procedural audio and persisted master/music/effects controls, starting from clean `8804322` on `codex/protect-progress-and-sharing`. Read [AUDIO_UPGRADE_2026-11-15.md](AUDIO_UPGRADE_2026-11-15.md) for implementation, actual browser/test evidence and the required manual listening review. Existing soundFX is the sole sound engine; no external audio or dependency was added. All 79 tests, typecheck, build and diff check pass. Equations, parameters, outcomes, NASA provenance and saved mission inputs are unchanged.

[Player experience work](PLAYER_EXPERIENCE_2026-11-15.md) and the [independent audit](INDEPENDENT_AUDIT_2026-11-14.md) remain the prior references. This checkpoint is local only; no new push or deployment occurred. See `git log -1 --oneline`. Earlier verification below is historical.

**Next small development task:** listen to the soundtrack on the presentation laptop and headphones using the audio report's checklist, then observe 3–5 unfamiliar students (ages 7–12) and an educator playing EN/AZ modes without guidance. Confirm organizer rules/license/public URL before submission.

## Contents

- [Current state](#current-state)
- [Implemented event work](#implemented-event-work)
- [Historical verification before this independent audit](#historical-verification-before-this-independent-audit)
- [Architecture and science](#architecture-and-science)
- [Next actions in order](#next-actions-in-order)
- [Restrictions](#restrictions)
- [Continuation prompt](#continuation-prompt)

## Current state

- Workspace: current local checkout. The previous session recorded `/home/kanan/Desktop/outpost-replay-practice`.
- Branch: `codex/protect-progress-and-sharing`. Audit baseline `6977994`; earlier preservation baseline `35f3349` retains Argon work and rendering/recovery checkpoint **`8ace633`** follows it. Inspect `git status` and `git log` before editing.
- All earlier M0–M6, science/resource/replay corrections and existing graphics remain in ancestry. No merge, force-push, remote publication or deployment occurred.
- The interrupted Opus geometry failure is resolved; do not resume its old terrain-fitted-ray implementation. Original interrupted files/patch were archived under `/tmp/outpost-recovery-2026-11-14/` (temporary recovery files, not the primary Git backup).

## Implemented event work

1. Procedural 3D relief, props and controls retained. Separate two-height horizon diagram follows the unchanged index with a fixed Sun, explicit partial states and not-to-scale/linear-index limitations. No false ray forced through artistic geometry. Rim camera no longer clips enormous labels; Sun animation preserves orbit.
2. Per-panel lazy retry remounts the error boundary/component; persistent failure offers Reload with an unsaved-progress warning. Transient and persistent HTTP 503 chunk failures were exercised in a separate local QA fixture, not added to the product.
3. D2's incorrect 36 h wording now accurately says hours 24–48 in EN/AZ.
4. Launch's primary action is **Start guided experiment**; full mission, science and Mars remain available. Actual D3 battery, science and low-reserve duration are clearer in the guided result. No simulation/score/input-schema/dependency changes.
5. SUBMISSION_KIT.md contains copy-ready project drafts and provisional recording/slide guidance, provenance, disclosure drafts, a learner-check protocol and release gates. Review it with the team; do not assert its unperformed activities as completed.

## Historical verification before this independent audit

- `npm test`: **56 passed** (27 simulation, 9 replay, 9 science, 11 rendering). Covers conservation, crops/ice, immutable replay, unequal mission durations, Mars and all-degree horizon/model correspondence.
- `npm run typecheck`, `npm run build`, `git diff --check`: passed. Existing large Phaser chunk warning and Three Clock deprecation remain.
- Local production Chromium, confirmed 1366×768 and 1600×900; EN/AZ, Cadet/Engineer, both demo strategies and replay, prediction, full-mission entry, walking, rover/driving/dismount, manual D1-B Apply, 3D heights/sites/partial/equal states/restart/rim/orbit/animation. Normal gameplay tab error log empty. Injected failures produce expected errors only in the recovery-test tab.
- Demo anchors: 19.9/43.9 kWh at hour 120; both end 216 h; scores 54/66; whole-mission low reserve 97/0 h; science −14. Reverse A/B reverses signs. D3-only science gains 20/4 and low-reserve 1/0 h are different quantities.
- Not newly certified: all optional field tasks through the browser, full manual mission route, disabled-WebGL path, physical integrated-GPU FPS/memory, live DONKI success, public-host cold load, user learning outcomes or eligibility.

## Architecture and science

Read CLAUDE_HANDOFF.md for the established architecture/file map and NASA_SCIENCE.md for the source ledger. React 18 / TypeScript / Vite 6 / Tailwind 4, Phaser 4.2.1, Three/Fiber/Drei, Recharts. Static build, Node 22+, no backend or private API key required. Deterministic hourly engine and recorded replay inputs are the core invariant.

Published NASA BVAD/LCROSS reference values and LOLA-derived study results are separate from the procedural relief, scripted mission conditions and classroom radiation scaling. NOAA's 207 pfu is a near-Earth measurement. DONKI FLR is optional catalog context, never proton flux/dose. Greenhouse, fuel-cell chemical closure, battery losses and water recovery remain simplified. Do not call this a validated lunar digital twin or crew-exposure forecast.

## Next actions in order

1. Team: confirm current Universal submission rules/time zone and written prior-work eligibility; approve authorship/license and required source access. No default team permission has been invented.
2. Observe 3–5 unfamiliar players and, if possible, an educator using the existing experiment. Record anonymous actual results; choose any further UI fix from observed confusion. Do not claim proven learning gains.
3. Review SUBMISSION_KIT.md, finalize team/AI/resource fields, record actual gameplay under confirmed limits and prepare backup. Do not include identifiable minors in submission media.
4. After explicit publication approval, follow COMPETITION_READINESS.md: regenerate notices, rebuild, upload only `dist/`, retain the prior artifact, verify public HTTPS without login, both languages/modes, full demo and shared replay links. No public URL has been verified in this pass.

Commands: `npm ci` only on a fresh install; otherwise `npm test`, `npm run typecheck`, `npm run build`, `npm run preview`. `node scripts/prepare-notices.mjs` before approved release packaging. Keep notices and source citations.

## Restrictions

Preserve completed work and current art. No new engine, dataset, dependency or media integration merely to increase feature count. Keep simulation/replay deterministic; do not change numerical models or balance without a specific justified request. Never reset/revert other agents' work, commit secrets, force-push, choose a team license, publish or deploy without authorization. Use actual current checks, not historical test claims.

## Continuation prompt

> “Read CODEX_HANDOFF.md, current Git status and the latest log. Preserve the verified event checkpoints. Address the first unresolved release task using actual organizer/team input; do not rebuild the application or repeat completed research. Report evidence and remaining gates, and save verified local changes without pushing or deploying.”
