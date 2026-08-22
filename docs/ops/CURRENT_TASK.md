# Company — CURRENT TASK

Status: READY
Task ID: company-r3-continuous-autonomous-live-qa-v1
Mode: HOSPITAL + COMPANY V1 REFERENCE LIVE CALIBRATION -> MULTI-TURN CSA UX REPLAY -> MINIMAL GENERIC FIX ONLY IF PROVEN -> FULL R3 OBJECTIVE LIVE-QA MATRIX
Updated: 2026-08-22 17:14 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file, ops/task-registration branch, recovery branch, or competing execution authority.

## 0. Binding authority and owner intent

This task supersedes the previous terminal stop only because the owner subsequently added binding UX directives and explicitly asked the operator to continue.

Binding authority:
- owner product canon PR #95 `9d9aec5a198d8673eb37aba8a0541adbd6c84627`;
- A-prime engine canon PR #96 `9d44c4719fa6b098d53cac5cf946b93fafa6786b`;
- `docs/redesign/00_*` through `11_*`;
- `docs/ops/AUTONOMOUS_LIVE_QA_LOOP.md`;
- `docs/ops/LIVE_QA_PRODUCT_REVIEW_2026-08-22.md`;
- owner UX calibration directive Issue #68 comment `5379158664`;
- owner CSA live-play addendum Issue #68 comment `5379172519`;
- operator review Issue #68 comment `5379246156`;
- this exact CURRENT_TASK blob once registered by `CURRENT_TASK_READY`.

Owner intent:
- automation, not the owner, must find objective boot/function/agency/location/MM/choices/streaming/memory/CSA/UI/data defects;
- owner final play is only for subjective fun, chemistry, character appeal, tone, pacing and creative taste;
- one green run, RPC success, HTTP 200, unit tests, DOM existence, one Story mention or one specially tailored sentence is never enough;
- run deployed TEST -> human-like browser play -> inspect Story/data/screenshots -> classify -> fix narrowly -> TEST deploy -> replay -> expand -> repeat until the objective matrix is green.

Architecture remains:
`Story 1 call -> Observer 1 call -> small reducer -> atomic commit`.

## 1. Latest terminal — evidence accepted, semantic conclusion reclassified

Reviewed terminal:
- terminal comment: `5379166645`;
- prior task blob: `1640aab7442b8dbddbb2773b2e5d11995fc17a2f`;
- start/final main: `04fa17ce9f205107d8058315cd58545d125fa29e`;
- operator review: `5379246156`.

Accepted executable source remains:
`dd62988a121d586d333e7297b5b7cb4b4d8841d1`.

Accepted TEST identities:
- API `game-proxy-company-r3` version `bad0bbeb-574a-4d82-8875-3ade37df3de8`;
- frontend `gamebuilder-company-r3` version `012186e3-9144-43bb-8c48-521a7bd944bb`.

### 1.1 Infrastructure result — GREEN and frozen

The prior Cloudflare 1042 recovered without mutation and is accepted as:
`1042_PLATFORM_TRANSIENT_RECOVERED`.

Evidence:
- exact direct API workers.dev `/api/r3/catalogs` returned HTTP 200 JSON;
- active API/frontend deployment identities matched accepted TEST baselines;
- fresh browser with explicit `api=` loaded catalogs and usable Setup;
- no compatibility flag, route workaround, source/config edit, deployment, gameplay retry or DB mutation was needed for recovery.

Do not reopen 1042 absent a new deterministic recurrence.

### 1.2 Dedicated clothing fixture — valid commit, but old single-turn judgment is not final UX acceptance

Fixture:
`49d2cbf0-a2aa-4cd1-ba48-8cd418fdf2af`.

Accepted facts:
- `no_panties_under_work_clothes` / `r3_csa_1` applied once through UI;
- `subject_scope=female_employee`;
- canonical required clothing state `underwear_bottom=removed`;
- revision `0 -> 1` while committed_turn stayed `0`;
- exactly one browser action submitted:
  `서원희 차장의 근무복 차림을 잠시 살펴보고 회의 자료를 건넨다.`
- exact literal parity passed;
- Turn 1 committed once, revision `2`, committed_turn `1`;
- no retry/duplicate;
- Story discussed 서원희 and visible outer work clothing;
- Story did not explicitly narrate the hidden no-underwear fact;
- Observer subconscious referenced the premise; active rule/clothing state remained coherent;
- `choices_observer_mismatch` is diagnostic-only when Story choices survive;
- location warning remains pending for the location matrix.

