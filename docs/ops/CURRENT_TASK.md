# Company — CURRENT TASK

Status: READY
Task ID: company-r3-continuous-autonomous-live-qa-v1
Mode: CONTINUOUS TEST LIVE-QA / FIX / REDEPLOY LOOP
Updated: 2026-08-22
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file or an ops/task-registration branch.

## 0. Owner override

The owner explicitly rejects the previous `WAITING_USER_FINAL_PLAYTEST` gate as premature.

The previous autonomous evidence proved several structural invariants, but it still allowed basic user-visible defects to reach the owner. In particular, the owner encountered a permanent-looking boot/loading fallback immediately on the canonical Owner URL. That defect was objectively discoverable by automation and should never have been delegated to manual owner testing.

Owner policy from now on:

- automation/Codex/Hermes/ChatGPT must catch all objective defects that a competent QA/dev loop can detect;
- owner manual play is reserved for subtle product judgments such as narrative taste, emotional nuance, character appeal, pacing preference, and other genuinely subjective differences;
- basic boot, Setup, buttons, streaming, state, refresh, mobile layout, continuity, CSA, history, TTS, feedback, error handling, latency regressions and durable-data anomalies must be exercised autonomously before owner handoff;
- do not stop after one green campaign. Continue TEST live-play -> inspect -> fix -> redeploy -> replay until objective exit criteria are satisfied;
- no Production access/deploy unless separately authorized.

The durable operating protocol is `docs/ops/AUTONOMOUS_LIVE_QA_LOOP.md` and is binding for this task.

## 1. Binding product authority

Obey, in order:

1. PR #95 product-first Company canon at owner-locked lineage `9d9aec5a198d8673eb37aba8a0541adbd6c84627`;
2. PR #96 A-prime engine/live-first acceptance at `9d44c4719fa6b098d53cac5cf946b93fafa6786b`;
3. `docs/redesign/00_*` through `11_*`;
4. Company v1 UI/content donor snapshot `5ec1a76ac782d3a4fc8042f3d6a62854204b1c84`;
5. current accepted R3 source on main;
6. this owner override and `AUTONOMOUS_LIVE_QA_LOOP.md`.

If an old test, old ops gate, stale compatibility rule or prior handoff convention conflicts with current product authority or this owner override, do not preserve it merely for historical test-count parity.

## 2. Current reviewed implementation identity

Known owner-ready baseline before this override:

- executable main SHA: `b473f7647fd55c5937f15ecf80cc7f159d28f04b`
- later ops normalization SHA: `5df96eaf1b90ec62ec9b276edb8a74e05b5e5132`
- API Worker: `game-proxy-company-r3`
- Frontend Worker: `gamebuilder-company-r3`
- TEST project only: `fmcrspgxstsmxxsmkeee`
- Owner URL: `https://gamebuilder-company-r3.zeroslove.workers.dev/?api=https%3A%2F%2Fgame-proxy-company-r3.zeroslove.workers.dev%2Fapi%2Fr3`

Already landed after the owner exposed the prior boot failure:

- boot fallback dismissal + explicit failure display;
- preservation of the `api=` origin when `game_id` is inserted into the URL;
- choice controls re-enabled after streaming;
- observer/location projection corrections;
- 9-rule CSA controls + prompt contract;
- history and nonblocking speech/TTS sidecars.

Do not assume these are correct because source exists. Re-prove them through the deployed browser.

## 3. Continuous autonomous loop

Run the following loop repeatedly on disposable R3 TEST games. Do not reuse historical/manual/evidence games.

### LOOP A — inspect

1. fetch latest main and latest Issue #68 race/lease state;
2. inspect current deployed API/frontend identity and source ancestry;
3. run the real deployed browser, not only unit/source tests;
4. collect browser console errors, failed network calls, rendered UI state, exact game/turn IDs, DB context/state, Story/observer payloads and latency measurements;
5. compare behavior against product canon and the objective acceptance matrix in `AUTONOMOUS_LIVE_QA_LOOP.md`.

### LOOP B — classify

For each objective defect, classify it as one of:

- frontend boot/render/input/mobile;
- runtime/stream/reconnect/fencing/commit;
- provider prompt/Story semantic contract;
- observer/minimal reducer/state projection;
- continuity/memory/scene_note;
- CSA transaction/scope/clothing/prompt projection;
- sidecar history/TTS/feedback/download;
- DB/RPC/ACL/deployment/config;
- obsolete test/legacy residue.

