# Company — CURRENT TASK

Status: READY
Task ID: company-r3-current-scene-timeline-residue-v1
Mode: FREEZE ACCEPTED R3 PRODUCT -> TRACE NORMAL-SURFACE HISTORY DUPLICATION -> LATEST-CURRENT-SCENE ONLY -> FRONTEND TEST DEPLOY -> BARE-PUBLIC ACCEPTANCE
Updated: 2026-08-24 00:59 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`
Previous terminal: Issue #68 comment `5386905332`
Operator review: Issue #68 comment `5386933280`
Owner manual-play authority: Issue #68 comment `5384780073`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK path. Do not create a new ops/recovery branch. Work on `main` only.

## 0. Accepted baseline — freeze

Accepted executable/source before this cut:
- `dd3eef3df57707cfc801c93f4b5444d49a822319`

Current main before this registration:
- `6fb1614d9a0e0a91028a4baaacce88a577170c73`
- docs-only descendant of the accepted executable; no later executable drift.

Current accepted TEST artifacts:
- API `game-proxy-company-r3` version `82be1bb0-34f6-4c0d-87a8-5db34fdb288b`
- Frontend `gamebuilder-company-r3` version `3f4b6c4f-4201-4ca5-8800-cbf2fe9137a0`
- bare public frontend `https://gamebuilder-company-r3.zeroslove.workers.dev`

Fresh media acceptance fixture — READ ONLY:
- `04408c93-13e7-4fb6-a840-06e11fabe870`

Freeze all previously accepted product behavior, including:
- first-day/first-arrival Opening and selected department/rank preservation;
- exact player agency, target/action/refusal/self-state/topic/intent authority;
- canonical navigation/location/presence behavior;
- committed player inner thought and character-specific first-person Mind Monitor;
- Story-owned exact four choices and accepted formatting variants;
- chronological CSA APPLY/CHANGE/REMOVE, one operation = one normal Story turn;
- high-parity five-tab CSA draft/apply UI and one-pending-operation behavior;
- ordinary post-CSA turns without stale `csa_operation`;
- same-game reset runtime GREEN; native-confirm automation remains separately deferred and must not be reopened here;
- approved deterministic image projection;
- grounded turn-scoped focal/dialogue projection in `observer_applied`;
- character-aware R3 server TTS through `TTS_WORKER -> fancy-dust-7f8c`;
- TTS OFF => zero calls; no narrator/player/private-thought/Mind Monitor synthesis;
- replay/cache/stale fencing/fail-open media behavior;
- browser `speechSynthesis` / `SpeechSynthesisUtterance` remains absent from R3 product path;
- desktop/mobile core controls and refresh/re-entry behavior.

Media cut validation already accepted:
- focused `test/r3-approved-media.test.mjs`: 7/7 PASS;
- full `npm.cmd test`: 528/528 PASS;
- syntax/diff checks PASS;
- bare-public image + TTS OFF/ON + replay/refresh + 390x844 mobile GREEN.

Do not redesign or re-open any frozen subsystem in this task.

## 1. Exact remaining owner defect

Owner authority `5384780073` requires the normal gameplay surface to present the current scene cleanly:
- Opening/early-turn cards must not remain as stray residual content after later turns;
- History must remain available through the intended History presentation;
- the current Story must not be duplicated as both a history card and current-turn Story.

Current source evidence at accepted executable `dd3eef3...`:
- `frontend-r3/r3-view-model.js` correctly preserves `view.history = turns` as committed presentation/history data;
- `frontend-r3/app.js::renderContext()` currently executes `renderHistory($('#story-history'), view.history, ...)`, rendering the full committed chronology into the normal gameplay story panel;
- the same function then takes `latest = view.history.at(-1)` and renders that same latest Story again into `#current-story`;
- `frontend-r3/openHistory()` already renders the full history separately into `#history-list` inside the dedicated History overlay;
- exports also use committed `context.turns` independently.

Therefore the leading root-cause hypothesis is presentation duplication in the normal frontend shell, not server chronology/persistence corruption.

This cut is presentation-only. Do not change persisted turns, committed history, Story/Observer/reducer semantics, or History export authority.