The old terminal classified this as `BLOCKED_ACTIVE_CSA_STORY_PREMISE_AFTER_PROMPT_CLOSURE`.

That conclusion is now reclassified as **insufficient single-turn UX evidence**, not a proven prompt defect, because the later binding owner directives require natural multi-turn behavior rather than mechanical rule exposition. `underwear_bottom=removed` is a hidden clothing slot: merely looking at outer work clothing does not necessarily make it naturally observable. Forcing the narrator to announce hidden underwear status in that turn could itself violate the required CSA feel.

Therefore:
- keep `dd62988...` unchanged initially;
- do not tune Story/provider/model/config before reference calibration and a better behaviorally decisive campaign;
- do not call the old Turn 1 a pass either. It is one valid data point inside an incomplete CSA UX evaluation.

## 2. Global safety / architecture prohibitions

Unless a later phase below proves a narrow exception, do NOT:
- change provider/model/API URL/key/temperature/token budgets/timeouts;
- add automatic Story retry/regeneration, second Story or second choice LLM;
- add generic semantic classifiers/gates, NER, fuzzy/nearest actor/location mapping;
- add physical ontology, consent DSL, rule-specific semantic engine or hidden deterministic narrative author;
- move Story -> Observer -> Commit orchestration into the browser;
- make Observer author/repair/veto valid Story choices;
- fabricate/fallback/copy prior choices when Story lacks a valid exact-four tail;
- infer affection, comfort, private consent, trust, desire, romance, obedience or relationship change merely from CSA activation or sexual events;
- mutate/reset preserved historical/manual/evidence games;
- access/deploy Production;
- use direct API gameplay as a substitute for browser acceptance;
- retry/sample until the model gives a passing answer;
- create a competing CURRENT_TASK or ops/recovery branch.

Provider budgets remain Story first-content 30s / Story total 120s / Observer 75s.

Player agency remains higher priority than CSA narration. Story must not silently replace actor, target/counterparty, action, movement/direction, request/refusal, self-state or topic/intent.

## 3. PHASE A — live reference calibration BEFORE more R3 source edits

Purpose: directly experience the strongest historical UX references so R3 is evaluated against actual player experience, not only contracts.

References:
1. currently runnable Hospital / Gamebuilder v2 TEST experience, if healthy;
2. old complete Company V1 TEST experience, if still healthy.

### A1. Discover exact reference endpoints and deployment identities

Use repository history, Issue #68 evidence and authoritative deployment/Worker metadata. Do not guess URLs from Worker names.

For each reference record:
- exact frontend endpoint and Worker/version identity if available;
- exact API endpoint and Worker/version identity if separate;
- source lineage/reference commit when discoverable;
- whether TEST is currently healthy enough for browser play.

Historical hints are not execution authority. Do not redeploy or repair an old reference merely to make it runnable.

If one reference is unavailable:
- record the exact objective failure/absence;
- do not mutate it;
- continue with the other runnable reference and existing canonical reference docs/evidence;
- reference unavailability alone does not block current R3 QA.

### A2. Human-like browser play on each runnable reference

Use fresh disposable TEST state/game where the reference supports it. Never mutate preserved/manual/evidence games.

Play approximately 8-12 meaningful turns per runnable reference, enough to experience rather than merely smoke-test:
- Setup/Opening;
- at least two authored choices;
- at least two free Korean inputs;
- ordinary company/hospital life that is not task/helpdesk driven;
- one movement/location change;
- one social interaction;
- one refusal/self-directed/change-direction action;
- refresh/readback;
- streaming/loading behavior;
- desktop and a mobile-sized viewport if the reference UI is usable there;
- app/sidecar interactions that are materially comparable.

If a comparable common-sense/CSA feature is genuinely available in that reference, run one bounded representative interaction to understand feel. Do not force a legacy feature that is absent or unhealthy.

### A3. Inspect, do not merely log

For each reference visually inspect screenshots and read actual Story/choices.

