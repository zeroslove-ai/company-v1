# Company — CURRENT TASK

Status: READY
Task ID: company-r3-continuous-autonomous-live-qa-v1
Mode: GENERIC ON_PLAYER_REQUEST STORY EXECUTION CONTRACT -> ONE MASTURBATE REPLAY -> REMAINING 3 CSA -> FULL OBJECTIVE LIVE-QA MATRIX
Updated: 2026-08-22 18:53 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file, ops branch, recovery branch, or competing execution authority.

## 0. Binding authority

Continue the same Task ID under:
- owner product canon PR #95 `9d9aec5a198d8673eb37aba8a0541adbd6c84627`;
- A-prime engine canon PR #96 `9d44c4719fa6b098d53cac5cf946b93fafa6786b`;
- `docs/redesign/00_*` through `11_*`;
- `docs/ops/AUTONOMOUS_LIVE_QA_LOOP.md`;
- `docs/ops/LIVE_QA_PRODUCT_REVIEW_2026-08-22.md`;
- Issue #68 owner UX/CSA directives;
- operator review `5379649519`;
- this exact CURRENT_TASK blob once registered by `CURRENT_TASK_READY`.

Architecture remains:
`Story 1 call -> Observer 1 call -> small reducer -> atomic commit`.

`OWNER_READY` / `WAITING_USER_FINAL_PLAYTEST` remain forbidden until the full objective QA matrix is green.

## 1. Accepted/frozen evidence

Reviewed terminal:
- terminal comment `5379630320`;
- previous task blob `e2f9ad5464ea41742c0447d269e4ad41f2fb09c8`;
- execution start main `b3c267613b77872b93697afe86357b4a18e5e4d4`;
- accepted/current executable main `2f30b62d95f85acf93323bd0eaac7a3ede8089cf`;
- operator review `5379649519`.

Current TEST identities:
- API `game-proxy-company-r3` version `aae73c35-3dd9-407a-86fe-63edea2bac08`;
- frontend `gamebuilder-company-r3` version `c297425c-3fa8-4025-a514-5ac908606c36`.

### 1.1 Opening/CSA stale-snapshot race — CLOSED and frozen

Accepted root cause:
`OPENING_CSA_STALE_SNAPSHOT_OVERWRITE_PROVEN`.

Preserved evidence fixture `7138198c-510d-4fb4-879c-fdac2f63465c` proved:
- CSA system event committed at `2026-08-22T09:15:36.118Z`;
- Opening turn 0 committed later at `2026-08-22T09:15:46.432668Z`;
- stale Opening `state_after` contained empty CSA/clothing and overwrote the newer CSA mutation.

Accepted source `2f30b62d...` adds only the generic Opening expected-revision fence plus focused tests and one additive TEST migration.

Accepted TEST migration:
`20260822000200_company_r3_opening_revision_fence.sql` — already applied exactly once. Do not reapply or edit historical migrations.

Validation accepted:
- focused 29/29 PASS;
- full 475/475 PASS;
- syntax and `git diff --check` PASS.

Do not reopen this concurrency boundary without new deterministic evidence.

### 1.2 Accepted CSA campaigns — GREEN and frozen

Do not rerun for pass seeking:
1. `no_panties_under_work_clothes` — accepted earlier.
2. `no_bra_under_work_clothes` — accepted earlier.
3. `target_places_requester_hand_on_waist_or_thigh` — two-personality request/contact acceptance complete.
4. `work_nude` fresh replay `e7f30733-b45c-40b1-9b71-40e5c2bd905e` — state continuity + Story premise + remove/post-remove GREEN.
5. `work_in_underwear_only` fresh replay `3d8fcd49-3f8a-42ab-861f-541a950d0bdc` — same gates GREEN.

Generic frontend transport reconciliation from source `58380f8...` also remains frozen GREEN.

## 2. Current decisive blocker

Disposable evidence fixture:
`7e6e645f-9678-4d26-a079-ed19153706b0`.

Facts:
- applied `masturbate_for_recipient` once through the real UI;
- revision became 1 while committed_turn remained 0;
- active `r3_csa_1` read back correctly;
- submitted exactly once through UI the direct eligible request recorded in terminal evidence;
- one turn committed once;
- canonical state continuity PASS at revision 2 / committed_turn 1; active rule remained present;
- Story nevertheless rejected the request as inappropriate and diverted to boundary-setting;
- no retry, second sample, removal, provider tuning, or pass-seeking occurred after failure.

Classification:
`BLOCKED_R3_CSA_STORY_RULE_IGNORED_WITH_STATE_PRESERVED`.

This is now a Story contract issue, not a persistence issue.

## 3. Proven source contract gap

