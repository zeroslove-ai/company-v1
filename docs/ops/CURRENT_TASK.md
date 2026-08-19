# Company v2 — CURRENT TASK

Status: READY
Task ID: company-v2-phase1-product-baseline-v1
Mode: SOURCE CORRECTION — PRODUCT UI PARITY + FREE INPUT + FIRST-TURN CLOSURE
Updated: 2026-08-19
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file or an ops/task-registration branch.

## 0. Owner directive / authority

The previous manual handoff is REJECTED for product quality.

Operator/owner rejection comment:

- Issue #68 comment `5341086841`

Previous handoff terminal is no longer an acceptance signal:

- Issue #68 comment `5340544017`
- previous game `0daec355-47a8-4b81-a87d-a47dc25b5b96` is now immutable failed-user evidence, not an acceptance game.

Preserved rollout evidence also remains immutable:

- `88625b46-20fa-42c6-82d5-050a98ee2aad`

The owner explicitly changed the Phase-1 product requirement:

1. clean-room runtime does NOT mean deleting the product UI;
2. restore the established Company product UI shell and remove/hide only unsupported features;
3. remove choices from current Phase 1 completely — free-form player input only;
4. choices may return only in a later separately authorized feature;
5. do not hand anything back to the user until the product shell and a bounded automated end-to-end turn smoke pass in a later rollout task.

Binding runtime architecture remains the clean v2 server-owned model. This task may update the Company v2 canon/documentation only where necessary to reflect the owner's new product requirement; it must not reintroduce v1 runtime authority.

## 1. Proven failures to close

### A. Product UI regression

Current `frontend-v2/index.html` is only a minimal demo document with heading/story/choices/textarea/button/summary/mind. This is not acceptable product parity.

Existing product donor is already in this repository:

- Company Story UI shell merge commit: `f4b228f14d3a0e4446b0ae62e441ed659d3609ca`
- donor tree: `src/frontend/pages/*`
- important donor surfaces include the Story shell, status/header, history/current story, right-side state panels, player situation, input composer, responsive/mobile styling.

Use that donor for VISUAL / LAYOUT / PRODUCT-SHELL behavior only.

Hard boundary: DO NOT import or revive the old frontend Story->Extract->Commit coordinator, pending-action state machine, old runtime API authority, `src/engine`, old runtime core, old Extract normalizer, or old reducer.

`frontend-v2/*` must remain a v2-only client of `/api/v2/*`.

### B. Choice feature is removed from current Phase 1

Current active source still forces choices in multiple places, including:

- Story provider prompt requires exactly four `[CHOICE]` blocks;
- deterministic provider emits four choices;
- `runtime-v2/domain/story.js` parses and normalizes exact-four choices;
- Opening emits four choices;
- frontend renders choice buttons;
- tests/canon/acceptance require exactly four.

Remove this as active Phase-1 behavior.

Required new Phase-1 behavior:

- free-form player text is the only action input;
- Story provider must NOT be asked to generate choices;
- Opening must NOT generate choices;
- frontend must NOT show a choice list;
- no deterministic four-choice fallback;
- no turn success/commit dependency on choices;
- fresh Opening/turn writes should use an empty choices array only if the existing durable schema still structurally carries that field;
- no migration is required merely to delete the feature from active behavior;
- historical rows containing choices remain readable evidence but do not drive the new UI.

### C. First user turn stuck in processing

Failed-user evidence game:

`0daec355-47a8-4b81-a87d-a47dc25b5b96`

Owner submitted literal action:

`인사를 건넨다.`

Operator read-only DB evidence after the report:

- turn 1 canonical job exists;
- status observed: `processing`;
- attempt_no = 1;
- partial `story_text` was persisted;
- committed_turn remained 0;
- no committed gameplay turn 1 existed at observation time.

Do NOT mutate, retry, reset, delete, expire intentionally, or reuse this game. Treat it as forensic evidence only.

This task must determine the actual source/runtime cause of a Story stream that can persist partial text but fail to reach terminal commit/fail in normal user operation. Do not guess. Inspect the exact server flow, provider stream completion handling, Worker lifetime/stream behavior, progress/fail paths, and existing tests. Fix only the proven cause(s).

No hidden retry/regeneration is allowed as a workaround.

## 2. Product-shell target

The v2 frontend should look and behave like the established Company product shell, adapted to the smaller Phase-1 state.

Required visible structure:

- established Company title/header treatment;
- day/time display;
- turn indicator;
- compact connection/runtime status;
- main Story column with ordered history and a distinct current streaming turn area;
- player literal action shown with the current turn while processing;
- right-side product column using the established panel treatment:
  - character/current scene state;
  - Mind Monitor;
  - player situation;
- bottom/free-input composer consistent with the existing Company UI family;
- responsive/mobile behavior based on existing Company/hospital donor styling;
- inline/non-blocking loading/progress status only; never cover the Story with a blocking loading screen;
- readable error/retry state when a turn deterministically fails.

Unsupported Phase-2/3 product controls may be hidden or disabled. Do not invent placeholders that dominate the UI.

Do NOT add choices.

## 3. Frontend authority rules

`frontend-v2` is presentation + user input only.

It may:

- Setup/Opening only for an explicit new-game flow;
- fetch `/api/v2/context`;
- submit one `/api/v2/turn` request for one user action;
- consume Story SSE;
- display persisted/reconnected job progress;
- display committed history/state/MM/summary;
- allow explicit user retry only after an authoritative failed job, using the existing server retry contract.

It must NOT:

- implement Story->Observation->Commit staging;
- infer/commit gameplay state locally;
- synthesize choices;
- automatically regenerate/retry failed LLM calls;
- create an extra gameplay turn during refresh/reconnect;
- use v1 API endpoints.

## 4. First-turn closure requirements

Close the proven stuck-turn class at source level.

Required tests must prove at least:

1. a streamed Story that produces content reaches one terminal state under the normal successful provider protocol;
2. a provider stream that ends/aborts/malforms cannot leave the canonical job permanently `processing` — it reaches authoritative `failed` according to the existing bounded timeout/error policy unless ownership fencing makes the attempt stale;
3. no second Story call is used to repair the turn;
4. reconnect reads persisted progress from the same canonical job;
5. after terminal commit, exactly one gameplay turn exists and committed_turn advances once;
6. after terminal failure, the same job is failed and only explicit user retry may create the next attempt on that same canonical row;
7. source behavior is compatible with Cloudflare Worker streaming semantics, not only an in-memory fake.

If the exact live failure cannot be reproduced deterministically, still add a regression for the concrete protocol/lifetime defect found in code/log evidence. Do not add speculative retries.

## 5. Choice removal requirements

Update active code/tests/docs consistently.

At minimum inventory and adjust:

- `runtime-v2/server/provider.js`
- `runtime-v2/domain/story.js`
- `runtime-v2/domain/contracts.js` if exact-four helpers are active v2 authority
- `runtime-v2/server/worker.js` / stores only as needed to pass `choices: []` through the existing schema
- `frontend-v2/index.html`
- `frontend-v2/styles.css`
- `frontend-v2/app.js`
- Company v2 tests
- `docs/COMPANY_V2_CLEAN_RUNTIME_CANON_2026-08-19.md` where it still says exactly four choices are Phase-1 acceptance

Do not edit applied migrations merely because the durable turn table has a choices column.

## 6. UI donor rules

Allowed:

- copy/adapt markup structure and CSS from `src/frontend/pages/*` into `frontend-v2/*`;
- reproduce existing Company visual hierarchy/components/responsive behavior;
- port pure display formatting where it has no runtime authority.

Forbidden:

- importing `src/frontend/pages/app.js` as the v2 controller;
- importing old `api.js`/turn coordinator/pending state machine;
- making frontend-v2 depend on v1 runtime modules;
- using donor naming as an excuse to reintroduce old state authority.

Prefer a small v2 presentation adapter over cloning old logic.

## 7. Scope / branch / PR

This is SOURCE CORRECTION only.

Create source branch:

`company-v2/phase1-product-baseline-v1`

Open one Draft PR against `main`.

Allowed changes are limited to:

- `frontend-v2/**`
- `runtime-v2/**` only where required for choice removal / first-turn closure
- `test/**` for focused regressions
- `docs/COMPANY_V2_CLEAN_RUNTIME_CANON_2026-08-19.md`
- this task's normal implementation evidence if required by repository workflow

Do NOT change:

- v1 runtime behavior;
- `src/engine/**`;
- old Company frontend behavior under `src/frontend/pages/**` (donor must remain intact);
- applied Supabase migrations 002-005;
- provider/model values;
- Cloudflare worker identities;
- Production/hospital-v2.

No DB writes, migration apply, Worker deploy, live game creation, reset, or gameplay call in this SOURCE task.

## 8. Validation before terminal

Required local/source validation:

- focused Company v2 runtime tests;
- focused frontend-v2 product-shell tests;
- tests proving choices are absent from active Phase-1 generation/rendering/acceptance;
- first-turn successful stream -> commit regression;
- malformed/aborted/incomplete stream -> failed terminal regression with no stuck processing;
- reconnect/progress regression;
- full repository `npm test` green;
- syntax checks;
- `git diff --check`;
- dedicated v2 API Wrangler dry-run;
- dedicated v2 frontend Wrangler dry-run;
- exact-head GitHub Actions success.

UI structural tests must assert presence of the required product shell regions and absence of the choice list. Do not use screenshot-only assertions as the sole proof.

## 9. Review stop

Codex stops at source review. Do NOT merge, deploy, migrate, create TEST games, or run live gameplay in this task.

Required terminal:

`COMPANY_V2_PHASE1_PRODUCT_BASELINE_READY_FOR_REVIEW`

Include:

- TASK_ID;
- branch;
- Draft PR number;
- final head SHA;
- exact changed file list;
- donor files/commit used for UI parity;
- concise explanation of how old runtime authority was excluded;
- choice-removal inventory and resulting behavior;
- exact root cause of the stuck first-turn class and source fix;
- focused test results;
- full test result;
- Wrangler dry-runs;
- exact-head CI run/job IDs;
- explicit confirmation: no deploy, no DB write, no migration apply, no live game mutation, no Production/v1 mutation.

Then STOP at `WAITING_REVIEW`. Do not create the rollout task yourself.