Capture qualitative-but-objectively grounded notes on:
- opening immediacy and scene immersion;
- Story streaming visibility and whether loading blocks reading;
- dialogue naturalness and character individuality;
- balance of workplace texture vs adult/social life;
- choice length, specificity and freedom;
- free-input agency;
- movement/scene continuity;
- how app/common-sense changes are introduced and felt;
- whether rule effects feel like ordinary world facts vs system/RPG exposition;
- whether NPC mood/personality remains distinct under changed common sense;
- mobile action-panel usability;
- refresh/recovery feel;
- useful sidebars/MM/history presentation.

Post `PROGRESS_HEARTBEAT` containing a compact comparison:
- `REFERENCE_KEEP`: UX qualities R3 should match or improve;
- `REFERENCE_REJECT`: legacy bugs/architecture/behaviors R3 must not resurrect;
- `R3_GAPS_TO_REPLAY`: objective differences current R3 must now prove/fix.

Do not stop after reference comparison. Continue directly to Phase B.

## 4. PHASE B — fresh multi-turn R3 clothing CSA UX campaign

Use ONE NEW disposable current R3 TEST game. Preserve fixture `49d2...` as evidence; do not reuse it for pass-seeking.

No source/prompt/provider/model/config edits before this campaign.

### B1. Setup + apply

1. Fresh browser Setup + Opening.
2. Apply canonical `no_panties_under_work_clothes` once through the deployed CSA UI.
3. Prove:
   - revision increases;
   - gameplay turn does not;
   - exact rule id/template/content/mode/trigger/strength/scope read back;
   - `underwear_bottom=removed` is present for intended scoped actors;
   - no unrelated sexual/relationship state is manufactured.
4. Record relevant current actor/location/scene state.

### B2. Ordinary active-rule turn — forced exposition is NOT required

Submit one ordinary company-life action that does not directly ask about underwear or the rule, for example:
`서원희 차장에게 오늘 회의 자료의 검토 순서를 묻는다.`

Acceptance:
- Story preserves literal actor/target/action/topic;
- Story does not contradict the active rule;
- Story is allowed to omit explicit hidden-underwear exposition when it is not naturally relevant/observable;
- Story must not become CSA-obsessed or mechanically explain the rule;
- NPC personality remains normal and specific;
- Observer/state/MM/choices remain coherent.

This turn is a naturalness check, not the decisive rule-surface check.

### B3. Movement + refresh continuity

While the rule is still active:
- perform one natural movement to a registered canonical location through the real UI/free input;
- refresh once after commit;
- prove same save/API/game id returns;
- prove active rule still exists;
- prove four finite clothing slots stay coherent;
- prove broad female scope does NOT cause Story to enumerate unrelated/off-scene women;
- inspect current Story/location/presence/MM after refresh.

Do not certify the entire location matrix from this one step; dedicated location proof remains later.

### B4. Behaviorally decisive direct policy conversation

Now submit one natural direct inquiry that genuinely concerns the hidden clothing-policy domain without copying the rule text:
`서원희 차장에게 요즘 여성 직원 근무복 규정에서 속옷 관련 기준이 있는지 묻는다.`

This is decisive because the player is explicitly asking about the policy domain. It does not require x-ray-like visual access and does not copy the canonical rule sentence.

Capture:
- exact literal/request;
- exact `active_rules` Story input if diagnostics expose it;
- streamed raw Story;
- Observer raw/applied;
- state_after/readback;
- clothing/MM/choices/location/presence;
- timings;
- screenshot and console/network state.

PASS behavior:
- Story answers/acts consistently with the active institutional premise;
- exact scope is preserved;
- the premise feels like an already-existing company/world fact, not hypnosis, spell, system message, narrator dump or OOC protocol;
- Story need not quote canonical wording verbatim;
- NPC retains individual tone/mood/personality;
- active rule does not manufacture affection, comfort, consent, desire, romance, obedience, trust or relationship change;
- player action/topic is not substituted.

FAIL behavior:
- direct policy discussion contradicts the active canonical rule;
- direct policy discussion materially avoids/denies the relevant rule such that the active world fact is absent;
- Story changes subject/target/topic to escape the request;
- Story turns the rule into magical/system exposition or universal personality overwrite.

A valid deterministic FAIL here authorizes Phase C. Do not run another semantic sample before classification.

### B5. Ordinary-life interleaving while CSA remains active

If B4 is green, submit one different mundane/nonsexual company-life turn.

Prove:
- Story returns naturally to ordinary life;
- the rule is not unnecessarily repeated;
- active rule still constrains the world if naturally implicated;
- game does not become permanently CSA-focused.

### B6. Remove semantics — NO time rewind