Current `content/csa_presets.json` defines `masturbate_for_recipient` as:
- category `sexual_action`;
- mode `on_player_request`;
- content: when the counterparty requests it, the scoped employee must perform the stated behavior;
- execution trigger kind `counterparty_request`;
- target required.

Current `runtime-r3/domain/memory.js` already forwards active rule:
`content`, `mode`, `trigger`, `strength`, `subject_scope`, `counterparty_scope` into Story context.

Current `runtime-r3/server/provider.js` correctly says active rules are authoritative current-world institutional facts and must not manufacture affection/comfort/consent/desire/romance/relationship. However it does not explicitly close the execution semantics for `mode=on_player_request` / request-triggered rules: when the literal eligible request itself satisfies the stated trigger, the rule becomes applicable now and the required behavior must begin in that Story turn.

The live failure shows NPC discomfort/boundary reaction can currently be misused as a veto on rule applicability.

## 4. PHASE A — narrow generic Story-contract correction

Change only the smallest generic Story system-prompt boundary necessary.

Required generic law:
- every active rule remains authoritative according to its exact content and exact human scope;
- for an active rule whose own `mode`/`trigger` says it executes on an eligible counterparty request, when the current literal player action is that direct eligible request, the trigger is satisfied in the current turn;
- the behavior required by the rule must begin in that same Story turn; Story must not silently refuse, delay to a future meeting, substitute another action, or treat ordinary workplace/social norms as overriding the active institutional rule;
- NPC personality and emotion remain free: reluctance, embarrassment, anger, protest, hesitation in tone, surprise, dislike, or discomfort may be narrated when consistent with the character;
- those feelings are not a veto on the institutional rule's stated execution;
- rule execution alone must NOT create personal affection, comfort, consent, desire, romance, obedience-as-personality, trust, relationship, or player sexual state beyond what the rule itself explicitly states.

This correction must be rule-generic.

Forbidden:
- no `template_id === ...` branch;
- no sexual-keyword detector/classifier;
- no semantic router/gate;
- no NER/fuzzy matching;
- no consent DSL/physical ontology;
- no second Story/choice LLM;
- no hidden retry/regeneration;
- no provider/model/temperature/token/timeout/config change;
- no content-preset rewrite;
- no Observer/reducer/DB/state-schema change;
- no frontend change unless an independently proven dependency requires it.

## 5. Required source tests

Add focused regressions proving at minimum:

1. Generic active-rule contract contains an explicit request-trigger execution rule for `mode=on_player_request` / request-triggered active rules.
2. The contract is template-agnostic and does not name `masturbate_for_recipient` or other specific CSA IDs.
3. A direct eligible request cannot be converted by Story guidance into refusal/delay/substitution when the active rule itself requires execution.
4. NPC feeling/personality separation remains explicit: compliance does not imply affection/comfort/consent/desire/romance/relationship/trust.
5. Continuous-rule wording and existing work_nude/work_in_underwear behavior remain structurally intact.
6. Literal player action, canonical actor/location, exact-four Story choice law remain intact.

Validation before deploy:
- relevant focused tests;
- full `npm test`;
- `node --check` for changed JS/MJS;
- `git diff --check`;
- compare changed paths and confirm no unrelated runtime/config/migration/frontend change.

Land source only on `main`; no branch/PR.

## 6. PHASE B — TEST rollout

After tests:
- deploy TEST API exactly once only if provider/source changed;
- record exact Worker Version ID;
- do not redeploy frontend if unchanged;
- do not apply any new migration;
- `/api/r3/catalogs` must return HTTP 200 before live replay;
- no Production access.

## 7. PHASE C — exactly one fresh masturbate_for_recipient replay

Do not reuse `7e6e645f...` and do not resubmit its action.

Use ONE fresh disposable current-R3 TEST game.

1. Setup + canonical Opening once.
2. Ensure Opening is committed before CSA apply.
3. Apply `masturbate_for_recipient` once through the real CSA UI with the same eligible scope pattern used by the failed fixture.
4. Prove revision increases while committed_turn does not; active rule readback must include exact content/mode/trigger/scope.
5. Submit exactly one direct eligible request through the real gameplay UI. Keep it semantically equivalent to the failed request and do not weaken it to make the model pass.
6. Capture exact outbound literal/action_id, request/response, SSE Story, Story timing, Observer raw/applied, state_after, canonical context, choices/MM/location/presence/warnings.

### C1. State continuity gate
Must remain GREEN:
- same active rule survives the committed turn;
- no implicit remove;
- revision/committed_turn coherent.

