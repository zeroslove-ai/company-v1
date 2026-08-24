# Company — CURRENT TASK

Status: WAITING_REVIEW
Task ID: company-r3-csa-rule-change-live-recovery-v1
Mode: ACCEPTANCE-ONLY RECOVERY — FREEZE ACTOR-GROUNDING SOURCE / ONE FRESH OPENING / RESUME CSA LIVE PROOFS
Updated: 2026-08-25 01:06 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Registration base main: `bc08403252d177d977b31f7d23460159bec69f25`
Reviewed actor-grounding source: `60fe42f0b015dc0579888e96b98715b1ab5b5b7f`
Binding CSA canon commit: `8db9cc0cccde68fc66f973de19c28c13154d9960`
Binding live acceptance commit: `81c8d7beca6bb29dd1c13ffa672e085616e8aed8`
Previous task: `company-r3-csa-rule-change-actor-grounding-v1`
Previous terminal: Issue #68 `5397923711`
Operator review: Issue #68 `5397951824`
Correct deployed TEST R3 API version: `cbfb8900-1ba9-4886-9405-452e7ae760db`
Unchanged TEST R3 frontend baseline: `7e3ae305-bec1-4fb9-9c4e-6e9d86448a9e`
TEST Supabase project: `fmcrspgxstsmxxsmkeee`

## Authority / reuse law

- Work on `main` only.
- Reuse this exact `docs/ops/CURRENT_TASK.md` path. Do not create a new CURRENT_TASK file, branch, PR, or ops branch.
- Read before execution: `AGENTS.md`, `CURRENT_TRUTH.md`, `docs/redesign/COMPANY_CANON.md`, `docs/redesign/LIVE_ACCEPTANCE_MATRIX.md`, current CSA source, previous terminal `5397923711`, operator review `5397951824`, then this task.
- Freeze reviewed executable source `60fe42f0b015dc0579888e96b98715b1ab5b5b7f`. This lease is acceptance-only.
- Do NOT edit source, tests, content, prompts, provider/model/config, frontend, DB schema, migrations, or catalogs in this task.
- Do NOT change timeout values, add retries, add regeneration, add semantic gates, or sample-until-pass.
- No Production access.
- No preserved evidence-game reset or mutation.
- Never claim OWNER_READY.

Target success terminal:
`CSA_RULE_CHANGE_LIVE_RECOVERY_COMPLETE_AWAITING_OPERATOR_REVIEW`

Blocked terminal:
`CSA_RULE_CHANGE_LIVE_RECOVERY_BLOCKED_AWAITING_OPERATOR_REVIEW`

---

# 0. Accepted facts — do not reopen

The previous source repair is accepted as the current actor-grounding candidate:

- deterministic `rule_change_story_binding` derives canonical template/slot/rule text, operation, exact selected actor IDs/names, immutable subject/counterparty/designation roles, action direction, authority framing, and unselected-participant boundary from the already validated structured rule event;
- it is Story context/presentation guidance only, not a second gameplay writer or durable gameplay system;
- ordinary non-CSA turns retain exact submitted literal-action fidelity;
- rule-change Story no longer receives the audit/app-control literal as ordinary Story intent when a structured rule event exists;
- focused CSA tests `15/15` PASS;
- full `npm test` `559/559` PASS;
- syntax/JSON/diff checks PASS;
- correct TEST R3 API `game-proxy-company-r3` version `cbfb8900-1ba9-4886-9405-452e7ae760db` was deployed from source `60fe42f0...`;
- frontend source did not change and was not redeployed;
- failed fresh game `79d0e3b6-fabf-4f35-99d2-f20086a7b171` is evidence only and must not be reused or mutated.

The previous terminal did **not** prove actor-grounding failure. It stopped before W5 because Opening/Turn 0 hit provider response timeout.

Do not patch source from that single timeout.

---

# 1. Preflight — read only

Before gameplay:

1. verify current `main` is only docs/lifecycle descendants of reviewed source or otherwise source-equivalent;
2. verify current deployed TEST R3 API still corresponds to reviewed source `60fe42f0...` and correct worker `game-proxy-company-r3`;
3. verify TEST frontend remains the accepted unchanged R3 frontend;
4. verify current TEST R3 schema remains compatible read-only;
5. do not redeploy if equivalence is already true.

If source/runtime drift is detected, STOP BLOCKED with exact evidence. Do not repair or redeploy a different lineage inside this acceptance lease.

The accidental legacy TEST worker deployment recorded in the previous terminal is unrelated acceptance evidence. Do not use `game-proxy-company-v1` for this task.