Remove the same rule once through browser UI.

Prove:
- revision increases while gameplay turn does not;
- rule disappears from `csa_active` and future Story context;
- refresh/readback remains coherent.

Then play one or two ordinary follow-up turns.

Important acceptance law:
- removing the rule stops future world-law enforcement;
- removal is NOT a memory wipe, time rewind or automatic restoration of every committed physical/social fact;
- `underwear_bottom` does NOT have to flip instantly back to `worn` merely because the rule is removed;
- prior conversation about the old rule may remain remembered as history;
- what must stop is treating the removed rule as a currently binding institutional requirement in new Story.

If needed, a later natural policy check may establish that the rule is no longer currently governing, but do not force retroactive contradiction of committed history.

Post a Phase-B heartbeat with transcripts/evidence and explicit `CLOTHING_CSA_UX: PASS` or the exact deterministic blocker.

## 5. PHASE C — only if the better campaign proves a deterministic Story-contract defect

Do NOT enter this phase merely because old fixture `49d2...` omitted hidden underwear during visual observation.

Enter only if B4/B6 gives a valid deterministic contradiction/ignore/enforcement-after-remove defect.

Before editing source:
- capture exact active rule input, literal and raw Story;
- compare against Hospital/V1 reference qualities from Phase A;
- identify the narrow missing Story contract.

Permitted correction:
- smallest generic Story/context clarification only;
- distinguish hidden-state observability from explicit direct discussion of an active rule's policy domain;
- when player/NPC dialogue directly asks about a domain governed by an active rule, Story must answer consistently with that active current-world fact;
- hidden facts must NOT be visually exposed without narrative basis;
- irrelevant scenes must NOT force exposition;
- no template-id-specific if/else, keyword gate, semantic classifier, second LLM or provider/model/config workaround.

Validation if source changes:
- add focused regression tests for generic active-rule policy consistency and non-forced hidden-state exposition contract;
- run relevant focused tests;
- full `npm test`;
- changed JS/MJS `node --check`;
- `git diff --check`;
- reread Issue #68 immediately before landing;
- fast-forward only on `main`;
- deploy TEST API only if API source changed;
- record exact Worker Version ID;
- no frontend deploy unless frontend source actually changed.

Then replay ONE fresh equivalent multi-turn clothing campaign from B1-B6. No retry-until-pass.

If the corrected replay still deterministically fails, terminal BLOCKED with raw evidence; do not keep tuning.

If green, continue automatically to Phase D.

## 6. PHASE D — CSA is a first-class live-UX acceptance axis

Use dedicated disposable CSA fixtures separate from clean ordinary-play fixtures. Prefer one active canonical rule per fixture/campaign so rules do not contaminate each other's evidence.

Canonical R3 nine templates are exactly:
1. `no_panties_under_work_clothes`
2. `no_bra_under_work_clothes`
3. `target_places_requester_hand_on_waist_or_thigh`
4. `work_nude`
5. `masturbate_for_recipient`
6. `work_in_underwear_only`
7. `vaginal_sex_with_recipient`
8. `player_request_executes_immediately`
9. `continue_until_recipient_orgasm`

For every template prove through real browser play:
`apply -> exact rule/scope readback -> one or more materially relevant Story turns -> Observer/state continuity -> browser refresh/readback -> remove -> later Story no longer governed by removed rule`.

Transaction/state success alone is insufficient.

### D1. Global CSA feel requirements

Across campaigns verify:
- changed common sense feels like an already-existing social/world fact;
- no repeated rule quotations or system/narrator explanation dumps;
- NPC personalities, speech styles, embarrassment/annoyance/curiosity/hesitation and relationship history remain character-specific;
- institutional normality does not automatically equal affection/comfort/consent/desire/romance/obedience/trust;
- conversely, NPCs should not all react as if the rule itself is an impossible violation when the premise is socially ordinary under the changed common sense;
- distinguish socially ordinary premise from each character's personal mood/preferences/relationship;
- no off-scene/unrelated NPC prose leakage;
- player agency outranks CSA narration except where exact active rule/physical fact truly constrains feasibility;
- explicit request, refusal, leaving/changing direction/end-interaction is preserved;
- no generic semantic validator/gate is added to enforce these outcomes.

### D2. Scope behavior

Test representative subject/counterparty scopes where the template supports them.

