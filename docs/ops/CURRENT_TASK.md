# Company — CURRENT TASK

Status: READY
Task ID: company-r3-feedback-revision-source-audit-v1
Mode: FEEDBACK REVISION VERTICAL-SLICE AUDIT -> MINIMAL IMPLEMENTATION RECOMMENDATION -> STOP
Updated: 2026-08-22 22:47 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file, ops/recovery branch, design framework, or competing execution authority.

## 0. Wake / authority

The previous hold `company-r3-continuous-autonomous-live-qa-v1` was intentionally `WAITING_OWNER_DECISION` after local R3 runtime/UI acceptance became GREEN.

Wake condition C is now satisfied by the explicit owner/operator decision recorded in Issue #68 comment `5380754235`: start the next product feature, selected as **R3 latest-turn feedback revision**.

Binding authority:
- product-first canon PR #95 head `9d9aec5a198d8673eb37aba8a0541adbd6c84627`;
- A-prime engine/live-first canon PR #96 head `9d44c4719fa6b098d53cac5cf946b93fafa6786b`;
- `A-FEEDBACK-001 — Revise latest turn, do not advance chronology`;
- PR #96 Gate 7 secondary-sidecar direction;
- owner lean-development directives `5380380688` and `5380381500`;
- accepted local-GREEN review `5380606535` and hold registration `5380612080`;
- owner/operator wake decision `5380754235`;
- this exact CURRENT_TASK blob after `CURRENT_TASK_READY` registration.

Core architecture remains:
`Story 1 call -> Observer 1 call -> small reducer -> atomic commit`.

CSA rules 7/9 remain frozen capability exceptions. This task MUST NOT inspect, rerun, redesign, or tune them.

## 1. Accepted baseline — do not reopen

Current main before this registration is the local-GREEN hold lineage rooted in accepted executable source:
- accepted executable source `9e91227302a041f1d588e3b260aa3951da3ea9bd`;
- accepted TEST API `game-proxy-company-r3` version `23da269d-45df-4c39-89e0-35dc99b82505`;
- accepted TEST frontend `gamebuilder-company-r3` version `05bf9f88-2c02-4db7-9f6d-eb4429fdf31c`.

Frozen GREEN evidence includes player agency, location/presence/scene_note, Story choice authority/fail-open, submit/SSE/reconnect, explicit failed-turn Retry, history/export, desktop/mobile and TTS retained surfaces.

Do not run gameplay or repeat any of those matrices in this audit.

## 2. Why feedback is the selected next feature

This is not a new invented QA surface.

Current product authority already contains `A-FEEDBACK-001`:
- feedback revises the **latest committed ordinary turn**;
- chronology does not advance;
- original revision remains auditable;
- replacement Story belongs to the same chronological turn;
- failure leaves the prior committed revision intact;
- subsequent context uses the accepted latest revision.

Current R3 presentation already contains a donor-style feedback surface:
- `frontend-r3/index.html` contains disabled `#send-feedback`;
- `#feedback-overlay`, `#feedback-form`, `#feedback-text`, close/status controls and copy already exist.

Current accepted R3 source appears to have no active feedback path:
- `frontend-r3/app.js` has no feedback event/wiring;
- `frontend-r3/r3-client.js` exposes catalogs/setup/context/opening/turn/csa only;
- `runtime-r3/server/worker.js` routes context/opening/turn/csa only.

The purpose of this task is to determine the **smallest R3-native implementation seam** before any schema/runtime mutation is authorized.

## 3. Task type — READ-ONLY SOURCE/PERSISTENCE AUDIT ONLY

Do not implement feedback in this task.

Allowed:
- read current main/source/tests/migrations/schema/RPC definitions;
- read the relevant Company-v1 donor feedback presentation/flow only to identify reusable UX pieces;
- inspect current R3 store interfaces and existing revision/history capabilities;
- inspect accepted design docs and tests relevant to `A-FEEDBACK-001`;
- post one terminal report to Issue #68.

Forbidden:
- runtime/frontend/test/content source edits;
- migration creation/application or SQL mutation;
- DB writes, game creation/reset, TEST gameplay;
- API/frontend deploy;
- Production access;
- provider/model/temperature/token/config/timeout changes;
- CSA sampling/change;
- generic semantic parser/NER/keyword/fuzzy/router/classifier/gate;
- deterministic narrative/action/consent executor;
- second Story/choice LLM;
- hidden retry/regeneration;
- compatibility framework or restoration of old browser-owned orchestration.

## 4. Required audit questions

### A. Current persistence truth

