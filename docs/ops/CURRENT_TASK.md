# Company — CURRENT TASK

Status: READY
Task ID: company-r3-csa-w5-turn-transport-diagnostic-repair-v1
Mode: NARROW P1 DIAGNOSTIC/REPAIR — EXACT W5 UI PAYLOAD / TURN TRANSPORT / RESERVE BOUNDARY / RESUME ACTOR-GROUNDING ACCEPTANCE
Updated: 2026-08-25 01:30 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Registration base main: `9f9d853c979aa0199bc41d79ac2ee5fe12448e08`
Reviewed actor-grounding executable source: `60fe42f0b015dc0579888e96b98715b1ab5b5b7f`
Binding CSA canon commit: `8db9cc0cccde68fc66f973de19c28c13154d9960`
Binding live acceptance commit: `81c8d7beca6bb29dd1c13ffa672e085616e8aed8`
Previous task: `company-r3-csa-rule-change-live-recovery-v1`
Previous terminal: Issue #68 `5398196312`
Operator review: Issue #68 `5398267569`
TEST R3 API baseline: `game-proxy-company-r3` / `cbfb8900-1ba9-4886-9405-452e7ae760db`
TEST R3 frontend baseline: `gamebuilder-company-r3` / `7e3ae305-bec1-4fb9-9c4e-6e9d86448a9e`
TEST Supabase project: `fmcrspgxstsmxxsmkeee`

## Reuse / authority law

- Work on `main` only.
- Reuse this exact `docs/ops/CURRENT_TASK.md` path. Overwrite it in place for lifecycle state.
- Do NOT create another CURRENT_TASK file, ops branch, feature branch, implementation PR, or report-only branch.
- Read first: `AGENTS.md`, `CURRENT_TRUTH.md`, `docs/redesign/COMPANY_CANON.md`, `docs/redesign/LIVE_ACCEPTANCE_MATRIX.md`, current frontend/runtime CSA transport source/tests, terminal `5398196312`, review `5398267569`, then this task.
- Preserve the accepted 21-slot catalog, structured +1-turn CSA architecture, actor-grounding semantics from `60fe42f0...`, Stage-A agency/MM behavior, and current TEST schema.
- Do not restore exact-nine or zero-turn CSA.
- Never claim OWNER_READY.

Target success terminal:
`CSA_W5_TURN_TRANSPORT_REPAIRED_AND_ACTOR_GROUNDING_PROVEN_AWAITING_OPERATOR_REVIEW`

Blocked terminal:
`CSA_W5_TURN_TRANSPORT_BLOCKED_AWAITING_OPERATOR_REVIEW`

---

# 0. Accepted facts — do not reopen without deterministic evidence

The latest fresh game `894868de-a2f3-493f-8d20-c9bcb1f38417` proved:

- Opening committed normally;
- one ordinary Turn 1 committed normally through the same R3 product;
- W5 UI pre-selection was exact: subject `heroine5` / 이메이, counterparty `general_park_jungwoo` / 박정우;
- APPLY was clicked once;
- no CSA job/turn committed or duplicated;
- product recovery text was `입력이 서버에 전송되거나 저장되지 않았습니다. 내용을 확인한 뒤 직접 다시 제출할 수 있습니다.`;
- actor-grounding Story acceptance was not reached because no rule-change turn existed.

Current frontend facts:

- CSA UI hands `{ literal_action, ...csaOperation }` to `submit()`;
- ordinary and CSA turns both use `client.turn(... /turn ...)`;
- `submit()` converts a non-OK/no-body turn response into `r3_stream_reconnect_required`, then `reconcileTurnTransport()` reads canonical context once;
- if no processing/failed job or matching commit exists, the UI classifies it generically as `not_sent`;
- therefore the previous terminal does **not** distinguish network failure, HTTP 4xx validation rejection, capability/auth failure, expected-turn conflict before reserve, or another pre-reserve source failure.

Current test gap:

- focused tests prove W5 `applyR3Csa()` selector semantics and `rule_change_story_binding` direction;
- they do not currently prove the exact browser-style W5 payload end-to-end through `/turn -> startTurn -> validation -> reserve -> stream -> commit` with `heroine5` + `general_park_jungwoo`.

Historical comparison:

- the same W5 actor pair committed successfully in the earlier pre-grounding live run under the current 21-slot architecture;
- actor-grounding commit `60fe42f0...` did not intentionally redesign selector validation or the turn reservation contract.