Prove:
- intended subjects are affected;
- unrelated/off-scene actors are not narratively injected;
- unary rules do not invent a counterparty;
- request/contact rules preserve the selected counterparty literally;
- broad scopes do not trigger prose enumeration of everyone in state.

### D3. Clothing campaign requirements

At least one clothing-rule campaign must include:
- active rule across movement;
- browser refresh;
- scene change;
- finite clothing-slot coherence;
- no unrelated sexual/relationship inference;
- ordinary-life interleaving;
- nuanced remove behavior with no automatic time rewind.

### D4. Request/contact campaign — two personalities

Use at least two distinct registered NPC personalities across the request/contact rule class.

Verify:
- natural dialogue/action consequences;
- interruption/follow-up;
- leaving or changing subject;
- at least one non-work scene where practical;
- selected target/counterparty fidelity;
- different characters do not collapse into one universal compliant voice.

### D5. Strong-rule campaign

For at least one strong rule, play several consecutive turns before/during/after activation.

Must include:
- player changing direction;
- player refusal or request to stop/change the ongoing interaction;
- player ending/leaving an interaction when not physically/rule-impossible;
- later mundane turn.

Reject repetitive, robotic or universally compliant narrative. One explicit sentence is not proof.

### D6. Mobile CSA UI

At 390x844 and one wider mobile/tablet viewport:
- open CSA UI;
- apply/update/remove as allowed;
- return to Story;
- confirm no overlay blocks streaming/readability;
- controls reachable/scrollable;
- action panel remains usable.

### D7. Completion threshold

Before CSA can be called green:
- all 9 templates have apply + relevant Story + remove + post-remove Story evidence;
- clothing movement/refresh campaign green;
- request/contact two-personality campaign green;
- strong multi-turn direction/refusal/end-interaction campaign green;
- scope leakage checks green;
- mundane/nonsexual interleaving green;
- mobile CSA UI green;
- transcripts/screenshots/readback evidence inspected, not just logged.

## 7. PHASE E — replay current R3 against the combined reference UX

After CSA source/behavior is stable, run current R3 again with the explicit Phase-A `REFERENCE_KEEP`/`REFERENCE_REJECT` notes.

Do not blindly copy old UI or architecture. Fix only objective regressions where R3 is demonstrably worse against current canon/product goals.

Review:
- Opening immersion and app discovery;
- Story streaming visibility/no blocking loader;
- ordinary company-life vs work-task funnel balance;
- character individuality;
- dialogue naturalness;
- choice usefulness/length and free-input freedom;
- app/common-sense interaction flow;
- movement/scene continuity;
- MM usefulness;
- refresh/recovery;
- mobile action-panel usability;
- history/TTS/feedback/download retained behavior if current canon retains them.

If Codex ever stops after Phase A reference comparison without a fresh current-R3 replay, re-kick this SAME task at the safe boundary. Do not register a competing task.

## 8. PHASE F — remaining objective R3 campaigns

After the CSA/reference-calibrated source is green, continue without owner handoff.

### F1. Dedicated four-location chain

Use a NEW disposable fixture and at least four distinct registered canonical locations.

For each movement prove:
`literal exact canonical destination -> Story exact canonical destination name -> observer_raw exact quote -> observer_applied -> state_after -> next Story/context/map`.

No fuzzy/nearest mapping or generic room upgrade.

### F2. Presence + scene_note

Presence:
- exact canonical actor-name evidence for enter/exit;
- player movement alone cannot create NPC enter/exit;
- same-turn grounded entrant may receive MM;
- off-scene named references do not inject actors.

`scene_note`:
- bounded current-scene snapshot;
- ended people/objects/actions disappear rather than accumulate stale history.

### F3. Semantic agency regressions

Human-like scenarios must preserve actor, target, action, movement/direction, request/refusal, self-state and topic/intent.

Explicit historical regression targets:
- asking 한리브 about lunch must not become 김제나/work talk;
- `혼자 있고 싶다` / being alone must be narratively respected;
- `허리를 만진다` must not become touching a table edge.

Do not build a semantic gate. Inspect actual Story.

### F4. Fresh primary 30+ campaign

Run a NEW 30+ turn current-source campaign after all current fixes.

The old clean-30 `4debc85b-2e19-4d0b-96cb-177e7379df1e` remains frozen historical choice/retry evidence and must not be rerun merely to improve statistics, but it is not sufficient as final post-fix product acceptance.

