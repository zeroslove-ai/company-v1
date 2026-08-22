# Company — CURRENT TASK

Status: READY
Task ID: company-r3-continuous-autonomous-live-qa-v1
Mode: STRUCTURED REQUEST-TIMING CONTRACT -> ONE VAGINAL RULE REPLAY -> REMAINING 2 CSA -> FULL OBJECTIVE LIVE-QA MATRIX
Updated: 2026-08-22 19:14 KST
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
- operator review `5379723325`;
- this exact CURRENT_TASK blob once registered by `CURRENT_TASK_READY`.

Architecture remains:
`Story 1 call -> Observer 1 call -> small reducer -> atomic commit`.

`OWNER_READY` / `WAITING_USER_FINAL_PLAYTEST` remain forbidden until the complete objective QA matrix is green.

## 1. Accepted/frozen evidence

Reviewed terminal:
- terminal comment `5379710154`;
- previous task blob `6b1019bc09a081fcffdcc70907ed733604418415`;
- execution start main `0e38fbec3e102674b4db724833d3d3a680f77838`;
- accepted/current executable main `76521fb24846747867521664f37b6f319aeffce4`;
- operator review `5379723325`.

Current TEST identities:
- API `game-proxy-company-r3` version `17e15e3a-aba3-45fb-a9e8-86786841c208`;
- frontend `gamebuilder-company-r3` version `c297425c-3fa8-4025-a514-5ac908606c36`.

### 1.1 Opening/CSA concurrency — CLOSED and frozen

Source `2f30b62d...`, migration `20260822000200_company_r3_opening_revision_fence.sql`, and their live replay remain accepted. Do not reopen without new deterministic evidence.

### 1.2 Generic request-trigger textual prompt boundary — accepted partial and frozen

Source `76521fb...` changed only:
- `runtime-r3/server/provider.js`;
- `test/r3-opening-contract.test.mjs`.

Accepted validation:
- focused 32/32 PASS;
- full 475/475 PASS;
- syntax and `git diff --check` PASS;
- one TEST API deploy only.

The provider prompt now already says, generically, that when an active request-triggered rule is directly triggered by the current eligible literal request, its required behavior must begin in the same Story turn and may not be refused, delayed, substituted, or routed to a future discussion. Do not merely append more equivalent prose in the next cut.

### 1.3 Accepted CSA campaigns — GREEN and frozen

Do not rerun for pass-seeking:
1. `no_panties_under_work_clothes`;
2. `no_bra_under_work_clothes`;
3. `target_places_requester_hand_on_waist_or_thigh`;
4. `work_nude`;
5. `work_in_underwear_only`;
6. `masturbate_for_recipient` fresh fixture `9f265381-8cae-4c4c-925e-6e43d6ca8a3e` through apply -> same-turn Story execution -> state continuity -> remove -> ordinary post-remove turn.

Retain but do not fix opportunistically here:
- `location_projection_dropped` observed in the accepted masturbation turn;
- `choices_observer_mismatch` observed in the ordinary post-remove turn.
They belong to later matrix triage unless they become the first deterministic blocker.

## 2. Current decisive blocker

Preserved disposable fixture:
`9f265381-8cae-4c4c-925e-6e43d6ca8a3e`.

After the accepted masturbation campaign was removed and one ordinary interleave committed:
- `vaginal_sex_with_recipient` was applied once through the real UI;
- revision became 5 while committed_turn remained 2;
- active `r3_csa_2` read back coherently;
- exact intended immediate request was submitted once through UI and stored literally;
- turn committed once at revision 6 / committed_turn 3;
- active rule remained present;
- Observer/state were coherent and warnings were empty;
- Story did NOT begin the required behavior in that turn. It converted the request into a promise to do it later at lunch/in a meeting room.

Classification:
`BLOCKED_R3_GENERIC_ON_PLAYER_REQUEST_STORY_EXECUTION_AFTER_PROMPT_CLOSURE`.

This is not a state, transport, literal, Observer, or DB failure. It is selective future deferral despite the existing textual same-turn contract.

Do not mutate or remove the preserved active rule in this fixture. Do not replay its blocked action.

## 3. Architecture conclusion from the blocker

The existing prompt already explicitly says:
- begin in the same Story turn;
- do not refuse;
- do not delay;
- do not substitute;
- do not route to a future discussion.

Therefore the next cut must NOT be another equivalent prose-only prompt escalation.

Current Story context already transports each active rule's canonical:
`id`, `template_id`, `content`, `mode`, `trigger`, `strength`, `subject_scope`, `counterparty_scope`.

The missing bounded authority is a machine-readable execution-timing contract attached to request-triggered rules. Add only this timing metadata, derived strictly from existing canonical `mode` / `trigger` metadata. The rule's `content` remains the sole behavior meaning.