Do not assume either "transient network" or "bad selector". Prove the first broken boundary.

---

# 1. Exact source inventory and comparison

Trace the current path:

`frontend-r3/csa.js draft -> onOperation -> frontend-r3/app.js submit -> frontend-r3/r3-client.js turn -> runtime-r3/server/worker.js startTurn -> applyR3Csa prevalidation -> assertExpectedTurn -> store.reserveTurn -> streamTurn -> provider -> observer -> commit`

Also inspect:

- `frontend-r3/turn-transport.js` reconciliation;
- `runtime-r3/server/http.js` error envelope;
- in-memory and Supabase store reserve-turn validation;
- the additive `rule_change_event` reserve contract already present on TEST;
- exact diffs `bef87b18656f5f2e009d106a2436c7ee558101b9 -> 60fe42f0b015dc0579888e96b98715b1ab5b5b7f` for any accidental pre-reserve behavior change.

Classify relevant paths:

- `KEEP`
- `MISSING_INTEGRATION_TEST`
- `PRE_RESERVE_REJECTION_OWNER`
- `TRANSPORT_ERROR_CLASSIFICATION_ONLY`
- `DEPLOYMENT_DRIFT`
- `UNRELATED_DO_NOT_TOUCH`

Do not change source until the first broken boundary is identified.

---

# 2. Deterministic exact-W5 integration reproduction first

Before any live retry, add a focused deterministic test using current canonical content and the real `createR3Worker` request boundary.

Use the exact operation shape expected from the browser:

```json
{
  "operation": "activate",
  "template_id": "breast_touch_conversation",
  "subject_scope": "female_employee",
  "counterparty_scope": "male_employee",
  "subject_actor_id": "heroine5",
  "counterparty_actor_id": "general_park_jungwoo"
}
```

The test must:

1. create a valid R3 game with capability;
2. commit Opening;
3. submit `/turn` with a non-empty audit `literal_action`, `expected_turn=1`, `action_id`, and the exact `csa_operation` above;
4. assert the HTTP/SSE boundary actually reaches a reserved and committed rule-change turn;
5. assert the committed structured event contains exact subject/counterparty IDs;
6. assert `rule_change_story_binding` carries 이메이/박정우 with W5 direction;
7. prove exactly +1 committed gameplay turn and no duplicate.

Also add a frontend-shape regression proving the CSA draft/selector handoff preserves both actor IDs in the operation passed to `submit()` and does not silently clear one during render/sync.

If the exact deterministic `/turn` request fails:

- capture the exact error code and owning function;
- patch only that owning boundary;
- do not continue to live acceptance until focused regression is green.

If deterministic `/turn` passes:

- do not invent a source fix;
- proceed to live HTTP/network evidence to determine deployment/transport cause.

---

# 3. Preserve server error identity without exposing internals to normal players

Current product recovery collapses several pre-reserve failures into `not_sent`. This is acceptable player-facing wording but insufficient operator evidence.

During this task, ensure the diagnostic path can capture the exact HTTP status/error code for a failed `/turn` request without exposing raw `r3_*`, stack traces, capability tokens, secrets, or JSON internals in normal player UI.

Preferred minimal approach:

- test/browser Network or safe internal error object preserves the server error identity for evidence;
- player UI continues to show understandable generic recovery wording;
- do not add a permanent developer console panel or raw-code player surface.

Only patch client/transport classification if current code is proven to destroy information needed for correct recovery behavior, not merely to make debugging convenient.

---

# 4. Source repair boundary

If deterministic evidence identifies a source regression, make the smallest repair.

Allowed examples:

- exact browser CSA operation serialization loses actor selector fields;
- worker prevalidation rejects a valid canonical W5 pair due to a current source mismatch;
- expected-turn/revision handling incorrectly treats a dedicated structured rule-change turn differently from an ordinary turn before reserve;
- reserve payload fails to carry the valid `rule_change_event` expected by the current additive TEST schema;
- client incorrectly routes the dedicated structured operation to a stale endpoint/path.

Not allowed:

- actor fuzzy matching;
- automatic substitution of player/another NPC;
- generic sexual action DSL;
- second writer/kernel;
- retries/regeneration/sample-until-pass;
- model/provider/secret/timeout changes;
- weakening capability/auth or turn fencing;
- bypassing server validation;
- DB schema redesign to hide a frontend/runtime bug.