## 2. Mandatory pre-edit live trace

Before editing source, use the accepted bare-public TEST deployment and inspect fixture `04408c93-13e7-4fb6-a840-06e11fabe870` READ ONLY where possible.

Record:
1. current committed turn and `context.turns` count;
2. normal gameplay `#story-history` child/`.turn-card` count;
3. normal gameplay `#current-story` visible latest Story identity/text sample;
4. whether the latest committed Story appears both in `#story-history` and `#current-story`;
5. whether Opening and earlier ordinary turn text remain visibly present in the normal story panel after later commits;
6. History overlay `#history-list` count/order and whether it correctly contains the full chronology;
7. behavior after refresh/re-entry.

Do not mutate that fixture. If browser inspection of the old fixture is unavailable, create one fresh disposable game solely for reproduction before editing.

If live evidence disproves the source hypothesis, stop and classify the actual first presentation boundary before patching. Do not blindly hide content.

## 3. Correction contract — normal surface latest-only

Goal: normal gameplay presents exactly the current/latest Story scene. Full chronology remains available only through the dedicated History UX/export.

Preferred minimal correction:
- stop rendering committed `view.history` into `#story-history` during normal `renderContext()`;
- clear or keep `#story-history` empty/non-authoritative on normal gameplay renders;
- keep `#current-story` as the sole normal-surface Story container for the latest committed Story and current streaming deltas;
- keep `view.history`, `context.turns`, `renderHistory()`, History overlay, MD/TXT export, server readback, and persistence unchanged.

Required behavior:
- Opening: current Story shows Opening once;
- after Turn 1 commit: current Story shows Turn 1 once; Opening is no longer visible in normal story surface;
- after Turn 2+: current Story shows latest turn once; prior turns are not normal-surface cards;
- during streaming: deltas appear only in `#current-story` and do not resurrect committed history cards;
- after commit/reconciliation: latest committed Story replaces the streamed preview cleanly;
- refresh/re-entry: same latest-only normal surface reconstructs from committed context;
- feedback revision: revised latest Story replaces current Story without creating duplicate old/new revision cards on normal surface;
- failed/pending turn recovery: previously committed history does not reappear as normal-surface residue;
- History overlay: Opening + every committed ordinary turn remain available in canonical order;
- History export remains complete;
- no gameplay data is deleted or truncated.

Do not remove `view.history` from the view model merely to hide it.
Do not delete server turns.
Do not change history API/readback.
Do not change Story text, parser, choices, TTS/media, or state authority.
Do not redesign the narrative card style or choice presentation beyond what is necessary to remove timeline duplication.

If `#story-history` is retained in HTML for shell compatibility, it may remain empty/hidden in normal play. Prefer the smallest source correction over broad DOM/CSS deletion.

## 4. Deterministic regressions

Add/adjust focused frontend tests proving at minimum:
1. context with Opening only => normal surface shows Opening exactly once;
2. context with Opening + Turn1 => normal surface contains only Turn1 Story, not Opening history card;
3. context with Opening + Turn1 + Turn2 => normal surface contains only Turn2 Story, not earlier cards;
4. latest Story is not duplicated between `#story-history` and `#current-story`;
5. `#story-history` stays empty/non-authoritative across repeated `renderContext()`/refresh reconciliation;
6. History overlay still renders the full committed chronology in order;
7. History export source still contains full `context.turns`;
8. streaming deltas target current Story only;
9. feedback committed revision replaces current Story without normal-surface duplicate revision residue;
10. failed/pending recovery reconciliation remains latest-only;
11. media/image/TTS controls and current committed projection remain unaffected;
12. choices/direct input remain reachable and exact-literal dispatch unchanged;
13. frozen CSA/draft/reset contracts remain GREEN;
14. mobile layout does not acquire overflow from the correction.

Run:
- focused R3 frontend/render/history tests;
- full `npm.cmd test`;
- changed JS/MJS `node --check`;
- `git diff --check`.

Do not weaken existing tests merely to make this presentation change pass. Rewrite only assertions that explicitly encoded the now-rejected normal-surface full-history duplication.