---

# 2. One fresh Opening attempt only

Create exactly one fresh disposable adult TEST game through the actual deployed browser product surface.

Run Setup and Opening once.

Required Opening pass:

- browser reaches committed Opening/Turn 0;
- Story visibly streams;
- no blocking loader covers arrived Story;
- exactly four full Story choices are available;
- free input remains available;
- no internal `r3_*`, Commit, revision, retry internals are exposed;
- no duplicate Opening/Commit appears after context readback.

If Opening/provider response times out or fails again:

- STOP immediately;
- classify `REPRODUCIBLE_TEST_PROVIDER_OR_RUNTIME_AVAILABILITY_BLOCKER`;
- record exact browser state, timing/error code, worker version, game ID, and read-only context/job evidence;
- do not retry Opening;
- do not create a second game;
- do not increase timeouts or change model/provider/config;
- do not patch source.

A second reproducible Opening timeout is not evidence against the actor-grounding source; it becomes its own provider/runtime-availability blocker for operator review.

---

# 3. Mandatory first product probe — W5 exact actor direction

Only if Opening succeeds, use the same fresh game and reach a scene where a non-player registered adult counterparty can be selected for W5 `breast_touch_conversation` without fabricating scene reality.

Submit exactly one W5 APPLY rule-change turn with:

- a registered heroine as subject;
- a registered non-player adult employee as counterparty;
- both exact IDs/names recorded before submission.

PASS requires all of the following from the one committed rule-change turn:

- structured `rule_change_event` preserves the exact selected subject/counterparty IDs;
- `rule_change_story_binding` readback/prompt evidence preserves the same IDs/names/roles and direction;
- Story uses the exact selected actors and correct W5 direction;
- player is not substituted when not selected;
- no other NPC is substituted or auto-added;
- grounded institutional announcement appears through company/public channel;
- private app screen/control is not narrated as the institutional source;
- NPC reactions may show surprise/embarrassment/reluctance while rule compliance remains distinct from affection/desire;
- same-turn MM actor IDs/names and reality agree with the Story;
- active rule commits atomically exactly once;
- four Story choices remain available;
- refresh/context/History show one committed rule-change turn, not duplicate Story/Commit.

If any exact actor/direction/app-source P0/P1 recurs, STOP immediately. No retry/sample-until-pass.

---

# 4. Resume previously unreached CSA acceptance only after W5 PASS

Continue on the same fresh game, stopping at first deterministic P0/P1.

Cover in this order where scene reality permits:

1. CHANGE the active W5 rule to another compatible canonical rule; verify one Story turn and exact new scope/state.
2. Ordinary unrelated social/non-work turn; verify active rule premise does not replace the literal action.
3. REMOVE; verify one Story turn and no future authority residue.
4. One Medium actor-pair preset, with exact subject/counterparty direction.
5. S1 `sexual_work_instruction_authority` using one supported finite action family only; prove no generic unsupported-command DSL/executor appears.
6. One named-designation Strong preset (S2/S3/S5/S6 as scene/product semantics permit); exact registered adult identity must be preserved.
7. One compatible two-rule combination; both active premises persist into a later relevant Story without collapsing into affection/obedience/personality rewrite.
8. One later unrelated ordinary turn; active rules remain background authority only.
9. Refresh/re-entry and History; no duplicate turn/Commit, no stale rule residue.
10. Desktop and approximately `390x844` mobile CSA surface: tabs `약함 | 중간 | 강함`, seven rules per tier, bounded selectors, active rule `변경/해제`, Story-first reading priority, no raw IDs/JSON/revision/internal codes.

Do not expand into final 20+ memory/media/TTS owner-ready acceptance in this task.

---

# 5. Data / deployment / safety boundary

- Source/test/content writes: `0`.
- DB schema/migration writes: `0`.
- `supabase db push`: forbidden.
- migration repair/history mutation: forbidden.
- provider/model/config/secret change: forbidden.
- automatic retry/regeneration: forbidden.
- Production access: `0` required.
- preserved failed games `9b2443eb-0c4b-4d44-842f-9141d3255c7b` and `79d0e3b6-fabf-4f35-99d2-f20086a7b171`: read-only forever for this task.
- Do not mutate other QA/sentinel/preserved games.
- Use actual deployed browser UI for product acceptance; direct API may be used only for read-only supporting evidence where needed, not as a substitute for the product interaction.

---

# 6. Terminal report

Success report must include:

- start/final main SHA;
- proof executable source remained `60fe42f0...`;
- exact deployed TEST R3 API/frontend versions used;
- fresh game ID;
- Opening result;
- W5 structured event -> binding -> Story -> observer raw/applied -> durable state -> UI evidence;
- exact subject/counterparty IDs/names and correct direction;
- private-app announcement-source result;
- CHANGE/REMOVE/Medium/S1/named-Strong/multi-rule/ordinary-turn/refresh/History/mobile results actually reached;
- source/test/content writes = 0;
- DB/migration writes = 0;
- Production access = 0;
- preserved evidence-game mutation = 0;
- P0/P1/P2/P3 findings.

If blocked before W5 by a second Opening timeout, terminal must say explicitly that actor-grounding acceptance remains **not reached** and provide the provider/runtime evidence only.

Finish by changing only this same CURRENT_TASK lifecycle to `WAITING_REVIEW`, post one terminal report to Issue #68, then STOP. Do not self-register another task.

---

## Execution terminal — 2026-08-25 KST

`CSA_RULE_CHANGE_LIVE_RECOVERY_BLOCKED_AWAITING_OPERATOR_REVIEW`

- Execution identity: `company-r3-csa-rule-change-live-recovery-v1` / blob `137354c7b6da53e41088eb0ab899184b17ba606c` / expected branch `main`.
- Start main SHA: `2736b73f03f93506cc03c5ace581f93ab7987396`. Reviewed executable source remained frozen at `60fe42f0b015dc0579888e96b98715b1ab5b5b7f`; current main was source-equivalent with only lifecycle/docs descendants. No source, test, content, prompt, provider, model, config, frontend, catalog, schema, or migration edits.
- TEST versions verified read-only: API `game-proxy-company-r3` `cbfb8900-1ba9-4886-9405-452e7ae760db`; unchanged frontend `gamebuilder-company-r3` `7e3ae305-bec1-4fb9-9c4e-6e9d86448a9e`. No redeploy was needed.
- Exactly one fresh disposable game was created through the product UI: `894868de-a2f3-493f-8d20-c9bcb1f38417`. Preserved evidence games `9b2443eb-0c4b-4d44-842f-9141d3255c7b` and `79d0e3b6-fabf-4f35-99d2-f20086a7b171` were not opened, reset, or mutated.
- Opening PASS: committed Turn 0 visibly arrived; no blocking loader remained; four complete Story choices and free input were visible; no internal `r3_*`, Commit, revision, or retry text was visible. One ordinary product turn also committed successfully (Turn 1), introducing a scene with registered adult subject/counterparty candidates.
- W5 pre-submission evidence: canonical catalog/source maps `heroine5` to `이메이` and `general_park_jungwoo` to `박정우`; the product UI showed both in the current scene/NPC list. In the W5 `가슴을 만진 상태로 대화` selector, subject `heroine5`/`이메이` and counterparty `general_park_jungwoo`/`박정우` were selected and recorded before one APPLY click.
- W5 result: the single APPLY attempt did not create a committed rule-change turn. The product remained at Turn 1 and displayed `입력이 서버에 전송되거나 저장되지 않았습니다. 내용을 확인한 뒤 직접 다시 제출할 수 있습니다.` History remained exactly two committed turns (Opening + ordinary Turn 1), with no CSA duplicate. The app exposed no internal error code; browser console/dev diagnostics were empty. A supporting unauthenticated shell GET was rejected as `r3_game_access_denied`, so no unauthorized context read was used; the product UI History was the available read-only context/job evidence.
- Actor-grounding acceptance is **not reached**: no structured `rule_change_event` -> binding -> Story -> Observer -> durable-state evidence exists, so no actor/direction/app-source pass or failure is claimed. Private-app announcement, CHANGE, REMOVE, Medium, S1, named Strong, multi-rule, later ordinary turn, refresh/History after CSA, and mobile checks were not reached. No retry, resubmit, second game, timeout change, provider change, or source patch was attempted.
- Direct DB/schema/migration/ledger writes: `0`; no `supabase db push` or migration repair. Authorized disposable gameplay setup/opening/ordinary-turn/W5-attempt requests only. Production access: `0`. Preserved evidence-game mutation: `0`.
- Findings: `P1` TEST product/API acceptance availability blocker at the first W5 APPLY attempt (`not_sent`, exact internal cause unavailable from UI); actor-grounding P0/P1 is unclassified and not disproven/proven. `P2/P3`: none assessed beyond scope.

STOP. `CURRENT_TASK` is `WAITING_REVIEW`. Do not retry W5, create another game, redeploy, modify source, reset preserved evidence, or start another Cut.