Preserve `rule_change_story_binding` and its exact direction semantics from `60fe42f0...` unless deterministic evidence shows that code itself causes the pre-reserve rejection.

---

# 5. Validation before TEST deployment

Required minimum:

- exact W5 full `/turn` integration regression;
- frontend actor-pair operation-shape regression;
- existing CSA focused suite;
- Stage-A agency/MM regressions touched by changed files;
- one full `npm test`;
- JS syntax;
- catalog JSON parse if relevant;
- `git diff --check`.

If source changes:

- deploy exact reviewed API source to TEST only if runtime/API changed;
- deploy frontend only if frontend source changed;
- record exact Worker version IDs;
- do not redeploy unchanged workers.

Expected DB/schema change: **none**.

- no `supabase db push`;
- no migration repair;
- no migration-ledger write;
- no gameplay-row backfill;
- if a genuinely new schema prerequisite appears, STOP BLOCKED before mutation with exact evidence.

No Production access.

---

# 6. Fresh live proof after deterministic closure

Never reuse or mutate previous evidence games.
Create one fresh disposable adult TEST browser game only after deterministic tests are green and exact TEST deployment is verified.

Run:

1. Setup + Opening once;
2. one ordinary turn if necessary to establish scene reality with exact registered actors;
3. configure W5 with subject `heroine5`/이메이 and counterparty `general_park_jungwoo`/박정우 when both are valid/selectable;
4. record the exact outgoing operation shape and HTTP result without recording bearer capability;
5. click APPLY exactly once.

If `/turn` still fails before reserve:

- capture exact HTTP status/error code and canonical context/job evidence;
- STOP immediately;
- no resubmit, no second game, no alternate pair, no sample-until-pass.

If W5 commits:

PASS requires:

- exact structured subject/counterparty IDs;
- exact rule-change binding IDs/names/roles/direction;
- Story uses 박정우 -> 이메이 W5 direction, with no player substitution;
- grounded institutional announcement;
- private app not narrated as institutional source;
- same-turn MM consistent with Story;
- active rule atomically committed exactly once;
- four Story choices/free input available;
- refresh/context/History no duplicate.

Only after this W5 PASS, resume the previously unreached bounded CSA lanes from the prior task:

- CHANGE;
- unrelated ordinary turn;
- REMOVE + residue check;
- one Medium actor-pair rule;
- S1 finite action-family rule;
- one named Strong designation;
- one compatible two-rule combination;
- later unrelated turn;
- refresh/History;
- desktop + ~390x844 mobile CSA usability.

Stop at first deterministic P0/P1. Do not expand into final 20+ turn owner-ready/media/TTS acceptance.

---

# 7. Safety / evidence rules

- Production access = 0.
- Preserved evidence-game mutation/reset = 0.
- Previous disposable games are read-only evidence; do not reuse them.
- Never post bearer capability tokens, secrets, private environment values, or full auth headers to Issue #68.
- Direct API use is allowed for deterministic local tests and read-only supporting TEST evidence; actual product acceptance remains browser UI.
- No migration/history repair.
- No new branch/PR/CURRENT_TASK file.

---

# 8. Terminal report contract

Report:

- start/final main SHA;
- exact changed files;
- deterministic exact-W5 `/turn` result before and after repair;
- exact first broken boundary and error code;
- whether frontend payload preserved both actor IDs;
- whether source repair was required;
- focused/full test counts;
- DB/migration writes = 0;
- exact TEST API/frontend versions used;
- fresh game ID;
- exact W5 outgoing operation fields excluding secrets;
- live HTTP result;
- structured event -> binding -> Story -> Observer -> durable state evidence if reached;
- resumed CHANGE/REMOVE/Medium/Strong/multi-rule/mobile lanes actually reached;
- Production access = 0;
- preserved evidence mutation = 0;
- P0/P1/P2/P3 findings.

Success terminal:
`CSA_W5_TURN_TRANSPORT_REPAIRED_AND_ACTOR_GROUNDING_PROVEN_AWAITING_OPERATOR_REVIEW`

Blocked terminal:
`CSA_W5_TURN_TRANSPORT_BLOCKED_AWAITING_OPERATOR_REVIEW`

Finish by changing only this existing CURRENT_TASK lifecycle to `WAITING_REVIEW`, posting exactly one terminal report to Issue #68, then STOP. Do not self-register another task.