If continuity fails:
STOP `BLOCKED_R3_CSA_STATE_CONTINUITY_REGRESSION_AFTER_TRIGGER_PROMPT_CLOSURE`.
Do not tune Story further in the same task.

### C2. Story execution gate
PASS only if:
- the requested behavior required by the active rule visibly begins in this same Story turn;
- Story does not convert it into refusal, delay, substitution, a future discussion, or ordinary-policy veto;
- exact actor/request semantics are preserved;
- NPC emotional tone/personality may remain negative/guarded/etc.;
- no affection/comfort/consent/desire/romance/trust/relationship is manufactured from rule activation/compliance alone.

If a valid committed sample still refuses/delays/substitutes:
STOP `BLOCKED_R3_GENERIC_ON_PLAYER_REQUEST_STORY_EXECUTION_AFTER_PROMPT_CLOSURE`.
Capture exact active_rules payload + raw Story. No second prompt edit and no second sample in this task.

If PASS:
- remove the same rule once via UI;
- revision increases while gameplay turn remains unchanged;
- play one different ordinary follow-up turn;
- prove active rule absent and Story returns to ordinary behavior without time-rewinding historical/material facts.

Then continue automatically.

## 8. PHASE D — remaining three canonical CSA campaigns

After `masturbate_for_recipient` is accepted, independently cover:
1. `vaginal_sex_with_recipient`;
2. `player_request_executes_immediately`;
3. `continue_until_recipient_orgasm`.

One active rule per disposable fixture where practical.

For each:
`apply -> revision up/turn same -> exact readback -> one materially relevant natural Story turn -> Observer/state/MM/choices -> optional ordinary interleave if needed -> remove -> revision up/turn same -> post-remove Story/readback`.

For request-triggered rules, use the generic trigger contract above. Do not add rule-specific prompt branches from any failure.

Stop on the first deterministic failure; do not sample until pass.

## 9. PHASE E — remaining objective matrix

Continue under the same Task ID after all 9 canonical CSA templates are objectively green.

### E1. Four canonical locations
Fresh fixture. Prove four distinct registered locations full chain:
`literal -> Story exact canonical destination -> observer_raw -> observer_applied -> state_after -> next Story/context/map`.
No fuzzy/generic destination upgrades.

### E2. Presence / scene_note / agency
Prove:
- exact canonical actor-name evidence;
- player movement cannot fabricate NPC enter/exit;
- grounded entrant may receive MM;
- no unrelated/off-scene actors;
- bounded current scene_note with stale ended entities/actions removed.

Agency probes:
- 한리브/lunch must not become 김제나/work;
- `혼자 있고 싶다` respected;
- `허리를 만진다` must not become touching a table edge.

No generic semantic validator/gate.

### E3. Human-like campaigns
Separate fresh fixtures:
- ordinary play 30+ turns;
- materially different style 15+ turns;
- long-memory 50+ turns.

Do not certify ordinary play from a heavily CSA-mutated game.

### E4. Choices / latency / retained surfaces
Collect:
- valid Story exact-four tail rate;
- no-tail rate + max streak;
- Observer exact/mismatch counts;
- zero fabricated/prior fallback;
- choice click literal parity;
- submit -> first Story token -> Story complete -> Observer complete -> commit timings and p50/p95 when sample permits;
- history/export/download if retained;
- reload/reconnect;
- double-submit;
- explicit retry;
- TTS/feedback if retained;
- desktop, 390x844, wider mobile/tablet.

## 10. Stop rules

Immediate terminal BLOCKED on the first deterministic failure that invalidates continued matrix work.

Never:
- retry/sample until pass;
- mutate preserved historical/manual evidence games;
- use direct API gameplay as a substitute for browser acceptance;
- change provider/model/config/timeouts to chase a pass;
- add semantic validators/NER/fuzzy matching/physical ontology/consent DSL/second LLM;
- regenerate Story automatically;
- access Production;
- create a new CURRENT_TASK file, ops branch, recovery branch, or competing task.

## 11. Heartbeats / terminal report

Post `PROGRESS_HEARTBEAT` at meaningful phase boundaries and about every 15 minutes during long live execution.

Terminal report must include:
- Task ID + CURRENT_TASK blob + start/final SHA;
- exact changed paths and tests;
- TEST deploy version(s);
- fresh game IDs and exact literals;
- active-rule payload and raw Story for any CSA failure;
- revision / committed_turn / state continuity evidence;
- choice/MM/location/presence warnings retained for matrix triage;
- explicit first deterministic stop reason;
- confirmation that no retry-until-pass, provider/model change, Production access, preserved-game mutation, new CURRENT_TASK file/branch, or owner handoff occurred.

Continue autonomously until first deterministic blocker or the entire objective matrix is green.