Story remains the sole semantic/narrative authority. Runtime must NOT decide whether arbitrary player prose semantically satisfies a request trigger.

## 4. PHASE A — add one generic structured execution-timing projection

Implement the smallest generic projection in the Story context.

For an active rule whose canonical metadata identifies it as request-triggered (`mode=on_player_request` and/or the existing canonical request-trigger value), project a bounded object equivalent to:

```json
{
  "request_triggered": true,
  "when_triggered": "same_story_turn",
  "future_deferral_allowed": false
}
```

Exact field names may differ if a cleaner bounded contract fits current source conventions, but semantics must remain exactly this narrow.

Requirements:
- derive it ONLY from the active rule's existing canonical `mode` / `trigger` metadata;
- do not inspect player text to set this object;
- do not infer actor/action meaning in runtime;
- do not copy/recreate the rule behavior in structured fields;
- `content` remains the only behavior semantics;
- continuous rules must not be mislabeled request-triggered;
- Story prompt may be minimally refactored to say this structured timing contract is authoritative once Story recognizes the stated trigger, but do not add another long sexual/request-specific instruction block.

Forbidden:
- no template-ID branch;
- no sexual keyword classifier;
- no semantic matcher/router/gate;
- no NER/fuzzy/nearest matching;
- no physical ontology or behavior DSL;
- no consent DSL;
- no deterministic outcome executor;
- no second Story/choice LLM;
- no hidden retry/regeneration;
- no content preset rewrite;
- no provider/model/temperature/token/timeout/config change;
- no Observer/reducer/DB/schema/frontend change unless independently proven necessary.

## 5. Required source tests

Add focused tests proving at minimum:

1. A request-triggered active rule gets the structured timing object.
2. A continuous active rule does not get request-trigger timing.
3. Timing metadata is derived only from `mode` / `trigger`; no literal-action semantic classifier or template-ID list is introduced.
4. The timing object contains no rule behavior/action meaning copied from content.
5. Story contract treats `same_story_turn` + `future_deferral_allowed=false` as authoritative after Story recognizes the request trigger.
6. Existing literal-action preservation, canonical actor/location rules, exact-four Story choice law, and affection/comfort/consent/desire/romance/trust/relationship separation remain intact.
7. Existing accepted work_nude / work_in_underwear / masturbation contracts remain structurally compatible; do not replay them live.

Validation before deploy:
- relevant focused tests;
- full `npm test`;
- `node --check` for every changed JS/MJS;
- `git diff --check`;
- changed-path review proving no unrelated runtime/config/migration/frontend change.

Land source only on `main`; no new branch or PR.

## 6. PHASE B — TEST rollout

After source validation:
- deploy TEST API exactly once if runtime/provider context source changed;
- record exact Worker Version ID;
- do not redeploy frontend if unchanged;
- no migration;
- `/api/r3/catalogs` HTTP 200 before live replay;
- no Production access.

## 7. PHASE C — exactly one fresh vaginal_sex_with_recipient replay

Do not reuse or mutate `9f265381...`.

Use ONE new disposable current-R3 TEST game.

1. Setup + canonical Opening once; Opening must be committed before CSA apply.
2. Apply `vaginal_sex_with_recipient` once through the real CSA UI using the same eligible human scope pattern as the preserved failure.
3. Prove revision increases while committed_turn does not.
4. Read back exact active rule plus the new structured execution-timing metadata in the Story context/payload if observable.
5. Submit exactly one direct immediate eligible request through real gameplay UI. Keep it semantically equivalent to the preserved failed request; do not weaken or euphemize it to seek a pass.
6. Capture network/SSE, exact literal/action_id, raw Story, Observer raw/applied, state_after, canonical context, choices/MM/location/presence/warnings, and timings.

### C1. State/literal gate
Must remain GREEN:
- exact submitted literal stored;
- active rule survives;
- revision/committed_turn coherent;
- no implicit remove;
- no duplicate request/retry.

If this fails, STOP on that concrete regression. Do not proceed to semantic judgment.

### C2. Same-turn execution gate
PASS only if:
- Story recognizes the direct eligible request as satisfying the active rule's stated trigger;
- the rule-required behavior visibly begins in this same Story turn;
- Story does not convert it into refusal, postponement, promise, future meeting/location, substitution, negotiation, or ordinary-policy veto;
- exact actor/request semantics remain intact;
- NPC emotional tone/personality may remain reluctant, angry, embarrassed, surprised, guarded, etc.;
- compliance alone does not manufacture affection, comfort, consent, desire, romance, trust, relationship, or obedience-as-personality.