Do not hide a root cause with retries, extra LLM calls, fuzzy semantic repair, browser-owned orchestration or compatibility layers unless product authority explicitly requires them.

### LOOP C — fix narrowly but completely

1. make the smallest coherent source change that fixes the root cause;
2. add or keep automated regression only when cheap and useful for corruption, literal agency, fencing/reconnect/commit, invalid CSA mutation, boot/navigation, or a concrete live defect;
3. delete/disable obsolete tests if they protect removed behavior instead of changing the product to satisfy them;
4. run focused tests + syntax/diff checks;
5. deploy only exact reviewed TEST artifacts;
6. immediately rerun real deployed browser scenarios.

### LOOP D — expand live coverage

After a fix passes its reproducer, do not stop. Continue a broader campaign so one fix does not mask another defect.

Minimum continuous campaign before any owner handoff:

- fresh Korean Setup in-browser;
- Opening;
- at least 30 ordinary committed turns in one game;
- at least one additional independent 15+ turn game with different route/actions;
- both Story-authored choices and free-form actions;
- deliberate refusal/negative actions and self-directed actions to test literal agency;
- movement across multiple canonical locations;
- named off-scene canonical NPC references without auto-spawn;
- multi-NPC dialogue/entry/exit;
- scene/object/pose continuity over multiple turns, including leave/return when natural;
- refresh after commit and refresh during an active stream/recovery scenario;
- double-submit/concurrent duplicate submission;
- exactly four current choices after successful turns, never stale fallback;
- free input remains available if choice extraction fails;
- relevant-only Mind Monitor; failure remains fail-open;
- all 9 CSA templates apply + narrative effect + remove, with representative valid subject/counterparty scopes;
- CSA changes consume zero gameplay turns;
- clothing-rule continuity where applicable;
- history open/readback and download behavior;
- TTS on/off/replay nonblocking behavior;
- feedback/revision once implemented; if disabled, treat as unfinished product work rather than owner QA responsibility unless canon explicitly defers it;
- desktop plus mobile 390x844 and at least one wider mobile/tablet viewport;
- no permanent loader/fallback; no blocking overlay over streaming Story;
- no uncaught browser exception or failed required request;
- no fabricated/crossed registered identity;
- committed location/presence/scene_note consistent with Story evidence;
- no duplicate committed turn;
- literal player action stored byte/codepoint-equivalent to submitted action.

Continue into a 50-turn campaign when the 30-turn campaign is clean enough to evaluate memory/continuity. Long-play defects should be fixed and replayed, not merely documented for the owner.

## 4. Mandatory human-like browser assertions

A QA script must not declare success from HTTP 200 or DOM existence alone.

For each key page/state, assert what a real user can actually see/use:

- boot fallback disappears within normal boot and does not cover the game;
- Setup modal is visible, scrollable and submittable on mobile;
- after Setup, the actual Company shell is visible rather than a fallback card;
- Story text visibly streams into the Story surface;
- no loader blocks reading while streaming;
- after terminal commit, choice buttons are enabled and clickable;
- each clicked choice submits its full literal source action, not the shortened label;
- free-text input can submit Korean text exactly;
- refresh preserves `api=` and `game_id` and restores the same committed state;
- buttons that appear enabled actually work; disabled features are only allowed when explicitly deferred by canon;
- map click only fills input and does not itself mutate location;
- CSA modal can be opened, configured, applied, read back, removed and closed;
- history shows actual committed turns;
- browser console and network log contain no unexplained required-path errors.

Capture screenshots at meaningful checkpoints and inspect them visually. A screenshot where the game is hidden by a fallback/loader is a hard failure even if background DOM exists.

## 5. Story/play-data review on every campaign

Do not only count commits. Review the actual generated Story and persisted observer/state for semantic defects.

For every campaign sample, inspect:

- exact player action vs Story execution/response;
- whether Story silently substitutes actor/target/action/request/refusal/self-state/intent;
- character names, roles and dialogue identity;
- location and present_actor_ids vs Story;
- scene_note continuity and whether stale physical facts survive incorrectly;
- whether new pose/contact/object facts disappear too early or remain after contradiction;
- whether choice four-pack is useful, current and grounded in the immediately preceding Story;
- whether Mind Monitor is relevant, first-person/natural and grounded rather than invented;
- whether summaries/memory preserve important older facts across the raw-turn window;
- whether Company work texture remains natural rather than becoming mandatory quest/task assistant behavior;
- whether active CSA wording/scope is actually reflected in subsequent Story without auto-generating affection/consent/desire/obedience;
- repeated phrasing, OOC/protocol leakage, assistant-like text, malformed footer, or unexplained scene resets;
- first-token latency, total Story latency, observer tail latency and commit latency. Investigate obvious stalls/regressions rather than passing them because the turn eventually completes.

Record concrete turn IDs and exact evidence for any correction.

## 6. Role split

### ChatGPT operator / normal progress session

- owns product-level review of Issue #68 + live evidence;
- must challenge false-green QA results;
- may reopen CURRENT_TASK when objective gaps remain;
- compares implementation against PR #95/#96 canon and actual play data;
- writes the next exact correction/coverage requirement into this same CURRENT_TASK;
- does not ask the owner to reproduce objective defects that automation can reproduce.

### Codex

- primary implementation + live-test worker;
- continuously executes this task while READY;
- may create disposable TEST games and consume turns freely;
- fixes objective defects, tests, deploys to TEST and reruns live browser campaigns;
- does not stop after a single fix if more objective coverage remains;
- posts compact iteration evidence to Issue #68 with source SHA, deploy versions, game IDs, failing/passing scenarios and remaining defects.

### Hermes/watchdog

- treats this READY task as intentionally continuous, not a one-shot lease;
- if Codex becomes idle/stops after a narrow green result while objective matrix remains incomplete, re-kick the same CURRENT_TASK rather than waiting for owner input;
- review terminal claims against the full exit criteria below;
- reject `OWNER_READY` if only unit tests, HTTP 200, DOM-presence checks, a short 3–15 turn campaign, or uninspected screenshots support the claim;
- if an iteration ends with a known objective defect or canon-defined feature still unfinished, keep/reopen READY and send Codex back into the loop;
- only allow owner handoff when objective exit criteria are actually met.

## 7. Objective exit criteria before owner handoff

Do not set `WAITING_USER_FINAL_PLAYTEST` until ALL are true:

1. canonical deployed Owner URL boots successfully in real desktop and mobile browsers;
2. no permanent boot/fallback/blocking Story overlay;
3. Setup -> Opening -> normal play works from a fresh browser session;
4. 30-turn primary and 15-turn independent campaign pass, followed by a 50-turn memory/continuity campaign with no unresolved objective defect;
5. literal agency, identity, location/presence, scene_note, choices, MM, refresh and duplicate-submit checks are green;
6. 9-rule CSA real apply/effect/remove coverage is green with zero fake turns;
7. canon-retained sidecars that are meant to be usable at this stage are actually usable in deployed UI; do not call a visibly disabled retained feature owner-ready without an explicit defer decision;
8. screenshots are visually inspected, not merely captured;
9. browser console/network required paths are clean;
10. DB/state/turn evidence matches visible behavior;
11. no known P0/P1/P2 objective defect remains;
12. the only remaining questions are genuinely subjective product judgments that automation cannot decide reliably.

If these are not all true, remain READY and continue the loop.

## 8. Safety / preservation

- TEST only; no Production access/deploy;
- never mutate/reset/delete/replay historical/manual/evidence games;
- disposable R3 TEST games are authorized and should be clearly labeled/logged;
- do not reuse an owner manual save as automation fixture;
- no provider/model/config/secret changes merely to mask implementation defects without explicit review;
- migrations must remain additive and reviewed; do not rewrite applied history.

## 9. Reporting cadence

Do not spam the owner per iteration. Keep detailed machine/agent evidence in Issue #68.

Owner-facing progress should summarize meaningful milestones or blockers only.

Codex iteration report format:

`AUTONOMOUS_LIVE_QA_ITERATION`

- source/main SHA
- API/frontend version
- disposable game IDs
- browser/viewports
- turns executed
- scenarios exercised
- defects found
- fixes landed
- regression tests added/removed
- live replay result
- remaining objective gaps
- next loop action

A final `OWNER_READY` report must enumerate evidence against all 12 exit criteria, not merely say tests passed.