New primary campaign must include:
- multiple locations;
- multi-NPC scenes;
- off-scene named reference;
- positive, negative/refusal and self-directed actions;
- choice/free-input alternation;
- refresh after commit;
- one naturally occurring recovery path if encountered, never manufactured pass-seeking;
- screenshots/console/network inspection;
- full literal -> Story -> Observer raw/applied -> state -> next Story semantic review on critical/sample turns.

### F5. Independent 15+

Fresh second game, materially different route/action style. Purpose: catch scenario overfitting.

### F6. Long-memory 50+

Fresh game, 50+ turns.

Verify:
- recent continuity;
- older summaries after raw-window roll-off;
- summaries actually change/update;
- revisit older people/locations/topics after detours;
- no opening-only freeze/mojibake;
- no deterministic semantic memory invention;
- next Story actually consumes valid older context.

### F7. Choice reliability

Story remains sole choice author.

Track valid exact-four terminal Story tails vs no-tail occurrences across new campaigns. No regeneration, prior fallback or deterministic fabricated choices. Free input must remain usable when choices are absent.

`choices_observer_mismatch` is nonblocking when Story-tail choices survive exactly.

### F8. Latency

Capture:
- submit -> response headers if available;
- submit -> first Story token;
- Story total;
- Story complete -> Observer complete;
- Observer complete -> commit;
- full submit -> next-action-ready.

Derive p50/p95 when enough samples exist. Investigate material stalls/outliers; do not pass them merely because they eventually finish.

### F9. Retained surfaces / viewports

Verify retained current-canon behavior for:
- history;
- export/download;
- reconnect/reload;
- duplicate submit fencing;
- explicit failed-job retry if naturally available;
- TTS;
- feedback if retained;
- desktop;
- 390x844;
- wider mobile/tablet.

Screenshots must be visually inspected.

## 9. Source-fix discipline for any later objective defect

For any new blocker:
1. capture one deterministic reproducer/evidence chain;
2. classify the exact boundary;
3. prefer the smallest source correction at that boundary;
4. no generic semantic authority layer;
5. focused regression test;
6. full tests + syntax + diff-check;
7. reread Issue #68 before landing/deploy;
8. FF-only main;
9. TEST deploy only affected Worker(s);
10. replay the same reproducer once;
11. then run broader campaign so a focused green does not become false acceptance.

No retry-until-pass or provider/model/config workaround.

## 10. Heartbeats and terminal policy

Post `PROGRESS_HEARTBEAT`:
- after reference endpoint discovery;
- after Hospital/V1 comparison;
- after R3 clothing campaign decisive policy turn;
- after any source landing/deploy/replay;
- at each CSA class boundary;
- at 30/15/50 campaign boundaries;
- about every 15 minutes during long execution.

A heartbeat must include actual partial findings, not only 'still running'.

Do NOT terminal merely because:
- reference comparison finished;
- one CSA rule passed;
- one source fix passed focused tests;
- one 5/15/30 turn campaign committed;
- RPC/state/readback is green without Story/browser UX review.

Terminal BLOCKED is appropriate when:
- a deterministic objective defect remains after the one authorized narrow correction/replay;
- platform/infrastructure prevents further safe TEST play and no bounded recovery is proven;
- a new authority conflict appears;
- required reference/live evidence cannot be obtained without forbidden mutation.

Terminal PASS/OWNER_READY is permitted only when the entire objective matrix is green:
- reference-calibrated current R3 replay;
- all 9 CSA UX campaigns and special CSA axes;
- four-location/presence/scene_note/agency;
- fresh primary 30+;
- independent 15+;
- long-memory 50+;
- choices/latency/retained surfaces;
- desktop/mobile;
- no unresolved objective Story/data/browser mismatch.

At that point owner testing is limited to subjective taste, chemistry, fun, character appeal, pacing/tone and creative choice quality.

Terminal report must include:
- exact task blob/start/final main;
- changed paths and commit(s);
- tests/syntax/diff checks;
- exact TEST Worker versions;
- reference endpoints/identities and comparison summary;
- all disposable fixture IDs;
- representative literal/Story/Observer/state evidence;
- CSA rule-by-rule matrix;
- 30/15/50 campaign summaries;
- choice and latency statistics;
- screenshots/viewports inspected;
- warnings classified diagnostic vs blocker;
- explicit forbidden-operation audit.