Inspect the actual current R3 schema/migrations/RPC contracts and answer precisely:
1. What is the key/uniqueness model of `company_r3_turns`?
2. What does its `revision` column currently mean in live R3 source/schema?
3. Can multiple auditable revisions of the same `(game_id, turn_number)` be stored already, or is the current row singular?
4. Can `company_r3_system_events` or another existing structure satisfy **original revision remains auditable** without abusing a log as gameplay authority?
5. What is the smallest clean persistence delta if current schema cannot retain revisions?

Do not propose a compatibility bag. Prefer one canonical latest-turn projection plus one narrow auditable revision history mechanism if a schema change is truly required.

### B. Correct pre-turn authority for regeneration

A latest-turn revision must regenerate Turn N from the state/context **before Turn N**, not from Turn N's already-applied post-state.

Audit how the current data model can reconstruct that pre-turn authority exactly, e.g. from Opening/Turn N-1 committed `state_after` plus canonical game/profile and prior committed history.

Require:
- same original literal player action for Turn N;
- feedback text is revision guidance, not a new player action and not a new chronological turn;
- active CSA/state supplied to Story reflects the canonical pre-Turn-N world;
- replacement Observer/reducer also starts from pre-Turn-N state;
- on successful revision, current state becomes replacement Turn N `state_after` atomically;
- on failure, current accepted Turn N revision/state remains untouched.

### C. Server-owned feedback transaction / fencing

Propose the smallest endpoint and fencing contract consistent with A-prime.

Audit/propose fields such as, only if justified:
- feedback/revision attempt id;
- expected latest turn;
- expected current game/state revision;
- feedback text;
- exact original literal action recovered server-side rather than trusted from browser.

Required semantics:
- feedback allowed only for the latest committed ordinary turn (`turn_number > 0`);
- no pending/failed next-turn job may be silently overwritten;
- stale feedback cannot overwrite a newer turn/revision;
- one explicit feedback submission performs at most one Story call and one Observer call;
- no retry-until-pass;
- browser does not orchestrate Story -> Observer -> Commit;
- successful replacement advances only revision authority needed for atomic fencing, **not chronological turn number**;
- failure preserves old accepted revision exactly.

### D. Canonical context/history projection

Determine the minimal rule for context/history/export after multiple feedback revisions:
- normal gameplay surfaces show exactly one accepted latest revision per chronological turn;
- original/prior revisions remain auditable but are not rendered as extra gameplay turns;
- next Story receives only the accepted latest revision for each prior turn;
- history/export preserve the original literal player action and selected accepted replacement Story;
- an explicit audit/debug path may expose prior revisions only if already justified by product/ops needs; do not make revision history a second gameplay UI by default.

### E. Existing UI salvage boundary

Inspect current R3 feedback scaffold and relevant Company-v1 donor code.

Return the smallest frontend wiring needed:
- when `#send-feedback` becomes enabled;
- opening/closing the existing modal;
- one submit -> one server feedback request;
- busy/disabled/error/success behavior;
- provisional replacement Story streaming presentation without erasing the committed old Story before success;
- refresh after successful replacement shows the canonical revised Turn N once;
- no browser-owned revision state or old coordinator resurrection.

Prefer current R3 controller conventions and existing modal markup. Do not redesign the whole UI.

### F. Test/deploy scope for the future implementation

Specify only focused protection needed for this feature. At minimum evaluate whether future implementation needs deterministic checks for:
- same chronological turn, new accepted revision;
- original revision retained/auditable;
- old state survives provider/observer/commit failure;
- stale expected revision/turn rejected;
- exact literal action unchanged;
- successful replacement becomes next-context/history authority;
- one frontend request / no double submission;
- refresh parity.

Do not propose a new large test framework or automatic 30/50-turn campaign.

## 5. Required terminal recommendation

Post exactly one terminal report to Issue #68 with:
- Task ID + CURRENT_TASK blob + execution lease;
- final main SHA and confirmation `SOURCE_CHANGED: no`;
- exact files/schema/RPCs inspected;
- current feedback gaps by module;
- current `company_r3_turns` revision/uniqueness truth;
- exact pre-turn reconstruction approach;
- proposed minimal server endpoint + fencing semantics;
- exact minimal persistence/RPC delta, if any;
- exact minimal frontend wiring using existing modal;
- focused tests + one bounded future TEST replay plan;
- CSA 7/9 untouched confirmation;
- no DB/game/deploy/source mutation confirmation.

End with exactly one implementation recommendation:
- `IMPLEMENT_WITHOUT_MIGRATION`, or
- `IMPLEMENT_WITH_MINIMAL_ADDITIVE_MIGRATION`, or
- `BLOCKED_NEEDS_BROAD_REDESIGN`.

If a migration is recommended, identify the smallest additive schema/RPC shape but DO NOT create/apply it in this task.

Stop after terminal. Do not overwrite CURRENT_TASK or start implementation yourself.