If a valid committed replay still refuses/delays/substitutes despite coherent active rule + structured timing contract:
STOP exactly:
`BLOCKED_R3_PROVIDER_OR_MODEL_CANNOT_HONOR_CANONICAL_REQUEST_RULE`

Include raw active rule/timing payload + exact Story.

After this stop:
- do NOT make a third prompt/context tuning loop;
- do NOT sample the same rule again;
- do NOT change provider/model/config automatically;
- do NOT weaken the rule/request;
- do NOT add deterministic semantic execution/gates.

If PASS:
- remove the rule once via UI;
- prove revision rises while gameplay turn stays unchanged;
- play one different ordinary follow-up turn;
- prove active rule/timing metadata are gone and no historical facts are time-rewound.

Then continue automatically.

## 8. PHASE D — remaining two canonical CSA campaigns

After the vaginal rule is objectively accepted, cover:
1. `player_request_executes_immediately`;
2. `continue_until_recipient_orgasm`.

Use separate disposable fixtures where practical and one active rule at a time.

For `player_request_executes_immediately`:
- apply once;
- make one concrete eligible request;
- require same-turn start;
- remove/post-remove once.

For `continue_until_recipient_orgasm`:
- first establish a coherent currently ongoing relevant behavior through ordinary Story interaction without activating a second CSA rule;
- apply the rule once;
- issue one direct eligible continue request;
- require continuity of the existing behavior according to the active rule without inventing unrelated relationship/affection state;
- remove/post-remove once.

For each:
`apply -> revision up/turn same -> readback -> one relevant Story turn -> Observer/state/MM/choices -> remove -> revision up/turn same -> post-remove Story/readback`.

Stop on first deterministic failure. Never sample-until-pass or add rule-specific prompt branches.

## 9. PHASE E — full remaining objective matrix

Only after all 9 canonical CSA templates are objectively green, continue under the same Task ID.

### E1. Four canonical locations
Fresh fixture. Prove four distinct registered canonical locations full chain:
`literal -> Story exact destination -> observer_raw -> observer_applied -> state_after -> next Story/context/map`.
No fuzzy/generic destination upgrades.

### E2. Presence / scene_note / agency
Prove:
- exact canonical actor evidence;
- player movement cannot fabricate NPC enter/exit;
- relevant grounded entrant may receive MM;
- no unrelated/off-scene actors;
- scene_note is a bounded current snapshot and stale ended actions/entities disappear.

Agency probes include:
- 한리브/lunch must not become 김제나/work;
- `혼자 있고 싶다` must be respected;
- `허리를 만진다` must not become touching a table edge.

No generic semantic hard gate/classifier.

### E3. Human-like campaigns
Separate fresh fixtures:
- ordinary play 30+ turns;
- materially different style 15+ turns;
- long-memory 50+ turns.

Do not certify ordinary play from a CSA-heavy fixture.

### E4. Choices / latency / retained surfaces
Collect:
- Story exact-four valid-tail rate;
- no-tail rate + max streak;
- Observer exact/mismatch counts;
- zero fabricated/prior fallback;
- choice literal click parity;
- submit -> first Story token -> Story complete -> Observer complete -> commit timings with p50/p95 when sample permits;
- history/export/download if retained;
- reload/reconnect;
- duplicate submit;
- explicit failed retry;
- TTS/feedback if retained;
- desktop, 390x844, wider mobile/tablet.

The previously recorded `location_projection_dropped` and `choices_observer_mismatch` warnings must be triaged honestly during this matrix; they are not silently waived.

## 10. Stop rules

Immediate terminal BLOCKED on the first deterministic failure that invalidates continued work.

Never:
- retry/sample until pass;
- mutate preserved evidence/manual games;
- use direct API gameplay as a substitute for browser acceptance;
- change provider/model/config/timeouts to chase a pass;
- add semantic validators, NER, fuzzy matching, physical ontology, consent DSL, deterministic sexual/behavior executor, or second LLM;
- regenerate Story automatically;
- access Production;
- create a new CURRENT_TASK file, ops branch, recovery branch, or competing execution authority.

## 11. Heartbeats / terminal report

Post `PROGRESS_HEARTBEAT` at meaningful phase boundaries and about every 15 minutes during long QA.

Terminal report must include:
- Task ID + CURRENT_TASK blob + start/final SHA;
- exact changed paths/tests;
- TEST deploy version(s);
- fresh game IDs and exact literals;
- structured timing payload and raw Story for any request-rule failure;
- revision / committed_turn / state continuity evidence;
- Observer/state/MM/choice/location/presence warnings;
- first deterministic stop reason;
- confirmation of no retry-until-pass, provider/model/config change, Production access, preserved-game mutation, new CURRENT_TASK file/branch, or owner handoff.

Continue autonomously until the first deterministic blocker or the entire objective matrix is green.