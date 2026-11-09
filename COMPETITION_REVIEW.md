# Universal Event first-round review · 9 November 2026

User target: Universal Event first stage. Reviewed clean checkpoint `5df32e9`; focused correction continues on `codex/universal-demo-clarity`. No redesign, dependency, simulation, source-data or balance changes.

## Assessment

The strongest differentiator is a controlled engineering experiment: change one recorded choice, preserve other inputs, compare equal-time outcomes, explain the trade-off. The existing stylized world is cohesive enough to support that story. More graphical complexity is not the primary missing evidence. No student/teacher pilot or public-host/presentation-laptop verification is established.

The [official challenge](https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/) asks students to experience competing engineering demands. Current [2026 guidance from a Local Lead](https://www.spaceappschallenge.org/2026/local-events/ajmer/) names impact, creativity, validity, relevance and presentation, but this is not verified Universal judging guidance or a weighting. Direct retrieval of the current Universal page returned HTTP502; staging/previous-year guides were not treated as current rules. Confirm current Universal submission/video/time-zone requirements with the organizers. The [official event page](https://www.spaceappschallenge.org/2026/) lists Nov14–15 and project submission through the team Project tab.

## Verified issue corrected

Before pressing Rewind, the demo displayed “Run B · Use backup fuel cells” immediately above Run A's drilling result (19.9kWh). The next strategy and completed outcome were visually ambiguous. `src/components/JudgeTourBanner.tsx` now explicitly labels the completed Run A strategy inside its result card and the proposed Run B as “Next experiment” / “Növbəti sınaq.” Handles either initial strategy. No numbers/calculation changed.

## Three improvements to prioritize next

1. **Make the first experiment obvious.** The opening describes the nine-day setting and offers several destinations, but replay's learning payoff arrives later. Cadet decisions still show story, four metrics, hints, a station task, hypothesis and ledger. Test a shorter path using existing Guided Demo/prediction: goal → prediction → decision → consequence → change one choice. Keep detailed engineering optional and retain direct full-mission access. Use existing prediction infrastructure rather than adding another quiz. Suggested acceptance target, not a measured result: a newcomer can complete one comparison in two minutes and explain both a benefit and a cost without help.
2. **Make visual polish explain the trade-off.** Preserve world art and circular relief. Default a teaching demonstration to a paused, meaningful Sun position with a clear question about low versus tall panels. During review the auto-animated Sun reached a state where both indices were100%, obscuring the height lesson; the existing128° preset shows0%/100% illustrative indices. Emphasize the Sun, ridge and selected mast and reduce competing labels. Any explanatory inset must agree with the existing exaggerated teaching calculation; artistic shadows remain separate from that calculation and actual NASA terrain. Use existing state-linked world feedback; add emphasis only where observation shows players miss it. No real illumination prediction or new effect should be invented.
3. **Demonstrate learning and friction-free access.** Observe5–8 first-time players plus a teacher using existing features. Record assistance, successful first comparison and an explanation of battery→water-recovery coupling. Report sample size and raw results without claiming proven learning gains. Produce one short teacher activity and demonstrate EN/AZ access. After approval, verify the exact public build, replay links and actual presentation laptop; retain a local HTTP preview and recording. Starting Guided Demo immediately replaces an active mission, so a small progress-loss warning/export route merits a separate focused improvement. No full autosave system is required for this review.

## Judge story

Lead with: “Students can earn more science while putting life-support reserves at risk. We let them rewind a choice and test why.” Show drilling19.9kWh versus backup43.9kWh at hour120; same216h endpoint, low-reserve97/0h, science−14. Distinguish this model result from real lunar exposure predictions. Show one published-data→model→decision chain using the existing S/C1 planner. [Gläser Table2](https://ntrs.nasa.gov/api/citations/20170007365/downloads/20170007365.pdf#page=12) supports why higher mean illumination need not mean shorter maximum darkness. An internal three-minute script exists in JUDGE_DEMO.md; its duration is not an official Universal limit.

## Actual verification and limits

- Fresh final checks:51 tests passed (27 simulation,9 replay,8 science,7 rendering); TypeScript and production build passed; existing Phaser chunk warning remains.
- Production Chromium: EN1366×768 first D1 Apply, forecasts/debrief, procedural3D pause/Sun-slider/mast interaction; full drilling-first demo and matched-time comparison. AZ1600×900 backup-first demo, readable revised labels/screenshot and inverse comparison. Both216h endpoints, scores54/66 and low-reserve97/0h preserved. Inspected final error logs empty;1600px body and scroll widths matched.
- No fresh full manual mission, all optional tasks/Mars, physical integrated-GPU FPS/memory or public-host test. No student learning outcomes measured. No guarantee of advancement.
- Existing eligibility/prior-work clearance, team license/inherited-asset provenance, final current rules and publication approval remain release gates. No push, merge, publication or deployment.

Avoid: graphics/engine rebuilds, more unrelated missions, extra plugins without a measured need, large DEM downloads, dependency upgrades just to remove warnings, or unapproved dose/biological/chemical balance changes. Preserve scientific labels and existing replay integrity. See CLAUDE_HANDOFF.md and NASA_SCIENCE.md for the established architecture and research.
