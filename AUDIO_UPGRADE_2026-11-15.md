# OUTPOST REPLAY — audio and atmosphere upgrade

Starting checkpoint: clean `8804322` on `codex/protect-progress-and-sharing`, confirmed present. This is a local audio upgrade; no push, deployment, license or repository-visibility change is authorized or performed.

> [!NOTE]
> **Historical `8804322` audio report — later extended cleanly in `649fbf9` (PR `#4`).** Subsequent work replaced discrete rover chirps with continuous structure-borne dual-oscillator rover motor synthesis and hardened `window.blur` key/audio lifecycle handling (`82` passing tests), and published the verified public build at <https://newgenzzz.github.io/outpost-replay-team/>. Listening on physical presentation hardware remains recommended before recording the submission video. See [Listening review required](#listening-review-required).

## Contents

- [Existing problems addressed](#existing-problems-addressed)
- [Soundtrack and effects](#soundtrack-and-effects)
- [Controls and lifecycle](#controls-and-lifecycle)
- [Verification](#verification)
- [Listening review required](#listening-review-required)
- [Files changed](#files-changed)

## Existing problems addressed

The existing `soundFX` engine played a single 58 Hz ambient oscillator, routed effects straight to the destination, lacked persisted level controls and did not stop active effect nodes when muted. It had no visibility/unmount lifecycle. Drilling requested a sound every frame. Timeline browsing could repeat shadow/storm alerts; ordinary branch Apply and opening the result drawer could sound like an actual rewind. Guided/failure results lacked corresponding completion feedback. Sample discovery could ping both in its collection event and when the modal mounted. Phaser also created its own unused audio context.

## Soundtrack and effects

The same Web Audio engine now owns one lazy audio context and master/music/effects buses. No external audio asset or runtime dependency was introduced. The original procedural composition uses four-chord progressions, eight-note melodic phrases, sine/triangle harmonics, soft attacks/releases and a low pulse. A short lookahead schedules notes on the audio clock. Menu is slower and omits the pulse; exploration adds a gentle pulse; critical uses a different harmonic/melodic pattern. Scene changes fade active notes for half a second and discard future notes from the old scene. Independent review caught and corrected a potential pre-start gain spike during fades.

Ordinary UI sounds are short and quiet; launch, backup, battery, storm, rewind and completion cues are differentiated. Drilling is limited to one pulse per 150 ms; other repeated effects have cooldowns. Finite sources disconnect after ending. There is one music scheduler; no recorded loop boundary or downloaded track is involved.

Lunar music follows the **latest computed run's** battery, life support, scenario dose warning and abort state, independently of which historical phase is being inspected. Menu overrides the run state. Mars uses its own existing result classification. Pending crisis warnings fire when a new phase is reached, not when revisiting history. Committed decisions emit one prioritized outcome cue; actual rewind has its own cue. The pending-storm tick is a stylized suit warning for a nonzero training scenario, not a live dosimeter. Existing visual warnings remain unchanged.

The music and feedback do not represent external sound in lunar vacuum. The settings explain the music/suit/radio framing. No scientific equation, parameter, balance, outcome, provenance or replay calculation changed. The added world-snapshot audio flag is presentation-only and is not part of saved mission inputs.

## Controls and lifecycle

- Compact HUD quick mute and settings controls, plus a launch-screen settings button. These are the related visual changes; no new gameplay panel or graphics system was added.
- Bilingual, keyboard-operable native sliders for Master, Music and Effects, percentage readouts, mute, close, Escape and outside dismissal. Settings pause world controls and preserve focus within the dialog.
- Immutable bounded preferences in the separate versioned local key `outpost_audio_preferences_v1`; defaults: master .8, music .5, effects .75, unmuted. Invalid/unavailable storage falls back safely. Existing mission-save format is unchanged.
- No context or queued feedback before genuine pointer/keyboard activation. Master mute and master 0 stop active/scheduled voices and pending speech. Unmute restores the stored levels/current scene. Music 0 stops its scheduler while effects remain independent.
- Hidden/page lifecycle suspends audio and cancels speech/notes/timers; visible resume uses the existing context. Unmount disposal closes it and removes listeners. Unsupported audio does not block play. Phaser's unused sound manager is disabled.
- Radio uses master × effects volume, ducks music, cancels stale callbacks, and stops when its console closes/changes phase. No matching Azerbaijani voice means telemetry punctuation instead of mispronounced speech. Mars radio UI timers are cleared on reset, rewind and unmount.

## Verification

`npm test`: **79 passed** — all 63 existing tests plus 13 audio settings/graph/lifecycle regressions and 3 mission-audio policy tests. Coverage includes immutable preferences, blocked storage, no pre-gesture context, channel routing, finite-node cleanup, mute/hidden/disposal, cancelled speech callbacks, denied resume, missing voice/API, zero-volume startup recovery, rate limits, future-note cancellation, fades and result-based cue selection. `npm run typecheck`, `npm run build` and `git diff --check` passed. The existing large Phaser build warning remains.

Production Chromium checks performed:

- Fresh load: no audio context or audible output before interaction; then exactly one running context and one music scheduler.
- Live output sampling confirmed music activation, silence on mute/master 0/music 0, restored music after unmute, and independent effect preferences. Levels and mute survived refresh; refresh again started without a context until interaction.
- Settings in EN/AZ at **1366×768 and 1600×900**: three labeled sliders, percentage values, bounded layout, keyboard focus and Escape dismissal back to launch. HUD mute was also checked during gameplay.
- Controlled visibility event in the browser: actual context suspended and music scheduler stopped; visible resume returned to one context/scheduler. This is not certification of every operating-system sleep/background behavior.
- Actual Guided drilling result selected critical music and exactly one battery warning; rewind feedback occurred at the branch transition and did not repeat when merely reopening results. Default 19.9/43.9 kWh behavior was retained. Six repeated menu/resume cycles retained one context, one scheduler and bounded active voices.
- An actual six-phase abort emitted the failure phrase. Closing radio advice before its delayed response cancelled speech and fallback/outro cues. A separate browser context with unavailable Web Audio and throwing preference storage still completed the Guided backup route without errors.
- Mars smoke check completed three successful Sol decisions, rewound to Sol 2, and checked radio timer cancellation on phase change/close; the returning lunar view retained one context and one scheduler.
- A listening sample captured menu → exploration → critical. Sampled peak during the tested mix/navigation was approximately **0.079** on the normalized digital scale; no clipping was observed in this test. This is not an acoustic loudness or hearing-safety measurement.

Firefox 157 basic smoke: initial context count 0; settings activation created one running context with three sliders; mute preference persisted; refresh restored mute and again created no context before interaction. The full language/viewport/gameplay matrix was performed in Chromium, not Firefox.

These browser checks reported no uncaught page errors or console errors.

## Listening review required

Subjective musical quality was **not assessed by listening**. An automated waveform/graph check cannot establish that the soundtrack is pleasant, memorable, professionally mixed or suitable for every learner. A short original WebM/Opus preview was captured as a separate QA artifact, not shipped in the game. Please listen on the actual presentation laptop and headphones before release.

1. Open the local production preview, initially untouched: it should be silent. Interact with the launch screen and listen to the menu for at least 20 seconds.
2. Open Audio settings. Start at 80% Master, 50% Music, 75% Effects, with the device volume low. Check that music is audible but leaves room for spoken explanation.
3. Start a Guided Experiment, then the shadow test. Compare drilling and backup. Listen for a clear battery warning with the existing visual alert, a restrained critical texture, and a distinct rewind cue.
4. Mute during playback: all game sound should stop. Unmute: previous levels return. Set Music to 0 and retain effects, then restore it. Try radio advice, movement, rover and drilling.
5. Hide/return to the tab and repeat menu/game navigation. Listen for clicks, abrupt transitions, fatigue, imbalance, delayed speech or duplicate layers.

Please report whether the music is too quiet/loud, repetitive or distracting, and whether warning/rewind/confirmation cues are easy to tell apart. Real learner listening, physical speaker/headphone balance, all installed voices, prolonged GPU/audio load and operating-system background behavior remain unverified. Existing eligibility/license/public-release gates remain open.

## Files changed

`src/utils/soundEffects.ts`; new `src/utils/missionAudio.ts`; new `src/components/AudioSettings.tsx`; `src/App.tsx`; `src/components/{MissionLaunchScreen,MarsBonusModal,SampleDiscoveryModal}.tsx`; `src/game/PhaserWorld.tsx`; `src/game/LunarWorld.ts`; `src/game/world.ts`; new `tests/{audio,missionAudio}.test.mjs`; `package.json` test command; `README.md`; `CODEX_HANDOFF.md`; this report. No dependency lockfile, scientific data, engine-model or licensing file changed.