## 5. TEST deployment

This should be a frontend-only cut unless the mandatory trace proves otherwise.

Expected changed artifact:
- `gamebuilder-company-r3` only.

Do NOT redeploy API merely for symmetry if API source/config is unchanged.
Keep API version `82be1bb0-34f6-4c0d-87a8-5db34fdb288b` active if unaffected.

No Production.
No migration/schema/RPC.
No provider/model/config change.
No TTS binding change.
No owner/preserved-game mutation.

Record exact source SHA and exact deployed frontend Worker version.

## 6. Mandatory bare-public acceptance

Use only:
`https://gamebuilder-company-r3.zeroslove.workers.dev`

No `?api=` override.
No storage preseed.
No direct-API gameplay substitute.
Fresh disposable TEST game for mutable acceptance.
Never mutate owner game `9fcd5ab5-eb13-4971-8fca-9fec20a1d531`.

### Gate A — normal latest-only chronology

Create visible Setup -> Opening -> at least 4 ordinary committed turns.

After each commit inspect normal gameplay surface.
Require:
- Opening visible once at Turn0;
- Turn1: Opening absent from normal Story surface, Turn1 current Story visible once;
- Turn2–Turn4: only latest Story visible in normal Story surface;
- `#story-history` contains no committed turn cards / stale old Story text;
- latest Story is not duplicated;
- four choices/direct input remain usable;
- no blocking console/network error.

### Gate B — History overlay integrity

At Turn4 open visible `플레이 기록`.
Require:
- History overlay contains Opening + Turns1–4 exactly once each in canonical order;
- literal actions/story summaries remain available as previously supported;
- closing History returns to unchanged latest current scene;
- opening History does not resubmit or mutate gameplay.

### Gate C — refresh/re-entry

Refresh/re-enter the same fresh game.
Require:
- committed Turn4 remains authority;
- normal Story surface still shows only Turn4/current latest Story;
- Opening/Turns1–3 do not reappear as normal residue;
- History overlay still reconstructs all five committed entries;
- choices, player thought, Mind Monitor, image/TTS projection remain coherent with latest committed turn where eligible.

### Gate D — one more turn after refresh

Commit Turn5 after refresh via visible direct input or choice.
Require:
- Turn5 becomes the sole current Story;
- Turn4 moves only to History overlay, not normal story residue;
- exactly one gameplay commit/request;
- no duplicate media/TTS synthesis caused by the timeline change.

### Gate E — mobile 390x844

On the same accepted frontend at approximately 390x844:
- latest current Story, image/Mind Monitor/player thought, four choices, direct input, TTS controls, and History button reachable;
- History overlay usable and closable;
- no old turn cards consuming the normal scene vertically;
- no horizontal overflow/blocking overlay.

Do not reopen native reset-confirm acceptance in this cut.

## 7. GREEN definition

GREEN only if:
- root cause is reproduced or otherwise directly proven;
- normal gameplay is latest-current-scene only;
- full committed chronology remains intact in History overlay/export/readback;
- refresh/re-entry and post-refresh next turn remain latest-only;
- no gameplay/state/Story/Observer/media/TTS authority change;
- desktop and mobile pass;
- full tests pass;
- no Production/migration/provider/model/owner-game mutation.

Do NOT claim owner-ready on completion.

If GREEN, the only planned next stage is a separate operator-registered final holistic owner-style long-play acceptance across all frozen features. Do not create or start that next task yourself.

## 8. Terminal handling

On completion:
1. post exact source SHA and changed files;
2. report focused/full test counts;
3. report exact frontend TEST version and unchanged API version;
4. report fresh acceptance game ID;
5. report Gate A–E evidence with turn-by-turn normal-surface counts and History overlay counts;
6. report refresh/re-entry and post-refresh turn evidence;
7. list any remaining defect/blocker honestly;
8. overwrite this SAME `docs/ops/CURRENT_TASK.md` to `WAITING_REVIEW` in place;
9. stop.

Do not create another CURRENT_TASK file/path, branch, PR, next task, or owner-ready handoff.
